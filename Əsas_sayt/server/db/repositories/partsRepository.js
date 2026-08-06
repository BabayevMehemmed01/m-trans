// ============================================================
// FAYL: server/db/repositories/partsRepository.js
// TƏSVİR: `products` anbarı üçün BÜTÜN SQL burada cəmlənib.
//
//  QAYDA: Tətbiqin heç bir başqa yerində məhsul SQL-i yazılmır.
//  Bütün sorğular parametrləşdirilib ($1, $2 ...) — istifadəçi
//  girişi heç vaxt SQL mətninə yapışdırılmır (SQL Injection = 0).
//
//  Sütun siyahısı açıq yazılıb (SELECT * yoxdur) ki, sxem
//  dəyişəndə API cavabına gözlənilməz sahə sızmasın.
// ============================================================

'use strict';

const db = require('../index');
const { buildAndQuery, buildOrQuery } = require('../../utils/ftsQuery');
const { normalizeCode } = require('../../utils/normalize');
const { createLogger } = require('../../utils/logger');

const log = createLogger('PartsRepo');

// İctimai API-yə çıxarılan sütunlar
const PUBLIC_COLUMNS = `
  p.id, p.part_key, p.article_no, p.brand, p.title, p.description,
  p.category, p.price, p.currency, p.stock_quantity, p.warehouse,
  p.source, p.is_active, p.quality_score, p.stock_synced_at, p.updated_at
`;

/** DB sətrini API formatına çevirir (NUMERIC → number). */
function mapRow(row) {
  if (!row) return null;
  return {
    id:             row.id,
    part_key:       row.part_key,
    article_no:     row.article_no,
    brand:          row.brand,
    title:          row.title,
    description:    row.description,
    category:       row.category,
    price:          row.price === null ? null : Number(row.price),
    currency:       row.currency ? String(row.currency).trim() : 'AZN',
    stock_quantity: row.stock_quantity === null ? null : Number(row.stock_quantity),
    in_stock:       Number(row.stock_quantity ?? 0) > 0,
    warehouse:      row.warehouse,
    source:         row.source,
    quality_score:  row.quality_score,
    stock_synced_at: row.stock_synced_at,
    updated_at:     row.updated_at,
    oem_codes:      row.oem_codes || undefined,
    match_type:     row.match_type || undefined,
  };
}

// ════════════════════════════════════════════════════════════════
// YAZMA (upsert)
// ════════════════════════════════════════════════════════════════

/**
 * Təmizlənmiş sətirləri anbara yazır (INSERT ... ON CONFLICT UPDATE).
 *
 * Konflikt açarı: `part_key` (kanonik artikul).
 * Mövcud sətirdəki dolu dəyər NULL ilə üzərinə yazılmır (COALESCE).
 *
 * @param {Object[]} records — dataCleaningService-dən çıxmış sətirlər
 * @param {{ markStockSynced?: boolean, client?: import('pg').PoolClient }} options
 * @returns {Promise<{inserted: number, updated: number, oemLinks: number}>}
 */
