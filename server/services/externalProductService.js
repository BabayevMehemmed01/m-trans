// ============================================================
// FAYL: server/services/externalProductService.js
// TƏSVİR: Xarici MS SQL Server (Read-Only) kataloq inteqrasiyası.
//
//  ⚠️  1C REST/OData inteqrasiyası ARTIQ İSTİFADƏ OLUNMUR.
//  Bu servis 15 dəqiqəlik sinxronizasiya cron-u üçün məhsul
//  kataloqunu (OEM kodu, artikul/brend kodu, kateqoriya, ad,
//  miqdar, qiymət, təsvir) birbaşa xarici SQL bazasından çəkir.
//
//  KONFİQURASİYA (.env, bax config/env.js):
//      EXTERNAL_DB_HOST, EXTERNAL_DB_PORT, EXTERNAL_DB_NAME,
//      EXTERNAL_DB_USER, EXTERNAL_DB_PASSWORD
//      EXTERNAL_DB_PRODUCTS_TABLE  (default: dbo.Products)
//      EXTERNAL_DB_PRODUCTS_QUERY  (opsional — tam sərbəst SELECT)
//
//  EXTERNAL_DB_HOST/NAME/USER/PASSWORD boş qalarsa servis avtomatik
//  MOCK rejimdə işləyir — sistem xarici DB olmadan da tam işlək qalır.
//
//  ÇIXIŞ FORMATI: `normalizeRow()` bütün sətirləri
//  `dataCleaningService`-in gözlədiyi vahid formaya salır — bu format
//  köhnə 1C inteqrasiyası ilə TAM UYĞUNDUR, ona görə sync/upsert
//  axını heç bir dəyişiklik tələb etmir.
// ============================================================

'use strict';

const config     = require('../config/env');
const externalDb = require('../db/externalDb');
const { createLogger } = require('../utils/logger');

const log = createLogger('ExternalDB');

// ── Mock data ────────────────────────────────────────────────────
// Yalnız xarici DB konfiqurasiya edilməyibsə istifadə olunur.
// Real inteqrasiyadan sonra bu massiv heç vaxt oxunmur.
const MOCK_PRODUCTS = [
  { external_id: 'EXT-0001', article_no: 'K020345',  brand: 'Knorr-Bremse', title: 'Knorr-Bremse Əyləc Bloku',        category: 'Əyləc sistemi',  price: 185.00,  stock_quantity: 24, oem_codes: ['K020345'] },
  { external_id: 'EXT-0002', article_no: 'WB911504', brand: 'WABCO',        title: 'WABCO Pnevmatik Tənzimləyici',    category: 'Pnevmatika',     price: 320.50,  stock_quantity: 8,  oem_codes: ['WB911504'] },
  { external_id: 'EXT-0003', article_no: 'E500KP02', brand: 'Hengst',       title: 'Hengst Mühərrik Yağ Filtri',      category: 'Filtrlər',       price: 45.00,   stock_quantity: 60, oem_codes: ['E500KP02'] },
  { external_id: 'EXT-0004', article_no: 'VL214589', brand: 'Volvo',        title: 'Volvo OEM Sürət Sensoru',         category: 'Elektronika',    price: 210.00,  stock_quantity: 12, oem_codes: ['VL214589'] },
  { external_id: 'EXT-0005', article_no: 'SA315480', brand: 'Sachs',        title: 'Sachs Ön Amortizator',            category: 'Asqı sistemi',   price: 450.00,  stock_quantity: 6,  oem_codes: ['SA315480'] },
  { external_id: 'EXT-0006', article_no: 'BS020147', brand: 'Bosch',        title: 'Bosch CR Enjeksiya Pompası',      category: 'Yanacaq sistemi',price: 890.00,  stock_quantity: 3,  oem_codes: ['BS020147'] },
  { external_id: 'EXT-0007', article_no: 'ZF123456', brand: 'ZF',           title: 'ZF Avtomatik Sürətlər Qutusu',    category: 'Transmissiya',   price: 1200.00, stock_quantity: 2,  oem_codes: ['ZF123456'] },
  { external_id: 'EXT-0008', article_no: 'SC440811', brand: 'Scania',       title: 'Scania Dirsəkli Val Başlığı',     category: 'Mühərrik',       price: 540.00,  stock_quantity: 5,  oem_codes: ['SC440811'] },
  { external_id: 'EXT-0009', article_no: 'MF994520', brand: 'Mann-Hummel',  title: 'Mann+Hummel Hava Filtri',         category: 'Filtrlər',       price: 38.00,   stock_quantity: 45, oem_codes: ['MF994520'] },
  { external_id: 'EXT-0010', article_no: 'BR902211', brand: 'Brembo',       title: 'Brembo Ön Əyləc Diski',           category: 'Əyləc sistemi',  price: 275.00,  stock_quantity: 18, oem_codes: ['BR902211', '0986424785'] },
  { external_id: 'EXT-0011', article_no: 'FE501330', brand: 'Ferodo',       title: 'Ferodo Ön Əyləc Lövhəsi Dəsti',   category: 'Əyləc sistemi',  price: 95.00,   stock_quantity: 32, oem_codes: ['FE501330', '0986424785'] },
  { external_id: 'EXT-0012', article_no: 'CT660001', brand: 'Continental',  title: 'Continental Poly V-Kəmər',        category: 'Ötürücü',        price: 62.00,   stock_quantity: 20, oem_codes: ['CT660001'] },
  { external_id: 'EXT-0013', article_no: 'MB889321', brand: 'Mercedes-Benz',title: 'Mercedes-Benz Termostat',         category: 'Soyutma',        price: 128.00,  stock_quantity: 15, oem_codes: ['MB889321', '1665011200'] },
  { external_id: 'EXT-0014', article_no: 'MAN77449', brand: 'MAN',          title: 'MAN Su Pompası',                  category: 'Soyutma',        price: 340.00,  stock_quantity: 9,  oem_codes: ['MAN77449', '81508010022'] },
  { external_id: 'EXT-0015', article_no: 'DAF55671', brand: 'DAF',          title: 'DAF Alternator 28V',              category: 'Elektronika',    price: 720.00,  stock_quantity: 4,  oem_codes: ['DAF55671'] },
];

