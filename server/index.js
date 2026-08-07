// ============================================================
// FAYL: server/index.js
// TƏSVİR: M-Trans Logistics Backend — Express App Entry Point.
//         Bütün konfiqurasiya `config/env.js`-dən oxunur.
// ============================================================

'use strict';

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');

const config = require('./config/env');
const db     = require('./db');
const apiRoutes = require('./routes/api');
const syncCron   = require('./jobs/syncCron');
const knowledgeRepo = require('./db/repositories/knowledgeRepository');
const { run: seedKnowledgeBase } = require('./db/seed');
const { createLogger } = require('./utils/logger');

const log = createLogger('Server');
const app  = express();

// ── Təhlükəsizlik / performans middleware ─────────────────────────
app.set('trust proxy', config.server.trustProxy);
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*', // Hər kəsə (Netlify daxil) tam açıq buraxırıq
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
}));

app.use(express.json({ limit: config.server.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.server.bodyLimit }));

// ── Request Logger (minimal) ─────────────────────────────────────
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    log.debug(`${req.method} ${req.path} → ${res.statusCode} (${Date.now() - startedAt}ms)`);
  });
  next();
});

// ── API Routes ───────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Root ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name:    'M-Trans Logistics API',
    version: '1.0.0',
    status:  'running',
    docs: {
      search:     'GET /api/search?oem=K020345',
      products:   'GET /api/products?q=knorr',
      categories: 'GET /api/categories',
      brands:     'GET /api/brands',
      chat:       'POST /api/chat  { message, history? }',
      health:     'GET /api/health',
    },
  });
});

// ── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route tapılmadı: ${req.method} ${req.path}` });
});

// ── Global Error Handler ─────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.expose ? err.message : 'Daxili server xətası.';
  if (statusCode >= 500) log.error('İşlənməmiş xəta', { message: err.message, path: req.path });
  res.status(statusCode).json({ error: message });
});

// ── Startup ──────────────────────────────────────────────────────
let server = null;

async function start() {
  log.info('═══════════════════════════════════════════');
  log.info('🚛 M-TRANS LOGISTICS — Backend Server başladılır');
  log.info('═══════════════════════════════════════════');

  const { warnings, fatal } = config.validate();
  warnings.forEach(w => log.warn(w));
  if (fatal.length > 0) {
    fatal.forEach(f => log.error(f));
    process.exit(1);
  }

  // 1. PostgreSQL-ə qoşulmağa cəhd et (alınmasa belə server ayağa qalxır —
  //    arxa planda avtomatik yenidən qoşulma cəhdi davam edir).
  const dbReady = await db.connectWithRetry();

  // 2. Bilik bazası boşdursa avtomatik toxumla (idempotent, təhlükəsiz).
  if (dbReady) {
    try {
      const existing = await knowledgeRepo.count();
      if (existing === 0) {
        log.info('Bilik bazası boşdur — ilkin məzmun yazılır...');
        await seedKnowledgeBase();
      }
    } catch (err) {
      log.warn('Bilik bazası yoxlanışı alınmadı (miqrasiyalar icra olunubmu? → npm run migrate)', {
        message: err.message,
      });
    }
  }

  // 3. Express serverini işə sal
  server = app.listen(config.server.port, config.server.host, () => {
    log.info(`✅ ${config.server.port} portunda işləyir → http://localhost:${config.server.port}`);
    log.info(`DB rejim: ${dbReady ? '🐘 PostgreSQL (bağlı)' : '⚠️  Degraded (bağlantı gözlənilir)'}`);
    log.info(`Gemini: ${config.ai.enabled ? '🤖 Aktiv (' + config.ai.model + ')' : '⚠️  Mock'}`);
    log.info(`1C: ${config.onec.enabled ? '🔌 Live' : '🧪 Mock'} | TecDoc: ${config.tecdoc.enabled ? '🔌 Live' : '🧪 Mock'}`);
  });

  // 4. 1C Sinxronizasiya Cron-u başlat
  syncCron.start();
}

// ── Graceful Shutdown ──────────────────────────────────────────────
async function shutdown(signal) {
  log.info(`${signal} alındı — server bağlanır...`);
  try {
    await syncCron.stop();
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.close();
    log.info('Server təmiz bağlandı.');
    process.exit(0);
  } catch (err) {
    log.error('Bağlanma zamanı xəta', { message: err.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

start().catch(err => {
  log.error('Kritik başlanğıc xətası', { message: err.message });
  process.exit(1);
});
