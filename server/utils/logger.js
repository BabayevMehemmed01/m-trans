// ============================================================
// FAYL: server/utils/logger.js
// TƏSVİR: Sadə, asılılıqsız strukturlaşdırılmış logger.
//         ƏSAS TƏHLÜKƏSİZLİK FUNKSİYASI: loglara düşən API
//         açarları, parollar və tokenlər avtomatik maskalanır.
// ============================================================

'use strict';

const { logging, IS_PROD } = require('../config/env');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const ACTIVE_LEVEL = LEVELS[logging.level] ?? LEVELS.info;

// ── Həssas məlumatların maskalanması ─────────────────────────────

const SENSITIVE_KEY = /(pass(word)?|secret|token|api[-_]?key|authorization|cookie|credential|auth)/i;

/** Açar dəyərini oxunaqlı, lakin bərpa oluna bilməyən formada göstərir. */
function maskValue(value) {
  const str = String(value);
  if (str.length <= 8) return '***';
  return `${str.slice(0, 3)}***${str.slice(-2)} (len:${str.length})`;
}

/**
 * Obyekt içərisindəki həssas sahələri rekursiv maskalayır.
 * @param {*} input
 * @param {number} depth
 */
function redact(input, depth = 0) {
  if (depth > 6 || input === null || input === undefined) return input;

  if (typeof input === 'string') {
    // Mətn içərisində açıq API açarları varsa onları da maskala
    return input
      .replace(/\b(AIza[0-9A-Za-z\-_]{20,})\b/g, m => maskValue(m))
      .replace(/\b(sk-ant-[0-9A-Za-z\-_]{20,})\b/g, m => maskValue(m))
      .replace(/\b(AQ\.[0-9A-Za-z\-_]{20,})\b/g, m => maskValue(m))
      .replace(/(\/\/[^:/\s]+):([^@\s]+)@/g, '$1:***@'); // URL-dəki parollar
  }

  if (Array.isArray(input)) return input.map(v => redact(v, depth + 1));

  if (typeof input === 'object') {
    if (input instanceof Error) {
      return { name: input.name, message: redact(input.message, depth + 1) };
    }
    const output = {};
    for (const [key, value] of Object.entries(input)) {
      output[key] = SENSITIVE_KEY.test(key) ? maskValue(value) : redact(value, depth + 1);
    }
    return output;
  }

  return input;
}

// ── Formatlama ───────────────────────────────────────────────────

const COLORS = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m', debug: '\x1b[90m', reset: '\x1b[0m' };

function emit(level, scope, message, meta) {
  if (LEVELS[level] > ACTIVE_LEVEL) return;

  const safeMeta = meta === undefined ? undefined : redact(meta);
  const safeMsg  = redact(String(message));

  if (IS_PROD && !logging.pretty) {
    // Production: maşın-oxunaqlı JSON (log aqreqatorları üçün)
    const line = { ts: new Date().toISOString(), level, scope, msg: safeMsg };
    if (safeMeta !== undefined) line.meta = safeMeta;
    process.stdout.write(`${JSON.stringify(line)}\n`);
    return;
  }

  // Development: insan-oxunaqlı
  const time  = new Date().toISOString().slice(11, 23);
  const color = COLORS[level] || '';
  const tag   = `${color}${level.toUpperCase().padEnd(5)}${COLORS.reset}`;
  const extra = safeMeta === undefined ? '' : ` ${JSON.stringify(safeMeta)}`;
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(`${time} ${tag} [${scope}] ${safeMsg}${extra}\n`);
}

/**
 * Verilmiş sahə (scope) üçün logger yaradır.
 * @param {string} scope — məsələn 'DB', '1C', 'TecDoc', 'AI'
 */
function createLogger(scope) {
  return {
    error: (msg, meta) => emit('error', scope, msg, meta),
    warn:  (msg, meta) => emit('warn',  scope, msg, meta),
    info:  (msg, meta) => emit('info',  scope, msg, meta),
    debug: (msg, meta) => emit('debug', scope, msg, meta),
    child: (sub) => createLogger(`${scope}:${sub}`),
  };
}

module.exports = { createLogger, redact, maskValue };