async function upsertMany(records, options = {}) {
  if (!Array.isArray(records) || records.length === 0) {
    return { inserted: 0, updated: 0, oemLinks: 0 };
  }

  // ── Təhlükəsizlik: eyni part_key iki dəfə olmamalıdır ────────
  // (ON CONFLICT eyni sətri iki dəfə yeniləyə bilmir → xəta)
  const unique = new Map();
  for (const record of records) {
    if (!record?.part_key) continue;
    unique.set(record.part_key, record);
  }

  // onec_id üzrə də təkrar olmamalıdır (partial unique indeks var)
  const seenOnecIds = new Set();
  const rows = [...unique.values()].map((record) => {
    let onecId = record.onec_id || null;
    if (onecId) {
      if (seenOnecIds.has(onecId)) {
        log.warn('Təkrarlanan onec_id — NULL edilir', { onec_id: onecId, part_key: record.part_key });
        onecId = null;
      } else {
        seenOnecIds.add(onecId);
      }
    }
    return { ...record, onec_id: onecId };
  });

  if (rows.length === 0) return { inserted: 0, updated: 0, oemLinks: 0 };

  const runner = options.client
    ? (text, params) => options.client.query(text, params)
    : (text, params) => db.query(text, params);

  const execute = async () => {
    // UNNEST ilə tək sorğuda toplu yazma — sətir-sətir INSERT-dən
    // qat-qat sürətlidir və tranzaksiya müddətini qısaldır.
    const upsertSql = `
      INSERT INTO products (
        part_key, onec_id, article_no, brand, title, description,
        category, price, currency, stock_quantity, warehouse,
        source, is_active, quality_score, stock_synced_at, updated_at
      )
      SELECT t.part_key, t.onec_id, t.article_no, t.brand, t.title, t.description,
             t.category, t.price, t.currency, t.stock_quantity, t.warehouse,
             t.source, t.is_active, t.quality_score,
             CASE WHEN $15::boolean THEN NOW() ELSE NULL END AS stock_synced_at,
             NOW() AS updated_at
        FROM UNNEST(
          $1::text[],  $2::text[],  $3::text[],  $4::text[],  $5::text[],
          $6::text[],  $7::text[],  $8::numeric[], $9::text[], $10::integer[],
          $11::text[], $12::text[], $13::boolean[], $14::smallint[]
        ) AS t(
          part_key, onec_id, article_no, brand, title, description,
          category, price, currency, stock_quantity, warehouse,
          source, is_active, quality_score
        )
      ON CONFLICT (part_key) DO UPDATE SET
        -- Dolu dəyər NULL ilə əvəzlənmir.
        --
        -- MƏNBƏ PRİORİTETİ: 1C bizim öz kataloqumuzdur və təsviri
        -- sahələr üçün üstündür. TecDoc sorğusu 1C-dən gələn adı,
        -- brendi və kateqoriyanı ƏVƏZ ETMİR — yalnız BOŞ sahələri
        -- doldurur (və OEM cross-reference kodlarını əlavə edir).
        onec_id        = COALESCE(EXCLUDED.onec_id,     products.onec_id),
        article_no     = COALESCE(EXCLUDED.article_no,  products.article_no),
        brand          = CASE WHEN products.source = '1c' AND EXCLUDED.source <> '1c'
                              THEN COALESCE(products.brand, EXCLUDED.brand)
                              ELSE COALESCE(EXCLUDED.brand, products.brand) END,
        title          = CASE WHEN products.source = '1c' AND EXCLUDED.source <> '1c'
                              THEN COALESCE(products.title, EXCLUDED.title)
                              ELSE COALESCE(EXCLUDED.title, products.title) END,
        description    = CASE WHEN products.source = '1c' AND EXCLUDED.source <> '1c'
                              THEN COALESCE(products.description, EXCLUDED.description)
                              ELSE COALESCE(EXCLUDED.description, products.description) END,
        category       = CASE WHEN products.source = '1c' AND EXCLUDED.source <> '1c'
                              THEN COALESCE(products.category, EXCLUDED.category)
                              ELSE COALESCE(EXCLUDED.category, products.category) END,
        price          = COALESCE(EXCLUDED.price,       products.price),
        currency       = COALESCE(EXCLUDED.currency,    products.currency),
        stock_quantity = COALESCE(EXCLUDED.stock_quantity, products.stock_quantity),
        warehouse      = COALESCE(EXCLUDED.warehouse,   products.warehouse),
        -- 1C mənbəyi üstündür: TecDoc yazısı onu "aşağı salmır"
        source         = CASE WHEN products.source = '1c' THEN '1c' ELSE EXCLUDED.source END,
        is_active      = EXCLUDED.is_active,
        quality_score  = GREATEST(COALESCE(products.quality_score, 0), COALESCE(EXCLUDED.quality_score, 0)),
        stock_synced_at = COALESCE(EXCLUDED.stock_synced_at, products.stock_synced_at),
        updated_at     = NOW()
      RETURNING id, part_key, (xmax = 0) AS was_inserted
    `;

    const params = [
      rows.map(r => r.part_key),
      rows.map(r => r.onec_id),
      rows.map(r => r.article_no || r.part_key),
      rows.map(r => r.brand),
      rows.map(r => r.title),
      rows.map(r => r.description),
      rows.map(r => r.category),
      rows.map(r => r.price),
      rows.map(r => r.currency || 'AZN'),
      rows.map(r => r.stock_quantity),
      rows.map(r => r.warehouse),
      rows.map(r => r.source || 'manual'),
      rows.map(r => r.is_active !== false),
      rows.map(r => r.quality_score ?? null),
      Boolean(options.markStockSynced),
    ];

    const result = await runner(upsertSql, params);

    let inserted = 0;
    let updated  = 0;
    const idByPartKey = new Map();
    for (const row of result.rows) {
      idByPartKey.set(row.part_key, row.id);
      if (row.was_inserted) inserted += 1; else updated += 1;
    }

    // ── OEM cross-reference kodları ──────────────────────────
    const oemProductIds = [];
    const oemNorms      = [];
    const oemRaws       = [];
    const oemSources    = [];

    for (const record of rows) {
      const productId = idByPartKey.get(record.part_key);
      if (!productId) continue;
      for (const code of record.oem_codes || []) {
        const norm = normalizeCode(code);
        if (!norm) continue;
        oemProductIds.push(productId);
        oemNorms.push(norm);
        oemRaws.push(String(code).slice(0, 100));
        oemSources.push(record.source || 'manual');
      }
    }

    let oemLinks = 0;
    if (oemProductIds.length > 0) {
      const oemResult = await runner(
        `INSERT INTO product_oem_codes (product_id, oem_code_norm, oem_code_raw, source)
         SELECT * FROM UNNEST($1::bigint[], $2::text[], $3::text[], $4::text[])
         ON CONFLICT (product_id, oem_code_norm) DO NOTHING`,
        [oemProductIds, oemNorms, oemRaws, oemSources]
      );
      oemLinks = oemResult.rowCount || 0;
    }

    return { inserted, updated, oemLinks };
  };

  // Xarici tranzaksiya verilibsə ondan istifadə et, yoxsa öz tranzaksiyanı aç
  return options.client ? execute() : db.transaction(async (client) => {
    options.client = client;
    try {
      return await execute();
    } finally {
      options.client = undefined;
    }
  });
}

