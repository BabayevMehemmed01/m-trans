// ============================================================
// FAYL: server/routes/api.js
// TƏSVİR: Bütün /api route-larının birləşdirildiyi modul.
//         Limitlər `config/env.js`-dəki `rateLimit` bölməsindən
//         oxunur — dev/prod fərqi ora köçürülüb.
// ============================================================

'use strict';

const express   = require('express');
const rateLimit = require('express-rate-limit');
const { query, body, validationResult } = require('express-validator');

const config = require('../config/env');
const { asyncHandler } = require('../utils/asyncHandler');
const { adminAuth } = require('../middleware/adminAuth');

const searchController = require('../controllers/searchController');
const chatController   = require('../controllers/chatController');
const adminController  = require('../controllers/adminController');
const healthController = require('../controllers/healthController');

const router = express.Router();

// ── Validasiya köməkçisi ─────────────────────────────────────────
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  return next();
}

// ── Rate Limiter fabriki ─────────────────────────────────────────
function makeLimiter(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders:   false,
    keyGenerator:    (req) => req.ip || req.socket.remoteAddress,
    message,
  });
}

const globalLimiter = makeLimiter(
  config.rateLimit.globalWindowMs,
  config.rateLimit.globalMax,
  { error: 'Sorğu limiti aşıldı. Bir az sonra yenidən cəhd edin.' }
);

const searchLimiter = makeLimiter(
  config.rateLimit.searchWindowMs,
  config.rateLimit.searchMax,
  { error: 'Axtarış limiti aşıldı. Bir az sonra yenidən cəhd edin.' }
);

const chatLimiter = makeLimiter(
  config.rateLimit.chatWindowMs,
  config.rateLimit.chatMax,
  {
    reply: "Hazırda assistentimiz məşğuldur. Zəhmət olmasa 'Bizimlə Əlaqə' bölməsindən menecerimizlə əlaqə saxlayın.",
    error: 'rate_limit',
  }
);

const adminLimiter = makeLimiter(
  config.rateLimit.adminWindowMs,
  config.rateLimit.adminMax,
  { error: 'Admin sorğu limiti aşıldı.' }
);

router.use(globalLimiter);

// ── Axtarış / Kataloq ─────────────────────────────────────────────

/** GET /api/search?oem=K020345 — OEM cross-reference axtarışı. */
router.get(
  '/search',
  searchLimiter,
  query('oem').isString().trim().isLength({ min: 2, max: 60 }),
  validate,
  asyncHandler(searchController.searchByOem)
);

/** GET /api/products?q=&category=&brand=&inStockOnly=&limit= — kataloq. */
router.get('/products', searchLimiter, asyncHandler(searchController.listProducts));

/** GET /api/categories */
router.get('/categories', asyncHandler(searchController.listCategories));

/** GET /api/brands */
router.get('/brands', asyncHandler(searchController.listBrands));

// ── Chat ───────────────────────────────────────────────────────────

/**
 * POST /api/chat
 * Body: { message: "...", history?: [{role, content}] }
 * Gemini RAG chatbot — rate limited.
 */
router.post(
  '/chat',
  chatLimiter,
  body('message').isString().trim().isLength({ min: 1, max: config.ai.maxMessageChars }),
  body('history').optional().isArray({ max: 40 }),
  validate,
  asyncHandler(chatController.chat)
);

// ── Sağlamlıq ────────────────────────────────────────────────────

/** GET /api/health — bütün alt-sistemlərin vəziyyəti. */
router.get('/health', asyncHandler(healthController.health));

// ── Admin (fail-closed, ADMIN_API_TOKEN tələb edir) ────────────────

/** POST /api/admin/sync — xarici SQL DB sinxronizasiyasını əl ilə tetikləyir. */
router.post('/admin/sync', adminLimiter, adminAuth, asyncHandler(adminController.triggerSync));

/** GET /api/admin/sync/history?limit=10 */
router.get('/admin/sync/history', adminLimiter, adminAuth, asyncHandler(adminController.syncHistory));

/** GET /api/admin/tecdoc-cache/stats */
router.get('/admin/tecdoc-cache/stats', adminLimiter, adminAuth, asyncHandler(adminController.tecdocCacheStats));

module.exports = router;