// ── SQL sorğusu ──────────────────────────────────────────────────
//
// Sütunlar MÜTLƏQ bu alias adları ilə qaytarılmalıdır ki,
// `normalizeRow()` onları tanısın. Öz sxeminizə uyğun olaraq
// .env-də EXTERNAL_DB_PRODUCTS_QUERY ilə tam sərbəst SELECT verə
// bilərsiniz (aşağıdakı default sorğu YALNIZ nümunədir).
function buildDefaultProductsQuery() {
  const table = config.externalDb.productsTable;
  return `
    SELECT
      CAST(p.Id          AS NVARCHAR(100)) AS external_id,
      p.OEMCode                             AS oem_code,
      p.ArticleNo                           AS article_no,
      p.Brand                               AS brand,
      p.CategoryName                        AS category,
      p.ProductName                         AS title,
      p.Details                             AS description,
      p.Price                               AS price,
      p.Currency                            AS currency,
      p.Quantity                            AS stock_quantity,
      p.Warehouse                           AS warehouse
    FROM ${table} AS p
    ORDER BY p.Id
  `;
}

function getProductsQuery() {
  return config.externalDb.productsQuery || buildDefaultProductsQuery();
}

// ── Cavab normallaşdırması ───────────────────────────────────────

/** İlk mövcud (boş olmayan) sahəni qaytarır. */
function firstOf(source, keys) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

/**
 * Xarici SQL sətrini (və ya mock obyekti) dataCleaningService-in
 * gözlədiyi vahid formata gətirir. Sətir HƏLƏ təmizlənməyib —
 * təmizləmə `dataCleaningService`-də olur.
 *
 * @param {Object} row
 * @returns {Object}
 */
function normalizeRow(row) {
  if (!row || typeof row !== 'object') return {};

  const oemRaw = firstOf(row, ['oem_codes', 'oem_code', 'OEMCode', 'oemCode']);
  let oemCodes = [];
  if (Array.isArray(oemRaw)) {
    oemCodes = oemRaw.filter(Boolean);
  } else if (typeof oemRaw === 'string') {
    oemCodes = oemRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  }

  return {
    // `onec_id` sütunu bazada saxlanılır — indi xarici mənbənin
    // öz unikal ID-sini daşıyır (sxem dəyişmədən idempotent upsert
    // üçün istifadə olunur).
    onec_id: firstOf(row, ['external_id', 'id', 'Id', 'ExternalId']),
    article_no: firstOf(row, ['article_no', 'brand_code', 'ArticleNo', 'BrandCode', 'sku', 'Sku']),
    brand: firstOf(row, ['brand', 'Brand', 'manufacturer', 'Manufacturer']),
    title: firstOf(row, ['title', 'name', 'ProductName', 'Name']),
    description: firstOf(row, ['description', 'details', 'Details', 'Description']),
    category: firstOf(row, ['category', 'CategoryName', 'Category']),
    price: firstOf(row, ['price', 'Price']),
    currency: firstOf(row, ['currency', 'Currency']),
    stock_quantity: firstOf(row, ['stock_quantity', 'quantity', 'Quantity', 'Qty']),
    warehouse: firstOf(row, ['warehouse', 'Warehouse']),
    oem_codes: oemCodes,
  };
}

// ── İctimai API ──────────────────────────────────────────────────

/** Servisin hazırkı rejimi. */
function getMode() {
  return config.externalDb.enabled ? 'live' : 'mock';
}

/**
 * Xarici SQL bazasından bütün məhsul kataloqunu gətirir (səhifə-səhifə).
 *
 * @returns {Promise<{items: Object[], mode: 'live'|'mock', pages: number}>}
 */