/**
 * Yalnız stok miqdarını yeniləyir (1C canlı stok sorğusu üçün).
 * @param {Array<{part_key: string, stock_quantity: number}>} updates
 * @returns {Promise<number>} — yenilənən sətir sayı
 */
async function updateStockLevels(updates) {
  if (!Array.isArray(updates) || updates.length === 0) return 0;

  const partKeys = updates.map(u => normalizeCode(u.part_key)).filter(Boolean);
  const amounts  = updates.map(u => Math.max(0, Math.trunc(Number(u.stock_quantity) || 0)));
  if (partKeys.length === 0) return 0;

  const result = await db.query(
    `UPDATE products AS p
        SET stock_quantity  = v.qty,
            stock_synced_at = NOW(),
            updated_at      = NOW()
       FROM (SELECT * FROM UNNEST($1::text[], $2::integer[]) AS t(part_key, qty)) AS v
      WHERE p.part_key = v.part_key`,
    [partKeys, amounts]
  );
  return result.rowCount || 0;
}

// ════════════════════════════════════════════════════════════════
// OXUMA
// ════════════════════════════════════════════════════════════════

/**
 * Normallaşdırılmış OEM/artikul kodları üzrə dəqiq axtarış.
 * Həm `part_key`, həm də `product_oem_codes` cross-reference cədvəlinə baxır.
 *
 * @param {string[]} codes
 * @param {{limit?: number}} options
 * @returns {Promise<Object[]>}
 */
