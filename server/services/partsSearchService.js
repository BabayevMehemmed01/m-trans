// ============================================================
// FAYL: server/services/partsSearchService.js
// TƏSVİR: Ehtiyat hissəsi axtarışının ORKESTRASİYASI.
//
//  TAPŞIRIQDA TƏLƏB OLUNAN AXIN (dəqiq ardıcıllıqla):
//
//    1️⃣  ÖZ BAZAMIZ (PostgreSQL)  — həmişə birinci
//          ↓ tapılmadısa
//    2️⃣  TecDoc API                — xarici kataloq
//          ↓ nəticəni
//    3️⃣  PostgreSQL-ə YAZ           — növbəti dəfə lokal tapılsın
//          ↓ sonra
//    4️⃣  Xarici SQL DB-dən CANLI STOK — miqdar/qiymət dəqiqləşdirilir
//
//  Beləliklə hər OEM üçün TecDoc-a YALNIZ BİR DƏFƏ müraciət olunur.
// ============================================================

'use strict';

const partsRepo     = require('../db/repositories/partsRepository');
const tecdocService = require('./tecdocService');
const externalProductService = require('./externalProductService');
const { cleanPartRecords } = require('./dataCleaningService');
const { normalizeCode } = require('../utils/normalize');
const { createLogger } = require('../utils/logger');

const log = createLogger('Search');

/**
 * Axtarış mətninin OEM/artikul koduna oxşayıb-oxşamadığını müəyyən edir.
 * "K020345" → bəli | "hava filtri" → xeyr
 *
 * @param {string} text
 * @returns {boolean}
 */
function looksLikePartCode(text) {
  const trimmed = String(text || '').trim();
  if (trimmed.length < 4 || trimmed.length > 40) return false;
  // Boşluqla ayrılmış 3+ sözdürsə — bu, təsvirdir, kod deyil
  if (trimmed.split(/\s+/).length > 2) return false;
  const normalized = normalizeCode(trimmed);
  if (normalized.length < 4) return false;
  // Ən azı bir rəqəm olmalıdır — kodların demək olar hamısında var
  return /\d/.test(normalized);
}

/**
 * Nəticələri xarici SQL DB-dən gələn canlı stokla zənginləşdirir.
 * Xarici DB əlçatmaz olarsa nəticələr OLDUĞU KİMİ qaytarılır (axtarış çökmür).
 *
 * @param {Object[]} products
 * @returns {Promise<{products: Object[], stockMode: string}>}
 */
async function enrichWithLiveStock(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return { products: [], stockMode: 'skipped' };
  }

  try {
    const articleNumbers = products.map(p => p.part_key).filter(Boolean);
    const { stock, mode } = await externalProductService.fetchStock(articleNumbers);

    if (stock.size === 0) {
      return { products, stockMode: mode };
    }

    const updates = [];
    const enriched = products.map((product) => {
      const live = stock.get(product.part_key);
      if (!live) return product;

      if (live.quantity !== product.stock_quantity) {
        updates.push({ part_key: product.part_key, stock_quantity: live.quantity });
      }
      return {
        ...product,
        stock_quantity: live.quantity,
        in_stock:       live.quantity > 0,
        warehouse:      live.warehouse || product.warehouse,
        stock_source:   'live_external_db',
      };
    });

    // Anbardakı stoku da yenilə (arxa planda — cavabı gecikdirməsin)
    if (updates.length > 0 && mode === 'live') {
      partsRepo.updateStockLevels(updates).catch(err => {
        log.warn('Stok yenilənməsi bazaya yazılmadı', { message: err.message });
      });
    }

    return { products: enriched, stockMode: mode };
  } catch (err) {
    log.warn('Canlı stok zənginləşdirməsi atlandı', { message: err.message });
    return { products, stockMode: 'error' };
  }
}

/**
 * TecDoc nəticələrini təmizləyib anbara yazır.
 *
 * @param {Object[]} articles
 * @param {string} oemCode
 * @returns {Promise<Object[]>} — bazaya yazılmış məhsullar
 */
async function persistTecdocResults(articles, oemCode) {
  if (!Array.isArray(articles) || articles.length === 0) return [];

  const normalizedOem = normalizeCode(oemCode);

  // Hər məqaləyə axtarılan OEM kodunu da bağlayırıq ki,
  // növbəti dəfə lokal cross-reference ilə tapılsın.
  const withOem = articles.map(article => ({
    ...article,
    oem_codes: [...new Set([...(article.oem_codes || []), normalizedOem])],
  }));

  const { accepted, rejected, stats } = cleanPartRecords(withOem, {
    source: 'tecdoc',
    defaultCurrency: 'AZN',
  });

  if (rejected.length > 0) {
    log.debug(`TecDoc nəticəsindən ${rejected.length} sətir təmizləmədə rədd edildi.`);
  }

  if (accepted.length === 0) return [];

  await partsRepo.upsertMany(accepted, { markStockSynced: false });
  log.info(`TecDoc nəticəsi anbara yazıldı`, {
    oem: normalizedOem,
    accepted: stats.accepted,
    rejected: stats.rejected,
  });

  // Yazıldıqdan sonra bazadan oxuyuruq — id, qiymət və s. ilə birlikdə
  return partsRepo.findByOemCodes([normalizedOem, ...accepted.map(a => a.part_key)]);
}

