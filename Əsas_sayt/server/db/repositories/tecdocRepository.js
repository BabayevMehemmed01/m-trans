// ============================================================
// FAYL: server/db/repositories/tecdocRepository.js
// TƏSVİR: TecDoc cavablarının keşi.
//
//  Keş HƏM müsbət, HƏM DƏ mənfi nəticələri saxlayır:
//  "bu OEM TecDoc-da tapılmadı" məlumatı da dəyərlidir —
//  əks halda hər sorğuda eyni boş nəticə üçün xarici API-yə
//  pul və vaxt xərcləyərdik.
// ============================================================

'use strict';

const db = require('../index');
const config = require('../../config/env');
const { normalizeCode } = require('../../utils/normalize');

/**
 * Keşdən oxuyur (müddəti bitməmişsə).
 * @param {string} oemCode
 * @returns {Promise<{found: boolean, payload: Object, fetchedAt: Date}|null>}
 */
async function get(oemCode) {
  const normalized = normalizeCode(oemCode);
  if (!normalized) return null;

  const { rows } = await db.query(
    `SELECT oem_code, payload, found, fetched_at, expires_at
       FROM tecdoc_cache
      WHERE oem_code = $1
        AND (expires_at IS NULL OR expires_at > NOW())`,
    [normalized]
  );

  if (rows.length === 0) return null;

  // Statistika üçün (uğursuzluğu sorğunu bloklamamalıdır)
  db.query('UPDATE tecdoc_cache SET hit_count = hit_count + 1 WHERE oem_code = $1', [normalized])
    .catch(() => {});

  return {
    found:     rows[0].found,
    payload:   rows[0].payload || {},
    fetchedAt: rows[0].fetched_at,
  };
}

/**
 * Keşə yazır.
 * @param {string} oemCode
 * @param {Object} payload — TecDoc-dan gələn normallaşdırılmış struktur
 * @param {boolean} found — nəticə tapıldımı
 */
async function set(oemCode, payload, found = true) {
  const normalized = normalizeCode(oemCode);
  if (!normalized) return;

  // Tapılmayan nəticələr daha qısa müddət saxlanılır —
  // TecDoc kataloqu yenilənərsə tez öyrənək.
  const ttlHours = found ? config.tecdoc.cacheTtlHours : config.tecdoc.negativeCacheTtlHours;

  await db.query(
    `INSERT INTO tecdoc_cache (oem_code, payload, found, brand_codes_json, fetched_at, expires_at)
     VALUES ($1, $2::jsonb, $3, $4, NOW(), NOW() + ($5 || ' hours')::interval)
     ON CONFLICT (oem_code) DO UPDATE SET
       payload          = EXCLUDED.payload,
       found            = EXCLUDED.found,
       brand_codes_json = EXCLUDED.brand_codes_json,
       fetched_at       = NOW(),
       expires_at       = EXCLUDED.expires_at`,
    [
      normalized,
      JSON.stringify(payload ?? {}),
      Boolean(found),
      // Köhnə sütun geriyə uyğunluq üçün doldurulur
      JSON.stringify(payload?.brand_codes ?? []),
      String(Math.max(1, ttlHours)),
    ]
  );
}

/** Müddəti bitmiş keş sətirlərini silir. */
async function purgeExpired() {
  const { rowCount } = await db.query(
    'DELETE FROM tecdoc_cache WHERE expires_at IS NOT NULL AND expires_at < NOW()',
    []
  );
  return rowCount || 0;
}

/** Keş statistikası. */
async function getStatistics() {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int                                   AS total,
            COUNT(*) FILTER (WHERE found)::int              AS found_entries,
            COUNT(*) FILTER (WHERE NOT found)::int          AS empty_entries,
            COUNT(*) FILTER (WHERE expires_at < NOW())::int AS expired,
            COALESCE(SUM(hit_count), 0)::int                AS total_hits
       FROM tecdoc_cache`,
    []
  );
  return rows[0];
}

module.exports = { get, set, purgeExpired, getStatistics };