async function findByOemCodes(codes, options = {}) {
  const normalized = [...new Set((codes || []).map(normalizeCode).filter(Boolean))];
  if (normalized.length === 0) return [];

  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 200);

  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS},
            COALESCE(
              ARRAY(SELECT o2.oem_code_norm FROM product_oem_codes o2
                     WHERE o2.product_id = p.id LIMIT 25),
              '{}'
            ) AS oem_codes,
            'exact_code' AS match_type
       FROM products p
      WHERE p.is_active
        AND (
              p.part_key = ANY($1::text[])
           OR EXISTS (
                SELECT 1 FROM product_oem_codes o
                 WHERE o.product_id = p.id
                   AND o.oem_code_norm = ANY($1::text[])
              )
        )
      ORDER BY (p.stock_quantity > 0) DESC, p.stock_quantity DESC, p.quality_score DESC NULLS LAST
      LIMIT $2`,
    [normalized, limit]
  );

  return rows.map(mapRow);
}

/**
 * HİBRİD AXTARIŞ — chatbot RAG-ının və /api/search-in əsas mühərriki.
 *
 * Üç üsul birləşdirilir:
 *   1. Dəqiq kod uyğunluğu (part_key / OEM cross-reference) — ən yüksək prioritet
 *   2. Tam mətn axtarışı (tsvector, prefiks dəstəyi ilə)
 *   3. Trigram oxşarlığı — səhv yazılışa dözümlülük ("knor bremze")
 *
 * @param {string} queryText
 * @param {{limit?: number, category?: string, brand?: string, inStockOnly?: boolean}} options
 * @returns {Promise<Object[]>}
 */
async function search(queryText, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const raw   = String(queryText ?? '').trim();

  // Sorğu boşdursa — sadəcə ən aktual məhsulları qaytar
  if (!raw) return listRecent({ limit, ...options });

  const codeForm  = normalizeCode(raw);
  const andQuery  = buildAndQuery(raw);
  const orQuery   = buildOrQuery(raw);
  const trigramThreshold = 0.22;

  const { rows } = await db.query(
    `WITH params AS (
        SELECT $1::text      AS raw_text,
               $2::text      AS code_form,
               NULLIF($3, '')::tsquery AS and_query,
               NULLIF($4, '')::tsquery AS or_query
     ),
     scored AS (
       SELECT p.id,
              -- Dəqiq kod uyğunluğu
              (p.part_key = params.code_form) AS is_exact_code,
              EXISTS (
                SELECT 1 FROM product_oem_codes o
                 WHERE o.product_id = p.id AND o.oem_code_norm = params.code_form
              ) AS is_oem_match,
              -- FTS bal
              CASE
                WHEN params.and_query IS NOT NULL AND p.search_document @@ params.and_query
                  THEN ts_rank(p.search_document, params.and_query) * 2
                WHEN params.or_query IS NOT NULL AND p.search_document @@ params.or_query
                  THEN ts_rank(p.search_document, params.or_query)
                ELSE 0
              END AS fts_score,
              -- Trigram oxşarlıq balı
              GREATEST(
                similarity(COALESCE(p.title, ''),      params.raw_text),
                similarity(COALESCE(p.article_no, ''), params.raw_text),
                similarity(COALESCE(p.brand, ''),      params.raw_text)
              ) AS trgm_score
         FROM products p, params
        WHERE p.is_active
          AND ($5::text IS NULL OR p.category = $5)
          AND ($6::text IS NULL OR p.brand    = $6)
          AND ($7::boolean IS FALSE OR p.stock_quantity > 0)
          AND (
                p.part_key = params.code_form
             OR (params.and_query IS NOT NULL AND p.search_document @@ params.and_query)
             OR (params.or_query  IS NOT NULL AND p.search_document @@ params.or_query)
             OR similarity(COALESCE(p.title, ''),      params.raw_text) > ${trigramThreshold}
             OR similarity(COALESCE(p.article_no, ''), params.raw_text) > ${trigramThreshold}
             OR similarity(COALESCE(p.brand, ''),      params.raw_text) > ${trigramThreshold}
             OR EXISTS (
                  SELECT 1 FROM product_oem_codes o
                   WHERE o.product_id = p.id AND o.oem_code_norm = params.code_form
                )
          )
     )
     SELECT ${PUBLIC_COLUMNS},
            CASE
              WHEN s.is_exact_code THEN 'exact_code'
              WHEN s.is_oem_match  THEN 'oem_cross_reference'
              WHEN s.fts_score > 0 THEN 'full_text'
              ELSE 'fuzzy'
            END AS match_type,
            COALESCE(
              ARRAY(SELECT o2.oem_code_norm FROM product_oem_codes o2
                     WHERE o2.product_id = p.id LIMIT 25),
              '{}'
            ) AS oem_codes
       FROM scored s
       JOIN products p ON p.id = s.id
      ORDER BY s.is_exact_code DESC,
               s.is_oem_match  DESC,
               (s.fts_score + s.trgm_score) DESC,
               (p.stock_quantity > 0) DESC,
               p.quality_score DESC NULLS LAST
      LIMIT $8`,
    [
      raw,
      codeForm,
      andQuery || '',
      orQuery  || '',
      options.category || null,
      options.brand    || null,
      Boolean(options.inStockOnly),
      limit,
    ]
  );

  return rows.map(mapRow);
}

/**
 * Ən son yenilənmiş məhsullar.
 * @param {{limit?: number, category?: string, brand?: string, inStockOnly?: boolean, offset?: number}} options
 */
async function listRecent(options = {}) {
  const limit  = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const offset = Math.max(Number(options.offset) || 0, 0);

  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS},
            '{}'::text[] AS oem_codes,
            'listing' AS match_type
       FROM products p
      WHERE p.is_active
        AND ($1::text IS NULL OR p.category = $1)
        AND ($2::text IS NULL OR p.brand    = $2)
        AND ($3::boolean IS FALSE OR p.stock_quantity > 0)
      ORDER BY p.updated_at DESC
      LIMIT $4 OFFSET $5`,
    [options.category || null, options.brand || null, Boolean(options.inStockOnly), limit, offset]
  );
  return rows.map(mapRow);
}

