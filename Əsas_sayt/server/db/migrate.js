// ============================================================
// FAYL: server/db/migrate.js
// TƏSVİR: Miqrasiya icraçısı.
//         migrations/ qovluğundakı .sql fayllarını ad sırası ilə
//         BİR DƏFƏ icra edir və `schema_migrations` cədvəlində
//         qeydə alır. Təkrar icra təhlükəsizdir.
//
//         İstifadə:  npm run migrate
// ============================================================

'use strict';

const fs   = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const db  = require('./index');
const { createLogger } = require('../utils/logger');

const log = createLogger('Migrate');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const CREATE_TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    TEXT        PRIMARY KEY,
    checksum    TEXT        NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER
  );
`;

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Gözləyən bütün miqrasiyaları icra edir.
 * @returns {Promise<{applied: string[], skipped: string[]}>}
 */
async function run() {
  await db.query(CREATE_TRACKING_TABLE, [], { allowWhenDegraded: true });

  const { rows } = await db.query('SELECT filename, checksum FROM schema_migrations', []);
  const executed = new Map(rows.map(r => [r.filename, r.checksum]));

  const allFiles = await fs.readdir(MIGRATIONS_DIR);
  const sqlFiles = allFiles.filter(f => f.endsWith('.sql')).sort();

  const applied = [];
  const skipped = [];

  for (const filename of sqlFiles) {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = await fs.readFile(filePath, 'utf8');
    const sum = checksum(sql);

    if (executed.has(filename)) {
      if (executed.get(filename) !== sum) {
        // Artıq icra olunmuş fayl dəyişdirilib — səssiz keçmək təhlükəlidir
        log.warn(
          `${filename} icra olunduqdan SONRA dəyişdirilib. ` +
          'Yenidən icra edilmir — dəyişiklik üçün yeni miqrasiya faylı yaradın.',
          { saved: executed.get(filename), current: sum }
        );
      }
      skipped.push(filename);
      continue;
    }

    const startedAt = Date.now();
    log.info(`İcra olunur: ${filename}`);

    // Hər miqrasiya öz tranzaksiyasında — yarımçıq qalmasın
    await db.transaction(async (client) => {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename, checksum, duration_ms) VALUES ($1, $2, $3)',
        [filename, sum, Date.now() - startedAt]
      );
    });

    log.info(`Tamamlandı: ${filename} (${Date.now() - startedAt}ms)`);
    applied.push(filename);
  }

  if (applied.length === 0) {
    log.info(`Bütün miqrasiyalar artıq tətbiq olunub (${skipped.length} fayl).`);
  } else {
    log.info(`${applied.length} yeni miqrasiya tətbiq olundu.`);
  }

  return { applied, skipped };
}

// ── CLI rejimi ───────────────────────────────────────────────────
if (require.main === module) {
  (async () => {
    try {
      await db.connect();
      await run();
      await db.close();
      process.exit(0);
    } catch (err) {
      log.error('Miqrasiya uğursuz oldu', { message: err.message });
      if (err.position) log.error(`SQL mövqe: ${err.position}`);
      if (err.detail)   log.error(`Detal: ${err.detail}`);
      await db.close();
      process.exit(1);
    }
  })();
}

module.exports = { run };
