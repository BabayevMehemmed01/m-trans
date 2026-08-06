// ============================================================
// FAYL: server/db/index.js
// TƏSVİR: PostgreSQL bağlantı hovuzu (pool) və sorğu qatı.
//
//  SQL INJECTION MÜDAFİƏSİ:
//  Bu modul YALNIZ parametrləşdirilmiş sorğuları ($1, $2 ...)
//  qəbul edir. `query()` funksiyası mətn birləşdirməsi ilə
//  qurulmuş, lakin parametr verilməyən şübhəli sorğuları
//  aşkarlayıb development rejimində xəbərdarlıq edir.
//  Repozitoriya qatından kənarda birbaşa SQL yazılmır.
//
//  DAVAMLILIQ:
//  PostgreSQL mərkəzi anbardır — mock data ilə əvəzlənmir.
//  Bağlantı itərsə server "degraded" rejimə keçir, məlumat
//  endpoint-ləri 503 qaytarır (səhv məlumat vermir!) və
//  arxa planda avtomatik yenidən qoşulma cəhdi edilir.
// ============================================================

'use strict';

const { Pool } = require('pg');
const config   = require('../config/env');
const { createLogger } = require('../utils/logger');

const log = createLogger('DB');

let pool = null;
let ready = false;
let lastError = null;
let reconnectTimer = null;
let shuttingDown = false;

// ── Statistika (health endpoint üçün) ────────────────────────────
const stats = { queries: 0, errors: 0, slowQueries: 0, connectedAt: null };

// ── Pool yaradılması ─────────────────────────────────────────────

function buildPool() {
  const instance = new Pool({
    connectionString:        config.db.connectionString,
    max:                     config.db.poolMax,
    min:                     config.db.poolMin,
    idleTimeoutMillis:       config.db.idleTimeoutMs,
    connectionTimeoutMillis: config.db.connectTimeoutMs,
    ssl:                     config.db.ssl ? { rejectUnauthorized: false } : false,
    // Hər sessiyada sorğu vaxt limiti — asılıb qalmış sorğu
    // bütün hovuzu bloklamasın (DoS müdafiəsi).
    statement_timeout:                   config.db.statementTimeoutMs,
    idle_in_transaction_session_timeout: 30_000,
    application_name:                    'm-trans-api',
  });

  // Boşdayan klientdə xəta baş verərsə proses çökməsin
  instance.on('error', (err) => {
    stats.errors += 1;
    lastError = err.message;
    log.error('Hovuzda gözlənilməz xəta', { message: err.message });
    markDisconnected();
  });

  return instance;
}

function markDisconnected() {
  if (!ready) return;
  ready = false;
  log.warn('PostgreSQL bağlantısı itdi → degraded rejim. Yenidən qoşulma cəhdi planlaşdırıldı.');
  scheduleReconnect();
}

function scheduleReconnect() {
  if (reconnectTimer || shuttingDown) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await connect({ silent: true });
      log.info('PostgreSQL bağlantısı bərpa olundu.');
    } catch {
      scheduleReconnect();
    }
  }, config.db.retryIntervalMs);
  // Timer prosesin bağlanmasına mane olmasın
  if (reconnectTimer.unref) reconnectTimer.unref();
}

// ── Bağlantı ─────────────────────────────────────────────────────

/**
 * PostgreSQL-ə qoşulur və bağlantını yoxlayır.
 * @param {{silent?: boolean}} options
 * @returns {Promise<boolean>}
 */
async function connect(options = {}) {
  if (!config.db.configured) {
    throw new Error('DATABASE_URL təyin edilməyib.');
  }

  if (!pool) pool = buildPool();

  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    ready = true;
    lastError = null;
    stats.connectedAt = new Date().toISOString();
    if (!options.silent) {
      const { rows } = await client.query('SELECT current_database() AS db, version() AS v');
      log.info('PostgreSQL bağlantısı uğurlu', {
        database: rows[0].db,
        version:  String(rows[0].v).split(',')[0],
        poolMax:  config.db.poolMax,
      });
    }
    return true;
  } finally {
    client.release();
  }
}