/**
 * Tək məhsulu kanonik açarla tapır.
 * @param {string} partKey
 */
async function findByPartKey(partKey) {
  const normalized = normalizeCode(partKey);
  if (!normalized) return null;

  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS},
            COALESCE(ARRAY(SELECT o.oem_code_norm FROM product_oem_codes o
                            WHERE o.product_id = p.id LIMIT 25), '{}') AS oem_codes,
            'exact_code' AS match_type
       FROM products p
      WHERE p.part_key = $1`,
    [normalized]
  );
  return rows.length ? mapRow(rows[0]) : null;
}

/**
 * Anbar statistikası — health endpoint və chatbot üçün.
 */
async function getStatistics() {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int                                            AS total,
            COUNT(*) FILTER (WHERE is_active)::int                   AS active,
            COUNT(*) FILTER (WHERE stock_quantity > 0)::int          AS in_stock,
            COUNT(*) FILTER (WHERE source = '1c')::int               AS from_1c,
            COUNT(*) FILTER (WHERE source = 'tecdoc')::int           AS from_tecdoc,
            COALESCE(SUM(stock_quantity), 0)::int                    AS total_units,
            COUNT(DISTINCT brand) FILTER (WHERE brand IS NOT NULL)::int AS brand_count,
            MAX(updated_at)                                          AS last_updated
       FROM products`,
    []
  );
  return rows[0];
}

/** Mövcud kateqoriyalar (filtr menyusu üçün). */
async function listCategories() {
  const { rows } = await db.query(
    `SELECT category, COUNT(*)::int AS count
       FROM products
      WHERE is_active AND category IS NOT NULL AND category <> ''
      GROUP BY category ORDER BY count DESC LIMIT 50`,
    []
  );
  return rows;
}

/** Mövcud brendlər. */
async function listBrands() {
  const { rows } = await db.query(
    `SELECT brand, COUNT(*)::int AS count
       FROM products
      WHERE is_active AND brand IS NOT NULL AND brand <> ''
      GROUP BY brand ORDER BY count DESC LIMIT 100`,
    []
  );
  return rows;
}

module.exports = {
  upsertMany,
  updateStockLevels,
  findByOemCodes,
  findByPartKey,
  search,
  listRecent,
  getStatistics,
  listCategories,
  listBrands,
  mapRow,
};
