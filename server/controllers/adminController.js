// ============================================================
// FAYL: server/controllers/adminController.js
// TƏSVİR: Admin əməliyyatları (manual sinxronizasiya, tarixçə).
//         Bu route-lar YALNIZ ADMIN_API_TOKEN konfiqurasiya
//         edilibsə açıqdır (bax: middleware/adminAuth.js).
// ============================================================

'use strict';

const syncService = require('../services/syncService');
const syncRepo     = require('../db/repositories/syncRepository');
const tecdocRepo   = require('../db/repositories/tecdocRepository');

/** POST /api/admin/sync — xarici SQL DB sinxronizasiyasını əl ilə işə salır. */
async function triggerSync(req, res) {
  if (syncService.isRunning()) {
    return res.status(409).json({ error: 'Sinxronizasiya artıq icra olunur.', status: 'already_running' });
  }
  const result = await syncService.runSync({ triggerType: 'manual' });
  const status = result.status === 'failed' ? 500 : 200;
  return res.status(status).json(result);
}

/** GET /api/admin/sync/history?limit=10 */
async function syncHistory(req, res) {
  const runs = await syncRepo.listRecentRuns(req.query.limit);
  return res.json({ runs });
}

/** GET /api/admin/tecdoc-cache/stats */
async function tecdocCacheStats(req, res) {
  const stats = await tecdocRepo.getStatistics();
  return res.json(stats);
}

module.exports = { triggerSync, syncHistory, tecdocCacheStats };