// ════════════════════════════════════════════════════════════════
// ƏSAS AXTARIŞ
// ════════════════════════════════════════════════════════════════

/**
 * Ehtiyat hissəsi axtarır (tam orkestrasiya ilə).
 *
 * @param {string} queryText
 * @param {{
 *   limit?: number,
 *   category?: string,
 *   brand?: string,
 *   inStockOnly?: boolean,
 *   useTecdoc?: boolean,
 *   useLiveStock?: boolean
 * }} options
 * @returns {Promise<Object>}
 */
async function search(queryText, options = {}) {
  const startedAt = Date.now();
  const query = String(queryText ?? '').trim();

  const useTecdoc    = options.useTecdoc    !== false;
  const useLiveStock = options.useLiveStock !== false;

  const trace = {
    local_db:   'skipped',
    tecdoc:     'skipped',
    persisted:  0,
    live_stock: 'skipped',
  };

  // ── ADDIM 1: LOKAL BAZA (həmişə birinci) ────────────────────
  let products = await partsRepo.search(query, {
    limit:       options.limit,
    category:    options.category,
    brand:       options.brand,
    inStockOnly: options.inStockOnly,
  });

  trace.local_db = products.length > 0 ? `hit (${products.length})` : 'miss';
  let source = 'local_db';

  // ── ADDIM 2-3: TecDoc (yalnız lokal boşdursa və kod formasındadırsa) ──
  if (products.length === 0 && useTecdoc && looksLikePartCode(query)) {
    log.info(`Lokal bazada tapılmadı → TecDoc sorğusu: "${query}"`);

    const tecdocResult = await tecdocService.lookupByOem(query);
    trace.tecdoc = `${tecdocResult.source} (${tecdocResult.articles.length})`;

    if (tecdocResult.articles.length > 0) {
      // ADDIM 3: nəticəni öz anbarımıza yaz
      const persisted = await persistTecdocResults(tecdocResult.articles, query);
      trace.persisted = persisted.length;
      products = persisted;
      source = `tecdoc_${tecdocResult.source}`;
    }
  } else if (products.length === 0 && useTecdoc) {
    trace.tecdoc = 'skipped (sorğu kod formasında deyil)';
  }

  // ── ADDIM 4: Xarici SQL DB-dən canlı stok ────────────────────
  if (useLiveStock && products.length > 0) {
    const enriched = await enrichWithLiveStock(products);
    products = enriched.products;
    trace.live_stock = enriched.stockMode;
  }

  return {
    query,
    results: products,
    total:   products.length,
    source,
    trace,
    modes: {
      tecdoc:      tecdocService.getMode(),
      external_db: externalProductService.getMode(),
    },
    took_ms: Date.now() - startedAt,
  };
}

/**
 * OEM kodu üzrə birbaşa cross-reference axtarışı (/api/search?oem=...).
 * @param {string} oemCode
 * @param {Object} options
 */
async function searchByOem(oemCode, options = {}) {
  const normalized = normalizeCode(oemCode);
  const startedAt = Date.now();

  const trace = { local_db: 'skipped', tecdoc: 'skipped', persisted: 0, live_stock: 'skipped' };

  // 1. Lokal cross-reference cədvəli
  let products = await partsRepo.findByOemCodes([normalized], { limit: options.limit });
  trace.local_db = products.length > 0 ? `hit (${products.length})` : 'miss';
  let source = 'local_db';

  // 2-3. TecDoc → anbara yaz
  if (products.length === 0 && options.useTecdoc !== false) {
    const tecdocResult = await tecdocService.lookupByOem(normalized);
    trace.tecdoc = `${tecdocResult.source} (${tecdocResult.articles.length})`;

    if (tecdocResult.articles.length > 0) {
      products = await persistTecdocResults(tecdocResult.articles, normalized);
      trace.persisted = products.length;
      source = `tecdoc_${tecdocResult.source}`;
    }
  }

  // 4. Canlı stok
  if (options.useLiveStock !== false && products.length > 0) {
    const enriched = await enrichWithLiveStock(products);
    products = enriched.products;
    trace.live_stock = enriched.stockMode;
  }

  return {
    oem:     normalized,
    results: products,
    total:   products.length,
    source,
    trace,
    modes: { tecdoc: tecdocService.getMode(), external_db: externalProductService.getMode() },
    took_ms: Date.now() - startedAt,
  };
}

module.exports = {
  search,
  searchByOem,
  looksLikePartCode,
  enrichWithLiveStock,
};
