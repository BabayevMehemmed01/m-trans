// ============================================================
// FAYL: server/db/externalDb.js
// TƏSVİR: Xarici MS SQL Server (Read-Only) bağlantı hovuzu.
//
//  Bu modul YALNIZ bağlantını idarə edir (pool yaratmaq/bağlamaq).
//  Konkret SORĞULAR `services/externalProductService.js`-dədir.
//
//  QEYD: Bu, YALNIZ-OXU (read-only) bir mənbədir — burada heç vaxt
//  INSERT/UPDATE/DELETE icra edilmir. Yerli PostgreSQL anbarı
//  `db/index.js` vasitəsilə ayrıca idarə olunur.
// ============================================================

'use strict';

const sql    = require('mssql');
const config = require('../config/env');
const { createLogger } = require('../utils/logger');

const log = createLogger('ExternalDB');

let pool = null;
let connectingPromise = null;

/** `mssql` üçün bağlantı konfiqurasiyasını qurur. */
function buildSqlConfig() {
  return {
    server:   config.externalDb.host,
    port:     config.externalDb.port,
    database: config.externalDb.database,
    user:     config.externalDb.user,
    password: config.externalDb.password,
    options: {
      encrypt:                config.externalDb.encrypt,
      trustServerCertificate: config.externalDb.trustServerCertificate,
      enableArithAbort:       true,
    },
    connectionTimeout: config.externalDb.connectTimeoutMs,
    requestTimeout:    config.externalDb.requestTimeoutMs,
    pool: {
      max: config.externalDb.poolMax,
      min: config.externalDb.poolMin,
      idleTimeoutMillis: config.externalDb.poolIdleTimeoutMs,
    },
  };
}

/**
 * Hovuzu qaytarır — mövcud deyilsə yaradır (eyni vaxtda çoxlu çağırış
 * olsa belə YALNIZ BİR bağlantı cəhdi başladılır).
 * @returns {Promise<import('mssql').ConnectionPool>}
 */
async function getPool() {
  if (pool && pool.connected) return pool;
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    try {
      const newPool = new sql.ConnectionPool(buildSqlConfig());
      newPool.on('error', (err) => {
        log.error('Xarici SQL Server hovuzunda gözlənilməz xəta', { message: err.message });
      });
      await newPool.connect();
      pool = newPool;
      log.info('Xarici SQL Server bazasına qoşuldu', {
        host:     config.externalDb.host,
        database: config.externalDb.database,
      });
      return pool;
    } catch (err) {
      pool = null;
      throw err;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

/** Bağlantını bağlayır (graceful shutdown üçün). */
async function close() {
  if (pool) {
    await pool.close().catch(() => {});
    pool = null;
  }
}

/** Hovuzun hazırkı vəziyyəti. */
function isReady() {
  return Boolean(pool && pool.connected);
}

module.exports = { getPool, close, isReady, sql };
