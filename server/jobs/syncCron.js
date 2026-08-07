// ============================================================
// FAYL: server/jobs/syncCron.js
// TƏSVİR: 1C sinxronizasiyası üçün cron planlayıcısı.
//
//  CƏDVƏL: hər 15 dəqiqədən bir (SYNC_CRON=*/15 * * * *)
//  Zaman qurşağı: Asia/Baku (SYNC_TIMEZONE)
//
//  node-cron v4 istifadə olunur (v3-dəki `uuid` zəifliyi
//  səbəbindən yenilənib).
// ============================================================

'use strict';

const cron   = require('node-cron');
const config = require('../config/env');
const syncService = require('../services/syncService');
const syncRepo    = require('../db/repositories/syncRepository');
const { createLogger } = require('../utils/logger');

const log = createLogger('Cron');

let task = null;
let bootTimer = null;

/**
 * Cron cədvəlini insan dilinə çevirir (log üçün).
 * @param {string} expression
 */
function describeSchedule(expression) {
  const match = expression.match(/^\*\/(\d+) \* \* \* \*$/);
  if (match) return `hər ${match[1]} dəqiqədən bir`;
  return `cədvəl: ${expression}`;
}

/**
 * Cron job-u qeydiyyatdan keçirir və işə salır.
 * @returns {boolean} — job başladıldımı
 */
function start() {
  if (!config.sync.enabled) {
    log.warn('Sinxronizasiya deaktivdir (SYNC_ENABLED=false).');
    return false;
  }

  if (task) {
    log.warn('Cron artıq işləyir — təkrar başladılmır.');
    return true;
  }

  if (!cron.validate(config.sync.cronExpression)) {
    log.error(`Yanlış cron ifadəsi: "${config.sync.cronExpression}" — job başladılmadı.`);
    return false;
  }

  task = cron.schedule(
    config.sync.cronExpression,
    async () => {
      try {
        await syncService.runSync({ triggerType: 'cron' });
      } catch (err) {
        // runSync onsuz da öz xətasını udur; bu son müdafiə xəttidir
        log.error('Cron icrasında gözlənilməz xəta', { message: err.message });
      }
    },
    {
      timezone: config.sync.timezone,
      name: 'onec-product-sync',
    }
  );

  log.info(
    `1C sinxronizasiya job-u aktivdir — ${describeSchedule(config.sync.cronExpression)} ` +
    `(${config.sync.timezone}).`
  );

  // ── Serverin startında ilk sinxronizasiya ──────────────────
  if (config.sync.runOnBoot) {
    bootTimer = setTimeout(async () => {
      // Əvvəlki icradan asılı qalmış "running" qeydlərini bağla
      await syncRepo.closeStaleRuns(60).catch(() => {});
      log.info('İlk (startup) sinxronizasiya başladılır...');
      await syncService.runSync({ triggerType: 'boot' }).catch(err => {
        log.error('Startup sinxronizasiyası alınmadı', { message: err.message });
      });
    }, config.sync.bootDelayMs);

    // Timer prosesin təmiz bağlanmasına mane olmasın
    if (bootTimer.unref) bootTimer.unref();
  }

  return true;
}

/** Cron-u dayandırır (graceful shutdown üçün). */
async function stop() {
  if (bootTimer) {
    clearTimeout(bootTimer);
    bootTimer = null;
  }
  if (task) {
    await task.stop();
    task = null;
    log.info('Cron dayandırıldı.');
  }
}

/** Cron statusu (health endpoint üçün). */
function getStatus() {
  return {
    scheduled:  Boolean(task),
    expression: config.sync.cronExpression,
    timezone:   config.sync.timezone,
    enabled:    config.sync.enabled,
    running:    syncService.isRunning(),
    lastResult: syncService.getLastResult(),
  };
}

module.exports = { start, stop, getStatus };
