// ============================================================
// FAYL: server/db/repositories/knowledgeRepository.js
// TƏSVİR: Chatbot RAG-ı üçün bilik bazası sorğuları.
//
//  Məhsullarla eyni hibrid axtarış (FTS + trigram) tətbiq olunur,
//  beləliklə "sifarişi necə verim?" kimi suallar üçün saytın
//  təlimat mətnləri, "yağ nə vaxt dəyişilir?" üçün isə texniki
//  məqalələr tapılır.
// ============================================================

'use strict';

const db = require('../index');
const { buildAndQuery, buildOrQuery } = require('../../utils/ftsQuery');

/**
 * Bilik bazasında hibrid axtarış.
 *
 * @param {string} queryText
 * @param {{limit?: number, topics?: string[]}} options
 * @returns {Promise<Array<{slug, topic, title, body, score}>>}
 */
async function search(queryText, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 4, 1), 15);
  const raw   = String(queryText ?? '').trim();
  if (!raw) return [];

  const andQuery = buildAndQuery(raw);
  const orQuery  = buildOrQuery(raw);
  const topics   = Array.isArray(options.topics) && options.topics.length ? options.topics : null;

  const { rows } = await db.query(
    `WITH params AS (
        SELECT $1::text AS raw_text,
               NULLIF($2, '')::tsquery AS and_query,
               NULLIF($3, '')::tsquery AS or_query
     )
     SELECT k.slug, k.topic, k.title, k.body, k.priority,
            (
              CASE
                WHEN params.and_query IS NOT NULL AND k.search_document @@ params.and_query
                  THEN ts_rank(k.search_document, params.and_query) * 2
                WHEN params.or_query IS NOT NULL AND k.search_document @@ params.or_query
                  THEN ts_rank(k.search_document, params.or_query)
                ELSE 0
              END
              + similarity(k.title, params.raw_text)
              + (k.priority::real / 100)
            ) AS score
       FROM knowledge_articles k, params
      WHERE k.is_active
        AND ($4::text[] IS NULL OR k.topic = ANY($4::text[]))
        AND (
              (params.and_query IS NOT NULL AND k.search_document @@ params.and_query)
           OR (params.or_query  IS NOT NULL AND k.search_document @@ params.or_query)
           OR similarity(k.title, params.raw_text) > 0.25
        )
      ORDER BY score DESC
      LIMIT $5`,
    [raw, andQuery || '', orQuery || '', topics, limit]
  );

  return rows;
}

/**
 * Bilik məqalələrini toplu şəkildə yazır/yeniləyir (seed üçün).
 * @param {Array<Object>} articles
 * @returns {Promise<number>}
 */
async function upsertMany(articles) {
  if (!Array.isArray(articles) || articles.length === 0) return 0;

  const result = await db.query(
    `INSERT INTO knowledge_articles (slug, topic, title, body, keywords, lang, priority)
     SELECT entry->>'slug',
            entry->>'topic',
            entry->>'title',
            entry->>'body',
            ARRAY(SELECT jsonb_array_elements_text(entry->'keywords')),
            COALESCE(entry->>'lang', 'az'),
            COALESCE((entry->>'priority')::smallint, 0)
       FROM jsonb_array_elements($1::jsonb) AS entry
     ON CONFLICT (slug) DO UPDATE SET
       topic      = EXCLUDED.topic,
       title      = EXCLUDED.title,
       body       = EXCLUDED.body,
       keywords   = EXCLUDED.keywords,
       lang       = EXCLUDED.lang,
       priority   = EXCLUDED.priority,
       is_active  = TRUE,
       updated_at = NOW()`,
    [JSON.stringify(articles)]
  );
  return result.rowCount || 0;
}

/** Məqalələrin sayı (health üçün). */
async function count() {
  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS total FROM knowledge_articles WHERE is_active',
    []
  );
  return rows[0].total;
}

module.exports = { search, upsertMany, count };
