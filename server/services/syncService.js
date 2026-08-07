// ============================================================
// FAYL: server/services/syncService.js
// TƏSVİR: 1C → Təmizləmə → PostgreSQL anbarı sinxronizasiyası.
//
//  AXIN:
//    1C-dən çək  →  dataCleaningService (dublikat + zibil təmizliyi)
//                →  partsRepository.upsertMany (paket-paket)
//                →  rədd edilənlər karantinə
//                →  nəticə `sync_runs` audit cədvəlinə
//
//  Bu modul cron-dan da, manual admin endpoint-indən də çağırılır.
// ============================================================

'use strict';

const config      = require('../config/env');
const db          = require('../db');
const partsRepo   = require('../db/repositories/partsRepository');
const syncRepo    = require('../db/repositories/syncRepository');
const onecService = require('./onecService');
const { cleanPartRecords } = require('./dataCleaningService');
const { createLogger } = require('../utils/logger');

const log = createLogger('Sync');

const JOB_NAME = 'onec_products';

// ── Eyni vaxtda iki icranın qarşısını alan kilid ─────────────────
// Cron 15 dəqiqədən bir işləyir; əvvəlki icra hələ bitməyibsə
// yenisi başlamamalıdır (dublikat yazma və DB yükü riski).
let isRunning = false;
let lastResult = null;

/**
 * Massivi bərabər hissələrə bölür.
 * @param {Array} items
 * @param {number} size
 */
function chunk(items, size) {
  const output = [];
  for (let i = 0; i < items.length; i += size) output.push(items.slice(i, i + size));
  return output;
}

/**
 * Tam sinxronizasiya icra edir.
 *
 * @param {{triggerType?: 'cron'|'boot'|'manual'}} options
 * @returns {Promise<Object>} — icra nəticəsi
 */
async function runSync(options = {}) {
  const triggerType = options.triggerType || 'manual';

  if (isRunning) {
    log.warn('Əvvəlki sinxronizasiya hələ davam edir — bu icra buraxılır.');
    return { status: 'skipped', reason: 'already_running' };
  }

  if (!db.isReady()) {
    log.warn('PostgreSQL əlçatmazdır — sinxronizasiya təxirə salınır.');
    return { status: 'skipped', reason: 'database_unavailable' };
  }

  isRunning = true;
  const startedAt = Date.now();
  let runId = null;

  try {
    const mode = onecService.getMode();
    runId = await syncRepo.startRun({ jobName: JOB_NAME, triggerType, sourceMode: mode });

    log.info(`Sinxronizasiya başladı (${triggerType}, mənbə: ${mode})`);

    // ── 1. 1C-dən məlumatları çək ────────────────────────────
    const { items, mode: actualMode } = await onecService.fetchProducts();

    if (!Array.isArray(items) || items.length === 0) {
      log.warn('1C-dən boş cavab gəldi — anbar dəyişdirilmir.');
      await syncRepo.finishRun(runId, {
        status: 'partial',
        fetched: 0,
        durationMs: Date.now() - startedAt,
        errorMessage: '1C boş cavab qaytardı',
      });
      return { status: 'partial', fetched: 0, reason: 'empty_source' };
    }

    // ── 2. Təmizlə (dublikat + zibil) ────────────────────────
    const { accepted, rejected, stats } = cleanPartRecords(items, {
      source: '1c',
      defaultCurrency: 'AZN',
    });

    // ── 3. Anbara paket-paket yaz ────────────────────────────
    let inserted = 0;
    let updated  = 0;
    let oemLinks = 0;

    for (const batch of chunk(accepted, config.sync.batchSize)) {
      const result = await partsRepo.upsertMany(batch, { markStockSynced: true });
      inserted += result.inserted;
      updated  += result.updated;
      oemLinks += result.oemLinks;
    }

    // ── 4. Rədd edilənləri karantinə yaz ─────────────────────
    if (rejected.length > 0) {
      await syncRepo.recordRejected(runId, '1c', rejected).catch(err => {
        log.error('Karantin yazısı alınmadı', { message: err.message });
      });
    }

    const durationMs = Date.now() - startedAt;
    const status = rejected.length > 0 ? 'partial' : 'success';

    await syncRepo.finishRun(runId, {
      status,
      fetched:    stats.fetched,
      accepted:   stats.accepted,
      rejected:   stats.rejected,
      duplicates: stats.duplicates,
      inserted,
      updated,
      durationMs,
    });

    const result = {
      status,
      mode: actualMode,
      fetched:    stats.fetched,
      accepted:   stats.accepted,
      rejected:   stats.rejected,
      duplicates: stats.duplicates,
      inserted,
      updated,
      oemLinks,
      durationMs,
    };

    lastResult = { ...result, finishedAt: new Date().toISOString() };
    log.info('Sinxronizasiya tamamlandı', result);
    return result;

  } catch (err) {
    const durationMs = Date.now() - startedAt;
    log.error('Sinxronizasiya xətası', { message: err.message, status: err.response?.status });

    if (runId) {
      await syncRepo.finishRun(runId, {
        status: 'failed',
        durationMs,
        errorMessage: err.message,
      }).catch(() => {});
    }

    lastResult = { status: 'failed', error: err.message, finishedAt: new Date().toISOString() };
    // Cron-un çökməməsi üçün xəta ATILMIR — nəticə obyekt kimi qaytarılır
    return { status: 'failed', error: err.message, durationMs };

  } finally {
    isRunning = false;
  }
}

module.exports = {
  runSync,
  JOB_NAME,
  isRunning: () => isRunning,
  getLastResult: () => lastResult,
};
