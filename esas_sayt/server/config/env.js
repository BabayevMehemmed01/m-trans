// ============================================================
// FAYL: server/config/env.js
// TƏSVİR: Mərkəzləşdirilmiş konfiqurasiya.
//         Bütün .env dəyişənləri YALNIZ bu fayldan oxunur —
//         kodun heç bir yerində process.env-ə birbaşa müraciət
//         edilmir. Bu, "hardcoded credential" riskini sıfırlayır
//         və konfiqurasiyanı bir yerdən idarə etməyə imkan verir.
// ============================================================

'use strict';

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// ── Tip çeviriciləri ─────────────────────────────────────────────

function readRaw(name, fallback = '') {
  const value = process.env[name];
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function readInt(name, fallback) {
  const raw = readRaw(name);
  if (raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBool(name, fallback) {
  const raw = readRaw(name).toLowerCase();
  if (raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

function readList(name, fallback = []) {
  const raw = readRaw(name);
  if (raw === '') return fallback;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Dəyərin real konfiqurasiya, yoxsa placeholder olduğunu müəyyən edir.
 * `mock_tecdoc_key`, `your-api-key`, `<changeme>` kimi dəyərlər
 * "konfiqurasiya edilməyib" sayılır və inteqrasiya mock rejimdə qalır.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isConfigured(value) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  const placeholderPatterns = [
    /^mock/, /^test$/, /^dummy/, /^sample/, /^placeholder/,
    /^change[_-]?me/, /^your[_-]?/, /^xxx+$/, /^<.*>$/,
    /^replace[_-]?me/, /^todo$/, /^none$/, /^null$/, /^undefined$/,
  ];
  if (placeholderPatterns.some(re => re.test(normalized))) return false;
  if (normalized.includes('mock')) return false;
  return true;
}

// ── Mühit ────────────────────────────────────────────────────────

const NODE_ENV = readRaw('NODE_ENV', 'development');
const IS_PROD  = NODE_ENV === 'production';

// ── 1C inteqrasiyası ─────────────────────────────────────────────
// DİQQƏT: Bu dəyərlər hazırda BOŞ/MOCK saxlanılır.
// Real URL və login məlumatlarını yalnız .env faylına yazın.
// Kodda heç vaxt hardcoded saxlamayın.

const onecBaseUrl = readRaw('ONEC_BASE_URL');
const onecUser    = readRaw('ONEC_USER');
const onecPass    = readRaw('ONEC_PASS');

const onec = {
  baseUrl:  onecBaseUrl.replace(/\/+$/, ''),
  user:     onecUser,
  password: onecPass,
  // Endpoint yolları da konfiqurasiya edilə bilər — 1C quraşdırması
  // fərqli ola bilər (OData, HTTP-servis və s.)
  productsPath: readRaw('ONEC_PRODUCTS_PATH', '/products'),
  stockPath:    readRaw('ONEC_STOCK_PATH',    '/stock'),
  authType:     readRaw('ONEC_AUTH_TYPE', 'basic').toLowerCase(), // basic | bearer | none
  token:        readRaw('ONEC_TOKEN'),
  timeoutMs:    readInt('ONEC_TIMEOUT_MS', 15_000),
  pageSize:     readInt('ONEC_PAGE_SIZE', 500),
  maxPages:     readInt('ONEC_MAX_PAGES', 50),
  rejectUnauthorized: readBool('ONEC_TLS_VERIFY', true),
  /** Real 1C-yə qoşulmaq üçün URL + (auth tələb olunursa) kimlik lazımdır. */
  get enabled() {
    if (!isConfigured(onecBaseUrl)) return false;
    if (this.authType === 'none')   return true;
    if (this.authType === 'bearer') return isConfigured(this.token);
    return isConfigured(onecUser) && isConfigured(onecPass);
  },
};

// ── TecDoc inteqrasiyası ─────────────────────────────────────────

const tecdocApiKey = readRaw('TECDOC_API_KEY');

const tecdoc = {
  apiKey:     tecdocApiKey,
  baseUrl:    readRaw('TECDOC_BASE_URL', 'https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatDLB.jsonEndpoint'),
  providerId: readInt('TECDOC_PROVIDER_ID', 0),
  lang:       readRaw('TECDOC_LANG', 'az'),
  country:    readRaw('TECDOC_COUNTRY', 'AZ'),
  timeoutMs:  readInt('TECDOC_TIMEOUT_MS', 12_000),
  perPage:    readInt('TECDOC_PER_PAGE', 25),
  cacheTtlHours: readInt('TECDOC_CACHE_TTL_HOURS', 24 * 30), // 30 gün
  negativeCacheTtlHours: readInt('TECDOC_NEGATIVE_CACHE_TTL_HOURS', 12),
  enabled:    isConfigured(tecdocApiKey),
};

// ── Süni intellekt (Gemini) ──────────────────────────────────────

const geminiApiKey = readRaw('GEMINI_API_KEY');

const ai = {
  apiKey: geminiApiKey,
  // Əsas model + sıradan çıxdıqda avtomatik keçid ediləcək ehtiyat modellər.
  //
  // ⚠️  Köhnə kodda `gemini-1.5-flash` yazılmışdı — bu model API-də
  //     ARTIQ MÖVCUD DEYİL və hər sorğu 404 qaytarırdı. Chatbot-un
  //     işləməməsinin əsas səbəbi məhz bu idi.
  //     Bu açar üçün real yoxlanılmış işlək modellər aşağıdakılardır.
  model:          readRaw('GEMINI_MODEL', 'gemini-flash-latest'),
  fallbackModels: readList('GEMINI_FALLBACK_MODELS', [
    'gemini-flash-lite-latest',
  ]),
  // ⚠️  2.x nəsil modellər cavabdan ƏVVƏL "düşünmə" (thinking) tokenləri
  //     xərcləyir və bu tokenlər maxOutputTokens büdcəsindən çıxılır.
  //     Köhnə koddakı 600 limit düşünməyə gedib mətnə çatmırdı →
  //     model BOŞ cavab qaytarırdı. Limit səxavətli saxlanılmalıdır.
  maxOutputTokens: readInt('GEMINI_MAX_OUTPUT_TOKENS', 2400),
  // Boş buraxılsa `thinkingConfig` ümumiyyətlə göndərilmir (ən uyğun davranış).
  // Qeyd: bu modellərdə `thinkingBudget: 0` QƏBUL EDİLMİR (400 xətası).
  thinkingBudget:  readRaw('GEMINI_THINKING_BUDGET') === '' ? null : readInt('GEMINI_THINKING_BUDGET', 0),
  temperature:     Number.parseFloat(readRaw('GEMINI_TEMPERATURE', '0.4')),
  timeoutMs:       readInt('GEMINI_TIMEOUT_MS', 30_000),
  maxToolTurns:    readInt('GEMINI_MAX_TOOL_TURNS', 4),
  maxHistoryTurns: readInt('CHAT_MAX_HISTORY_TURNS', 8),
  maxMessageChars: readInt('CHAT_MAX_MESSAGE_CHARS', 1500),
  enabled:         isConfigured(geminiApiKey),
};

// ── Verilənlər bazası ────────────────────────────────────────────

const databaseUrl = readRaw('DATABASE_URL');

const db = {
  connectionString: databaseUrl,
  poolMax:          readInt('DB_POOL_MAX', 10),
  poolMin:          readInt('DB_POOL_MIN', 0),
  idleTimeoutMs:    readInt('DB_IDLE_TIMEOUT_MS', 30_000),
  connectTimeoutMs: readInt('DB_CONNECT_TIMEOUT_MS', 8_000),
  statementTimeoutMs: readInt('DB_STATEMENT_TIMEOUT_MS', 15_000),
  ssl:              readBool('DB_SSL', false),
  slowQueryMs:      readInt('DB_SLOW_QUERY_MS', 1_000),
  retryIntervalMs:  readInt('DB_RETRY_INTERVAL_MS', 15_000),
  configured:       isConfigured(databaseUrl),
};

// ── Sinxronizasiya (cron) ────────────────────────────────────────

const sync = {
  // Hər 15 dəqiqədən bir — tapşırıq tələbi
  cronExpression: readRaw('SYNC_CRON', '*/15 * * * *'),
  timezone:       readRaw('SYNC_TIMEZONE', 'Asia/Baku'),
  enabled:        readBool('SYNC_ENABLED', true),
  runOnBoot:      readBool('SYNC_RUN_ON_BOOT', true),
  bootDelayMs:    readInt('SYNC_BOOT_DELAY_MS', 5_000),
  batchSize:      readInt('SYNC_BATCH_SIZE', 200),
};

// ── Server / təhlükəsizlik ───────────────────────────────────────

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const server = {
  port:        readInt('PORT', 5000),
  host:        readRaw('HOST', '0.0.0.0'),
  corsOrigins: readList('CORS_ORIGINS', DEFAULT_ORIGINS),
  trustProxy:  readRaw('TRUST_PROXY', 'loopback'),
  bodyLimit:   readRaw('BODY_LIMIT', '64kb'),
  // Admin əməliyyatları (manual sync tetikləmə) üçün token.
  // Boş olarsa admin route-ları TAM bağlanır (fail-closed).
  adminToken:  readRaw('ADMIN_API_TOKEN'),
  get adminEnabled() { return isConfigured(this.adminToken) && this.adminToken.length >= 24; },
};

const rateLimit = {
  globalWindowMs: readInt('RL_GLOBAL_WINDOW_MS', 60_000),
  globalMax:      readInt('RL_GLOBAL_MAX', IS_PROD ? 120 : 600),
  searchWindowMs: readInt('RL_SEARCH_WINDOW_MS', 60_000),
  searchMax:      readInt('RL_SEARCH_MAX', IS_PROD ? 40 : 200),
  chatWindowMs:   readInt('RL_CHAT_WINDOW_MS', 5 * 60_000),
  chatMax:        readInt('RL_CHAT_MAX', IS_PROD ? 15 : 60),
  adminWindowMs:  readInt('RL_ADMIN_WINDOW_MS', 60_000),
  adminMax:       readInt('RL_ADMIN_MAX', 10),
};

const logging = {
  level:  readRaw('LOG_LEVEL', IS_PROD ? 'info' : 'debug'),
  pretty: readBool('LOG_PRETTY', !IS_PROD),
};

// ── Konfiqurasiyanın yoxlanması ──────────────────────────────────

/**
 * Konfiqurasiyanı yoxlayır.
 * Fatal problemlər (yalnız production-da) → xəta atılır.
 * Xəbərdarlıqlar → geri qaytarılır və loga yazılır.
 *
 * @returns {{ warnings: string[], fatal: string[] }}
 */
function validate() {
  const warnings = [];
  const fatal    = [];

  if (!db.configured) {
    fatal.push('DATABASE_URL təyin edilməyib — PostgreSQL mərkəzi anbardır və məcburidir.');
  }

  if (!ai.enabled) {
    warnings.push('GEMINI_API_KEY konfiqurasiya edilməyib — chatbot məhdud (offline) rejimdə işləyəcək.');
  }

  if (!tecdoc.enabled) {
    warnings.push('TECDOC_API_KEY konfiqurasiya edilməyib — TecDoc mock rejimdə işləyəcək.');
  }

  if (!onec.enabled) {
    warnings.push('1C konfiqurasiya edilməyib (ONEC_BASE_URL/ONEC_USER) — sinxronizasiya mock data ilə işləyəcək.');
  }

  if (!server.adminEnabled) {
    warnings.push('ADMIN_API_TOKEN təyin edilməyib (min 32 simvol tövsiyə olunur) — /api/admin route-ları bağlıdır.');
  }

  if (IS_PROD) {
    if (server.corsOrigins.some(o => o.includes('localhost') || o.includes('127.0.0.1'))) {
      warnings.push('Production rejimdə CORS_ORIGINS içərisində localhost var — CORS_ORIGINS-i real domenlə əvəz edin.');
    }
    if (server.corsOrigins.includes('*')) {
      fatal.push('Production rejimdə CORS_ORIGINS="*" qadağandır.');
    }
  }

  if (!Number.isFinite(ai.temperature) || ai.temperature < 0 || ai.temperature > 2) {
    warnings.push(`GEMINI_TEMPERATURE düzgün deyil (${ai.temperature}) — 0.4 istifadə olunacaq.`);
    ai.temperature = 0.4;
  }

  return { warnings, fatal };
}

module.exports = {
  NODE_ENV,
  IS_PROD,
  isConfigured,
  server,
  db,
  onec,
  tecdoc,
  ai,
  sync,
  rateLimit,
  logging,
  validate,
};
