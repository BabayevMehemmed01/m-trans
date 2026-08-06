// ============================================================
// FAYL: server/db/seed.js
// TƏSVİR: `knowledge_articles` cədvəlini services/ai/knowledgeBase.js
//         məzmunu ilə doldurur/yeniləyir.
//
//         İstifadə:  npm run seed:kb
//
//         Bu skript server başlanğıcında bilik bazası boşdursa
//         avtomatik da çağırılır (bax: index.js), ona görə əl ilə
//         işlətmək YALNIZ knowledgeBase.js məzmununu dəyişəndən
//         sonra lazımdır.
// ============================================================

'use strict';

const db = require('./index');
const knowledgeRepo = require('./repositories/knowledgeRepository');
const { ARTICLES } = require('../services/ai/knowledgeBase');
const { createLogger } = require('../utils/logger');

const log = createLogger('SeedKB');

/**
 * Bilik bazası məqalələrini yazır/yeniləyir.
 * @returns {Promise<number>} — yazılan/yenilənən sətir sayı
 */
async function run() {
  const affected = await knowledgeRepo.upsertMany(ARTICLES);
  log.info(`Bilik bazası hazırlandı: ${affected} məqalə (${ARTICLES.length} tərif).`);
  return affected;
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
      log.error('Seed uğursuz oldu', { message: err.message });
      await db.close();
      process.exit(1);
    }
  })();
}

module.exports = { run };
