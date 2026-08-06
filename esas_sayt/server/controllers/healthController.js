// ============================================================
// FAYL: server/controllers/healthController.js
// TƏSVİR: GET /api/health — bütün alt-sistemlərin vəziyyəti.
// ============================================================

'use strict';

const db = require('../db');
const onecService   = require('../services/onecService');
const tecdocService = require('../services/tecdocService');
const knowledgeRepo = require('../db/repositories/knowledgeRepository');
const syncCron      = require('../jobs/syncCron');
const config = require('../config/env');

async function health(req, res) {
  const dbHealth = await db.health();

  const [onec, tecdoc, kbCount] = await Promise.all([
    onecService.healthCheck().catch(err => ({ ok: false, error: err.message })),
    tecdocService.healthCheck().catch(err => ({ ok: false, error: err.message })),
    dbHealth.ok ? knowledgeRepo.count().catch(() => null) : Promise.resolve(null),
  ]);

  const body = {
    status:  dbHealth.ok ? 'ok' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    db: dbHealth,
    onec,
    tecdoc,
    knowledge_articles: kbCount,
    sync: syncCron.getStatus(),
    ai_enabled: config.ai.enabled,
  };

  return res.status(dbHealth.ok ? 200 : 503).json(body);
}

module.exports = { health };
