// ============================================================
// FAYL: server/services/tecdocService.js
// TƏSVİR: TecDoc (TecAlliance) kataloq inteqrasiyası.
//
//  ⚠️  API AÇARI KODDA DEYİL — `.env`-dən oxunur:
//      TECDOC_API_KEY=real_acar
//      TECDOC_BASE_URL=...        (opsional)
//      TECDOC_PROVIDER_ID=12345   (opsional)
//
//  TECDOC_API_KEY boş / "mock..." olduqda servis MOCK rejimdə
//  işləyir və sistem tam funksional qalır.
//
//  KEŞLƏMƏ: hər cavab (tapılmayanlar da daxil) `tecdoc_cache`
//  cədvəlinə yazılır — eyni OEM üçün ikinci dəfə xarici API-yə
//  sorğu getmir.
// ============================================================

'use strict';

const axios  = require('axios');
const config = require('../config/env');
const tecdocRepo = require('../db/repositories/tecdocRepository');
const { normalizeCode } = require('../utils/normalize');
const { cleanText } = require('../utils/sanitize');
const { createLogger } = require('../utils/logger');

const log = createLogger('TecDoc');

// ── Mock cross-reference bazası ──────────────────────────────────
// Real açar təyin edilənə qədər nümayiş/inkişaf üçün.
const MOCK_CROSS_REFERENCE = {
  '0986424785': [
    { article_no: 'BR902211', brand: 'Brembo',       title: 'Ön Əyləc Diski (ventilyasiyalı)', category: 'Əyləc sistemi' },
    { article_no: 'FE501330', brand: 'Ferodo',       title: 'Ön Əyləc Lövhəsi Dəsti',          category: 'Əyləc sistemi' },
  ],
  '81508010022': [
    { article_no: 'MAN77449', brand: 'MAN',          title: 'Su Pompası',                      category: 'Soyutma' },
  ],
  '1665011200': [
    { article_no: 'MB889321', brand: 'Mercedes-Benz',title: 'Termostat 83°C',                  category: 'Soyutma' },
  ],
  '51065006051': [
    { article_no: 'MF994520', brand: 'Mann-Hummel',  title: 'Hava Filtri Elementi',            category: 'Filtrlər' },
    { article_no: 'E500KP02', brand: 'Hengst',       title: 'Yağ Filtri Kartricı',             category: 'Filtrlər' },
  ],
};

let httpClient = null;

function getClient() {
  if (httpClient) return httpClient;
  httpClient = axios.create({
    baseURL: config.tecdoc.baseUrl,
    timeout: config.tecdoc.timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key':    config.tecdoc.apiKey,
    },
    maxRedirects: 2,
    validateStatus: (status) => status >= 200 && status < 300,
  });
  return httpClient;
}

function resetClient() { httpClient = null; }

/** Servisin hazırkı rejimi. */
function getMode() {
  return config.tecdoc.enabled ? 'live' : 'mock';
}

// ── Cavab normallaşdırması ───────────────────────────────────────

/**
 * TecDoc məqaləsini daxili məhsul formatına çevirir.
 * @param {Object} article
 * @returns {Object|null}
 */
function normalizeArticle(article) {
  if (!article || typeof article !== 'object') return null;

  const articleNo = article.articleNumber
    || article.article_no
    || article.dataSupplierArticleNumber
    || article.articleNo;

  if (!articleNo) return null;

  const oemList = []
    .concat(article.oemNumbers || [], article.oemNo || [], article.crossReferences || [])
    .map(entry => (typeof entry === 'object' ? (entry.oemNumber || entry.articleNumber || entry.number) : entry))
    .filter(Boolean);

  return {
    article_no: String(articleNo),
    brand:      cleanText(article.mfrName || article.brand || article.supplierName, 120) || null,
    title:      cleanText(
                  article.articleName || article.title || article.genericArticleName || `Detal ${articleNo}`,
                  500
                ),
    description: cleanText(article.articleText || article.description, 2000) || null,
    category:    cleanText(article.assemblyGroup || article.category || article.genericArticleName, 120) || null,
    oem_codes:   [...new Set(oemList.map(String))],
    // Qiymət və stok TecDoc-dan GƏLMİR — onlar 1C-nin işidir
    price:          null,
    stock_quantity: null,
  };
}

// ── Xarici sorğu ─────────────────────────────────────────────────

/**
 * TecDoc API-yə real sorğu göndərir.
 * @param {string} oemCode — normallaşdırılmış
 * @returns {Promise<Object[]>}
 */
