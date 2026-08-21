// ============================================================
// FAYL: server/controllers/searchController.js
// TƏSVİR: Ehtiyat hissəsi axtarış kontrolleri.
//         Bütün orkestrasiya (lokal baza → TecDoc → xarici DB canlı stok)
//         partsSearchService-də cəmlənib — bu fayl yalnız HTTP qatıdır.
// ============================================================

'use strict';

const partsSearchService = require('../services/partsSearchService');
const partsRepo = require('../db/repositories/partsRepository');
const { cleanSearchQuery } = require('../utils/sanitize');

/**
 * GET /api/search?oem=K020345
 * OEM/artikul kodu ilə cross-reference axtarışı.
 */
async function searchByOem(req, res) {
  const oem = cleanSearchQuery(req.query.oem, 60);
  if (!oem || oem.length < 2) {
    return res.status(400).json({ error: 'oem parametri tələb olunur (min 2 simvol).' });
  }

  const result = await partsSearchService.searchByOem(oem);
  return res.json(result);
}

/**
 * GET /api/products?q=&category=&brand=&inStockOnly=&limit=&offset=
 * Ümumi mətn axtarışı / kataloq siyahısı (tam orkestrasiya ilə).
 */
async function listProducts(req, res) {
  const q = cleanSearchQuery(req.query.q, 120);
  const options = {
    category:    req.query.category ? cleanSearchQuery(req.query.category, 120) : undefined,
    brand:       req.query.brand ? cleanSearchQuery(req.query.brand, 120) : undefined,
    inStockOnly: req.query.inStockOnly === 'true',
    limit:       req.query.limit,
  };

  if (!q) {
    // Sorğu yoxdursa TecDoc/xarici DB orkestrasiyasına ehtiyac yoxdur — sadəcə siyahı.
    const results = await partsRepo.listRecent(options);
    return res.json({ query: '', results, total: results.length, source: 'local_db' });
  }

  const result = await partsSearchService.search(q, options);
  return res.json(result);
}

/** GET /api/categories */
async function listCategories(req, res) {
  const categories = await partsRepo.listCategories();
  return res.json({ categories });
}

/** GET /api/brands */
async function listBrands(req, res) {
  const brands = await partsRepo.listBrands();
  return res.json({ brands });
}

module.exports = { searchByOem, listProducts, listCategories, listBrands };