/**
 * Server başlanğıcı üçün: qoşulmağa BİR DƏFƏ cəhd edir, alınmazsa
 * serveri BLOKLAMIR — xəbərdarlıq loglayır və arxa planda
 * `scheduleReconnect` dövrəsinə buraxır (DATABASE_URL düzgündürsə,
 * Postgres sonradan ayağa qalxanda server avtomatik qoşulur).
 *
 * @returns {Promise<boolean>} — ilk cəhd uğurlu oldumu
 */
async function connectWithRetry() {
  try {
    await connect();
    return true;
  } catch (err) {
    lastError = err.message;
    log.error('İlkin PostgreSQL qoşulması alınmadı — degraded rejimdə başladılır', {
      message: err.message,
    });
    scheduleReconnect();
    return false;
  }
}

// ── Sorğu icrası ─────────────────────────────────────────────────

/** Şübhəli (parametrsiz interpolyasiya) sorğuları aşkarlayır. */
function assertParameterized(text, params) {
  if (config.IS_PROD) return;
  const hasPlaceholder = /\$\d/.test(text);
  const looksInterpolated = /'\s*\|\|/.test(text) || /=\s*'[^']*\$\{/.test(text);
  if (looksInterpolated || (params.length === 0 && hasPlaceholder)) {
    log.warn('Şübhəli SQL nümunəsi aşkarlandı — parametrləşdirməni yoxlayın', {
      sql: text.slice(0, 160),
    });
  }
}

class DatabaseUnavailableError extends Error {
  constructor(message = 'Verilənlər bazası hazırda əlçatmazdır.') {
    super(message);
    this.name = 'DatabaseUnavailableError';
    this.statusCode = 503;
    this.expose = true;
  }
}

/**
 * Parametrləşdirilmiş SQL sorğusu icra edir.
 *
 * @param {string} text — $1, $2 ... yer tutucuları ilə SQL
 * @param {Array}  params — dəyərlər (heç vaxt SQL mətninə yapışdırılmır)
 * @param {{allowWhenDegraded?: boolean}} options
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = [], options = {}) {
  if (!pool || (!ready && !options.allowWhenDegraded)) {
    throw new DatabaseUnavailableError();
  }

  assertParameterized(text, params);

  const startedAt = Date.now();
  try {
    const result = await pool.query(text, params);
    stats.queries += 1;

    const elapsed = Date.now() - startedAt;
    if (elapsed > config.db.slowQueryMs) {
      stats.slowQueries += 1;
      log.warn('Yavaş sorğu', { ms: elapsed, sql: text.replace(/\s+/g, ' ').slice(0, 140) });
    }
    return result;
  } catch (err) {
    stats.errors += 1;
    // Bağlantı səviyyəli xətalar → degraded rejim
    if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EPIPE', '57P01', '08006', '08003'].includes(err.code)) {
      markDisconnected();
    }
    log.error('Sorğu xətası', {
      code: err.code,
      message: err.message,
      sql: text.replace(/\s+/g, ' ').slice(0, 140),
    });
    throw err;
  }
}

/**
 * Bir neçə sorğunu tranzaksiya daxilində icra edir.
 * Xəta olarsa tam ROLLBACK edilir.
 *
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} handler
 * @returns {Promise<T>}
 */
async function transaction(handler) {
  if (!pool || !ready) throw new DatabaseUnavailableError();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      log.error('ROLLBACK alınmadı', { message: rollbackErr.message });
    }
    throw err;
  } finally {
    client.release();
  }
}

// ── Sağlamlıq və bağlanma ────────────────────────────────────────

async function health() {
  if (!pool) return { ok: false, reason: 'pool yaradılmayıb' };
  try {
    const startedAt = Date.now();
    await pool.query('SELECT 1');
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
      stats,
    };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

async function close() {
  shuttingDown = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
    ready = false;
  }
}

module.exports = {
  connect,
  connectWithRetry,
  query,
  transaction,
  health,
  close,
  isReady: () => ready,
  getLastError: () => lastError,
  getStats: () => ({ ...stats }),
  DatabaseUnavailableError,
};