async function queryTecdocApi(oemCode) {
  const requestBody = {
    getArticles: {
      articleCountry: config.tecdoc.country,
      lang:           config.tecdoc.lang,
      provider:       config.tecdoc.providerId || undefined,
      searchQuery:    oemCode,
      searchType:     1,        // OEM / cross-reference axtarışı
      perPage:        config.tecdoc.perPage,
      page:           1,
      includeAll:     true,
    },
  };

  const response = await getClient().post('', requestBody);

  // TecAlliance cavab strukturu quraşdırmadan asılı olaraq dəyişir
  const data = response.data || {};
  const articles = data.data?.array
    || data.articles
    || data.getArticles?.data?.array
    || (Array.isArray(data.data) ? data.data : [])
    || [];

  return Array.isArray(articles) ? articles : [];
}

// ── İctimai API ──────────────────────────────────────────────────

/**
 * OEM kodu üzrə TecDoc-dan uyğun detalları tapır (keş-əvvəl).
 *
 * ADDIMLAR:
 *   1. `tecdoc_cache`-ə bax (müsbət və mənfi nəticələr)
 *   2. Keşdə yoxdursa → TecDoc API (və ya mock)
 *   3. Nəticəni keşə yaz
 *
 * @param {string} oemCode
 * @returns {Promise<{articles: Object[], source: 'cache'|'api'|'mock', found: boolean}>}
 */
async function lookupByOem(oemCode) {
  const normalized = normalizeCode(oemCode);
  if (!normalized) return { articles: [], source: 'none', found: false };

  // ── 1. Keş ───────────────────────────────────────────────────
  try {
    const cached = await tecdocRepo.get(normalized);
    if (cached) {
      log.debug(`Keş HIT: ${normalized} (${cached.found ? 'tapılıb' : 'boş'})`);
      return {
        articles: cached.payload?.articles || [],
        source:   'cache',
        found:    cached.found,
      };
    }
  } catch (err) {
    // Keş oxunmasa da axtarış davam etməlidir
    log.warn('Keş oxunmadı', { message: err.message });
  }

  // ── 2. Xarici mənbə ──────────────────────────────────────────
  let articles = [];
  let source = 'mock';

  if (!config.tecdoc.enabled) {
    log.debug(`MOCK rejim — OEM: ${normalized} (.env-də TECDOC_API_KEY təyin edin)`);
    articles = (MOCK_CROSS_REFERENCE[normalized] || []).map(item => ({
      ...item,
      oem_codes: [...new Set([normalized, ...(item.oem_codes || [])])],
      price: null,
      stock_quantity: null,
    }));
  } else {
    try {
      log.info(`TecDoc API sorğusu — OEM: ${normalized}`);
      const rawArticles = await queryTecdocApi(normalized);
      articles = rawArticles.map(normalizeArticle).filter(Boolean);
      // OEM kodunun özü də cross-reference siyahısına düşməlidir
      for (const article of articles) {
        if (!article.oem_codes.includes(normalized)) article.oem_codes.push(normalized);
      }
      source = 'api';
    } catch (err) {
      log.error('TecDoc API sorğusu alınmadı', {
        message: err.message,
        status:  err.response?.status,
      });
      // Xəta halında MƏNFİ NƏTİCƏ KEŞLƏNMİR — problem müvəqqəti ola bilər
      return { articles: [], source: 'error', found: false, error: err.message };
    }
  }

  // ── 3. Keşə yaz ──────────────────────────────────────────────
  const found = articles.length > 0;
  try {
    await tecdocRepo.set(
      normalized,
      { articles, brand_codes: articles.map(a => a.article_no) },
      found
    );
  } catch (err) {
    log.warn('Keşə yazıla bilmədi', { message: err.message });
  }

  return { articles, source, found };
}

/** Bağlantı yoxlaması (health üçün). */
async function healthCheck() {
  if (!config.tecdoc.enabled) {
    return { ok: true, mode: 'mock', note: 'TECDOC_API_KEY konfiqurasiya edilməyib (.env)' };
  }
  try {
    const startedAt = Date.now();
    await queryTecdocApi('0986424785');
    return { ok: true, mode: 'live', latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { ok: false, mode: 'live', error: err.message, status: err.response?.status };
  }
}

module.exports = {
  lookupByOem,
  healthCheck,
  getMode,
  normalizeArticle,
  resetClient,
  MOCK_CROSS_REFERENCE,
};