async function fetchProducts() {
  if (!config.externalDb.enabled) {
    log.info('Xarici DB konfiqurasiya edilməyib → MOCK rejim (.env-də EXTERNAL_DB_* təyin edin).');
    return { items: MOCK_PRODUCTS.map(normalizeRow), mode: 'mock', pages: 1 };
  }

  const pool = await externalDb.getPool();
  const pageSize = config.externalDb.pageSize;
  const baseQuery = getProductsQuery();
  const collected = [];
  let page = 0;

  log.info('Xarici SQL kataloq sorğusu başladı', {
    host:     config.externalDb.host,
    database: config.externalDb.database,
    table:    config.externalDb.productsTable,
  });

  // Sərbəst (custom) sorğu verilibsə səhifələmə tətbiq etmirik —
  // istifadəçi öz sorğusunda WHERE/ORDER BY özü idarə edir və nəticə
  // birdəfəlik alınır. Default sorğuda isə OFFSET/FETCH ilə səhifələnir.
  if (config.externalDb.productsQuery) {
    const result = await pool.request().query(baseQuery);
    collected.push(...result.recordset.map(normalizeRow));
    log.info(`Xarici DB-dən ${collected.length} sətir alındı (sərbəst sorğu).`);
    return { items: collected, mode: 'live', pages: 1 };
  }

  while (page < config.externalDb.maxPages) {
    const offset = page * pageSize;
    const pagedQuery = `${baseQuery} OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
    const result = await pool.request().query(pagedQuery);
    const rows = result.recordset;

    if (rows.length === 0) break;

    collected.push(...rows.map(normalizeRow));
    page += 1;

    if (rows.length < pageSize) break; // sonuncu (natamam) səhifə
  }

  if (page >= config.externalDb.maxPages) {
    log.warn(`Səhifə limiti (${config.externalDb.maxPages}) doldu — kataloq natamam ola bilər. EXTERNAL_DB_MAX_PAGES artırın.`);
  }

  log.info(`Xarici DB-dən ${collected.length} sətir alındı (${page} səhifə).`);
  return { items: collected, mode: 'live', pages: page };
}

/**
 * Konkret artikullar üzrə CANLI stok məlumatı sorğusu.
 * Axtarış nəticələrini "real vaxt" stokla zənginləşdirmək üçün.
 *
 * @param {string[]} articleNumbers
 * @returns {Promise<{stock: Map<string, {quantity: number, warehouse?: string}>, mode: string}>}
 */
async function fetchStock(articleNumbers) {
  const codes = [...new Set((articleNumbers || []).filter(Boolean).map(String))];
  const stock = new Map();

  if (codes.length === 0) return { stock, mode: getMode() };

  if (!config.externalDb.enabled) {
    // Mock rejim: kataloqdakı statik miqdarları qaytar
    for (const code of codes) {
      const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const found = MOCK_PRODUCTS.find(
        p => p.article_no.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized
      );
      if (found) stock.set(normalized, { quantity: found.stock_quantity, warehouse: 'Mock Anbar' });
    }
    return { stock, mode: 'mock' };
  }

  try {
    const pool = await externalDb.getPool();
    const table = config.externalDb.productsTable;

    // SQL Server parametr limitinə düşməmək üçün böyük siyahılar bölünür.
    const CHUNK_SIZE = 500;
    for (let i = 0; i < codes.length; i += CHUNK_SIZE) {
      const chunk = codes.slice(i, i + CHUNK_SIZE);
      const request = pool.request();
      const placeholders = chunk.map((code, idx) => {
        const paramName = `code${idx}`;
        request.input(paramName, externalDb.sql.NVarChar(100), code);
        return `@${paramName}`;
      });

      const query = `
        SELECT p.ArticleNo AS article_no, p.Quantity AS stock_quantity, p.Warehouse AS warehouse
          FROM ${table} AS p
         WHERE p.ArticleNo IN (${placeholders.join(', ')})
            OR p.OEMCode   IN (${placeholders.join(', ')})
      `;

      const result = await request.query(query);
      for (const row of result.recordset) {
        const normalized = normalizeRow(row);
        const key = String(normalized.article_no || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!key) continue;
        stock.set(key, {
          quantity:  Number.parseInt(normalized.stock_quantity, 10) || 0,
          warehouse: normalized.warehouse,
        });
      }
    }
    return { stock, mode: 'live' };
  } catch (err) {
    // Stok sorğusu uğursuz olarsa axtarış TAM DAYANMAMALIDIR —
    // istifadəçi bazadakı (bir qədər köhnə) stoku görsün.
    log.warn('Xarici DB canlı stok sorğusu alınmadı — bazadakı stok istifadə olunacaq', {
      message: err.message,
    });
    return { stock, mode: 'degraded' };
  }
}

/** Bağlantı yoxlaması (health endpoint üçün). */
async function healthCheck() {
  if (!config.externalDb.enabled) {
    return { ok: true, mode: 'mock', note: 'Xarici DB konfiqurasiya edilməyib (.env)' };
  }
  try {
    const startedAt = Date.now();
    const pool = await externalDb.getPool();
    await pool.request().query('SELECT 1 AS ok');
    return { ok: true, mode: 'live', latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { ok: false, mode: 'live', error: err.message };
  }
}

module.exports = {
  fetchProducts,
  fetchStock,
  healthCheck,
  getMode,
  normalizeRow,
  MOCK_PRODUCTS,
};
