// ============================================================
// FAYL: server/db/repositories/syncRepository.js
// TƏSVİR: Sinxronizasiya audit izi + data keyfiyyəti karantini.
//
//  Hər cron icrası `sync_runs`-da qeydə alınır, rədd edilmiş
//  sətirlər isə `data_quality_issues`-a yazılır — yəni təmizləmə
//  zamanı atılan heç bir məlumat İZSİZ İTMİR.
// ============================================================

'use strict';

const db = require('../index');
const { createLogger } = require('../../utils/logger');

const log = createLogger('SyncRepo');

/**
 * Yeni sinxronizasiya icrası başladır.
 * @param {{jobName: string, triggerType?: string, sourceMode?: string}} params
 * @returns {Promise<number>} — sync_run id
 */
async function startRun({ jobName, triggerType = 'cron', sourceMode = null }) {
  const { rows } = await db.query(
    `INSERT INTO sync_runs (job_name, trigger_type, source_mode, status)
     VALUES ($1, $2, $3, 'running')
     RETURNING id`,
    [jobName, triggerType, sourceMode]
  );
  return rows[0].id;
}

/**
 * İcranı tamamlayır və nəticəni yazır.
 * @param {number} runId
 * @param {Object} result
 */
async function finishRun(runId, result = {}) {
  if (!runId) return;
  await db.query(
    `UPDATE sync_runs
        SET status          = $2,
            fetched_count   = $3,
            accepted_count  = $4,
            rejected_count  = $5,
            duplicate_count = $6,
            inserted_count  = $7,
            updated_count   = $8,
            duration_ms     = $9,
            error_message   = $10,
            finished_at     = NOW()
      WHERE id = $1`,
    [
      runId,
      result.status || 'success',
      result.fetched   ?? 0,
      result.accepted  ?? 0,
      result.rejected  ?? 0,
      result.duplicates?? 0,
      result.inserted  ?? 0,
      result.updated   ?? 0,
      result.durationMs?? null,
      result.errorMessage ? String(result.errorMessage).slice(0, 1000) : null,
    ]
  );
}

/**
 * Rədd edilmiş sətirləri karantinə yazır.
 * @param {number|null} runId
 * @param {string} source
 * @param {Array<{raw: Object, reasons: string[]}>} rejected
 * @param {number} maxRows — loq şişməsinin qarşısını almaq üçün limit
 */
async function recordRejected(runId, source, rejected, maxRows = 500) {
  if (!Array.isArray(rejected) || rejected.length === 0) return 0;

  // Hər sətrin `reasons` massivinin uzunluğu FƏRQLİDİR.
  // UNNEST çoxölçülü massivi "yastılaşdırdığı" üçün burada işləmir —
  // ona görə bütün paketi tək JSONB parametri kimi ötürürük.
  const payload = rejected.slice(0, maxRows).map((item) => {
    let raw;
    try {
      raw = JSON.parse(JSON.stringify(item.raw ?? null));
    } catch {
      raw = { unserializable: true };
    }
    return {
      issue_type: classifyIssue(item.reasons),
      reasons:    (item.reasons || []).map(r => String(r).slice(0, 300)),
      raw,
    };
  });

  const result = await db.query(
    `INSERT INTO data_quality_issues (sync_run_id, source, issue_type, reasons, raw_record)
     SELECT $1::bigint,
            $2::text,
            entry->>'issue_type',
            ARRAY(SELECT jsonb_array_elements_text(entry->'reasons')),
            entry->'raw'
       FROM jsonb_array_elements($3::jsonb) AS entry`,
    [runId, source, JSON.stringify(payload)]
  );

  if (rejected.length > maxRows) {
    log.warn(`Karantinə yalnız ilk ${maxRows} sətir yazıldı (cəmi ${rejected.length}).`);
  }
  return result.rowCount || 0;
}

/** Rədd səbəbini kateqoriyaya salır. */
function classifyIssue(reasons = []) {
  const text = reasons.join(' ').toLowerCase();
  if (text.includes('artikul')) return 'invalid_article';
  if (text.includes('zibil'))   return 'junk_data';
  if (text.includes('ad'))      return 'missing_title';
  if (text.includes('qiymət'))  return 'invalid_price';
  if (text.includes('stok'))    return 'invalid_stock';
  if (text.includes('obyekt'))  return 'malformed_record';
  return 'other';
}

/**
 * Son icraların siyahısı (health / admin paneli üçün).
 * @param {number} limit
 */
async function listRecentRuns(limit = 10) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const { rows } = await db.query(
    `SELECT id, job_name, status, trigger_type, source_mode,
            fetched_count, accepted_count, rejected_count, duplicate_count,
            inserted_count, updated_count, duration_ms, error_message,
            started_at, finished_at
       FROM sync_runs
      ORDER BY started_at DESC
      LIMIT $1`,
    [safeLimit]
  );
  return rows;
}

/** Ən son uğurlu icra. */
async function getLastSuccessfulRun(jobName) {
  const { rows } = await db.query(
    `SELECT id, started_at, finished_at, accepted_count, inserted_count, updated_count
       FROM sync_runs
      WHERE job_name = $1 AND status IN ('success', 'partial')
      ORDER BY started_at DESC LIMIT 1`,
    [jobName]
  );
  return rows[0] || null;
}

/**
 * Asılı qalmış "running" icraları təmizləyir.
 * Server gözlənilmədən dayandırılarsa sətir "running" qalır —
 * başlanğıcda onları failed kimi bağlayırıq.
 */
async function closeStaleRuns(olderThanMinutes = 60) {
  const { rowCount } = await db.query(
    `UPDATE sync_runs
        SET status = 'failed',
            error_message = COALESCE(error_message, 'Server yenidən başladıldı — icra yarımçıq qaldı.'),
            finished_at = NOW()
      WHERE status = 'running'
        AND started_at < NOW() - ($1 || ' minutes')::interval`,
    [String(Math.max(1, Number(olderThanMinutes) || 60))]
  );
  if (rowCount > 0) log.warn(`${rowCount} asılı qalmış sinxronizasiya qeydi bağlandı.`);
  return rowCount;
}

module.exports = {
  startRun,
  finishRun,
  recordRejected,
  listRecentRuns,
  getLastSuccessfulRun,
  closeStaleRuns,
};
