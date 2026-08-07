// ============================================================
// FAYL: server/services/onecService.js
// TƏSVİR: 1C:Enterprise REST/OData inteqrasiyası.
//
//  ⚠️  VACİB — GƏLƏCƏK KONFİQURASİYA ÜÇÜN:
//  Bu faylda HEÇ BİR real URL, login və ya parol YOXDUR.
//  Bütün kimlik məlumatları `.env` faylından oxunur:
//
//      ONEC_BASE_URL=https://1c.sirketiniz.az/base/hs/api
//      ONEC_USER=istifadeci
//      ONEC_PASS=parol
//      ONEC_PRODUCTS_PATH=/products     (opsional)
//      ONEC_STOCK_PATH=/stock           (opsional)
//      ONEC_AUTH_TYPE=basic|bearer|none (default: basic)
//
//  ONEC_BASE_URL boş və ya "mock..." olduqda servis avtomatik
//  MOCK rejimdə işləyir — sistem 1C olmadan da tam işlək qalır.
//  Real məlumatları .env-ə yazan kimi kod dəyişikliyi OLMADAN
//  real rejimə keçir.
//
//  CAVAB FORMATI: 1C quraşdırmaları müxtəlifdir, ona görə
//  `normalizeItem()` həm rusca (Артикул, Цена, Остаток), həm də
//  ingiliscə (article, price, stock) sahə adlarını tanıyır.
// ============================================================

'use strict';

const axios  = require('axios');
const config = require('../config/env');
const { createLogger } = require('../utils/logger');

const log = createLogger('1C');

// ── Mock data ────────────────────────────────────────────────────
// Yalnız 1C konfiqurasiya edilməyibsə istifadə olunur.
// Real inteqrasiyadan sonra bu massiv heç vaxt oxunmur.
const MOCK_PRODUCTS = [
  { onec_id: '1C-0001', article_no: 'K020345',  brand: 'Knorr-Bremse', title: 'Knorr-Bremse Əyləc Bloku',        category: 'Əyləc sistemi',  price: 185.00,  stock_quantity: 24, oem_codes: ['K020345'] },
  { onec_id: '1C-0002', article_no: 'WB911504', brand: 'WABCO',        title: 'WABCO Pnevmatik Tənzimləyici',    category: 'Pnevmatika',     price: 320.50,  stock_quantity: 8,  oem_codes: ['WB911504'] },
  { onec_id: '1C-0003', article_no: 'E500KP02', brand: 'Hengst',       title: 'Hengst Mühərrik Yağ Filtri',      category: 'Filtrlər',       price: 45.00,   stock_quantity: 60, oem_codes: ['E500KP02'] },
  { onec_id: '1C-0004', article_no: 'VL214589', brand: 'Volvo',        title: 'Volvo OEM Sürət Sensoru',         category: 'Elektronika',    price: 210.00,  stock_quantity: 12, oem_codes: ['VL214589'] },
  { onec_id: '1C-0005', article_no: 'SA315480', brand: 'Sachs',        title: 'Sachs Ön Amortizator',            category: 'Asqı sistemi',   price: 450.00,  stock_quantity: 6,  oem_codes: ['SA315480'] },
  { onec_id: '1C-0006', article_no: 'BS020147', brand: 'Bosch',        title: 'Bosch CR Enjeksiya Pompası',      category: 'Yanacaq sistemi',price: 890.00,  stock_quantity: 3,  oem_codes: ['BS020147'] },
  { onec_id: '1C-0007', article_no: 'ZF123456', brand: 'ZF',           title: 'ZF Avtomatik Sürətlər Qutusu',    category: 'Transmissiya',   price: 1200.00, stock_quantity: 2,  oem_codes: ['ZF123456'] },
  { onec_id: '1C-0008', article_no: 'SC440811', brand: 'Scania',       title: 'Scania Dirsəkli Val Başlığı',     category: 'Mühərrik',       price: 540.00,  stock_quantity: 5,  oem_codes: ['SC440811'] },
  { onec_id: '1C-0009', article_no: 'MF994520', brand: 'Mann-Hummel',  title: 'Mann+Hummel Hava Filtri',         category: 'Filtrlər',       price: 38.00,   stock_quantity: 45, oem_codes: ['MF994520'] },
  { onec_id: '1C-0010', article_no: 'BR902211', brand: 'Brembo',       title: 'Brembo Ön Əyləc Diski',           category: 'Əyləc sistemi',  price: 275.00,  stock_quantity: 18, oem_codes: ['BR902211', '0986424785'] },
  { onec_id: '1C-0011', article_no: 'FE501330', brand: 'Ferodo',       title: 'Ferodo Ön Əyləc Lövhəsi Dəsti',   category: 'Əyləc sistemi',  price: 95.00,   stock_quantity: 32, oem_codes: ['FE501330', '0986424785'] },
  { onec_id: '1C-0012', article_no: 'CT660001', brand: 'Continental',  title: 'Continental Poly V-Kəmər',        category: 'Ötürücü',        price: 62.00,   stock_quantity: 20, oem_codes: ['CT660001'] },
  { onec_id: '1C-0013', article_no: 'MB889321', brand: 'Mercedes-Benz',title: 'Mercedes-Benz Termostat',         category: 'Soyutma',        price: 128.00,  stock_quantity: 15, oem_codes: ['MB889321', '1665011200'] },
  { onec_id: '1C-0014', article_no: 'MAN77449', brand: 'MAN',          title: 'MAN Su Pompası',                  category: 'Soyutma',        price: 340.00,  stock_quantity: 9,  oem_codes: ['MAN77449', '81508010022'] },
  { onec_id: '1C-0015', article_no: 'DAF55671', brand: 'DAF',          title: 'DAF Alternator 28V',              category: 'Elektronika',    price: 720.00,  stock_quantity: 4,  oem_codes: ['DAF55671'] },
];

// ── HTTP klienti ─────────────────────────────────────────────────

let httpClient = null;

/** Konfiqurasiyaya uyğun axios instansiyası qurur (bir dəfə). */
function getClient() {
  if (httpClient) return httpClient;

  const headers = { Accept: 'application/json' };
  const options = {
    baseURL: config.onec.baseUrl,
    timeout: config.onec.timeoutMs,
    headers,
    // Böyük kataloqlar üçün cavab limiti (yaddaş müdafiəsi)
    maxContentLength: 64 * 1024 * 1024,
    maxRedirects: 3,
    // Yalnız 2xx uğurlu sayılsın
    validateStatus: (status) => status >= 200 && status < 300,
  };

  if (config.onec.authType === 'bearer' && config.onec.token) {
    headers.Authorization = `Bearer ${config.onec.token}`;
  } else if (config.onec.authType === 'basic') {
    options.auth = { username: config.onec.user, password: config.onec.password };
  }

  httpClient = axios.create(options);
  return httpClient;
}

/** Test/konfiqurasiya dəyişikliyi üçün klienti sıfırlayır. */
function resetClient() { httpClient = null; }

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
 * 1C-nin müxtəlif sahə adlandırmalarını vahid formata gətirir.
 * Sətir HƏLƏ təmizlənməyib — təmizləmə dataCleaningService-də olur.
 *
 * @param {Object} item
 * @returns {Object}
 */
function normalizeItem(item) {
  if (!item || typeof item !== 'object') return {};

  const oemRaw = firstOf(item, [
    'oem_codes', 'OEMCodes', 'КодыОЕМ', 'Аналоги', 'analogs', 'crossReferences',
  ]);

  const oemSingle = firstOf(item, ['oem_code', 'OEMCode', 'КодОЕМ', 'ОЕМ', 'oem']);

  let oemCodes = [];
  if (Array.isArray(oemRaw)) {
    oemCodes = oemRaw.map(v => (typeof v === 'object' ? firstOf(v, ['code', 'Код', 'value']) : v)).filter(Boolean);
  } else if (typeof oemRaw === 'string') {
    oemCodes = oemRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  }
  if (oemSingle) oemCodes.push(oemSingle);

  return {
    onec_id: firstOf(item, [
      'onec_id', 'id', 'ID', 'Ref_Key', 'Код', 'КодТовара', 'Guid', 'guid',
    ]),
    article_no: firstOf(item, [
      'article_no', 'article', 'Артикул', 'АртикулПроизводителя', 'vendorCode', 'VendorCode', 'sku', 'Код',
    ]),
    brand: firstOf(item, [
      'brand', 'Бренд', 'Производитель', 'manufacturer', 'Manufacturer', 'ТорговаяМарка',
    ]),
    title: firstOf(item, [
      'title', 'name', 'Наименование', 'НаименованиеТовара', 'Description', 'НаименованиеПолное',
    ]),
    description: firstOf(item, [
      'description', 'Описание', 'Комментарий', 'fullDescription',
    ]),
    category: firstOf(item, [
      'category', 'Категория', 'ГруппаТоваров', 'group', 'Группа', 'ВидНоменклатуры',
    ]),
    price: firstOf(item, [
      'price', 'Цена', 'ЦенаПродажи', 'РозничнаяЦена', 'sellPrice', 'Price',
    ]),
    currency: firstOf(item, [
      'currency', 'Валюта', 'ВалютаЦены', 'currencyCode',
    ]),
    stock_quantity: firstOf(item, [
      'stock_quantity', 'stock', 'quantity', 'Остаток', 'КоличествоОстаток', 'Количество', 'СвободныйОстаток', 'Qty',
    ]),
    warehouse: firstOf(item, [
      'warehouse', 'Склад', 'СкладНаименование', 'storage',
    ]),
    oem_codes: oemCodes,
  };
}

/** Cavabın gövdəsindən sətir massivini çıxarır (OData / düz massiv / sarğı). */
function extractItems(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  // OData: { value: [...] }, digərləri: { data: [...] }, { items: [...] }
  for (const key of ['value', 'data', 'items', 'result', 'rows', 'Товары', 'products']) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

// ── İctimai API ──────────────────────────────────────────────────

/** Servisin hazırkı rejimi. */
function getMode() {
  return config.onec.enabled ? 'live' : 'mock';
}

/**
 * 1C-dən bütün məhsul kataloqunu gətirir (səhifə-səhifə).
 *
 * @returns {Promise<{items: Object[], mode: 'live'|'mock', pages: number}>}
 */
async function fetchProducts() {
  if (!config.onec.enabled) {
    log.info('1C konfiqurasiya edilməyib → MOCK rejim (.env-də ONEC_BASE_URL təyin edin).');
    return { items: MOCK_PRODUCTS.map(normalizeItem), mode: 'mock', pages: 1 };
  }

  const client = getClient();
  const collected = [];
  let page = 0;

  log.info('1C kataloq sorğusu başladı', {
    baseUrl: config.onec.baseUrl,
    path:    config.onec.productsPath,
  });

  while (page < config.onec.maxPages) {
    const params = {
      $top:    config.onec.pageSize,
      $skip:   page * config.onec.pageSize,
      $format: 'json',
    };

    const response = await client.get(config.onec.productsPath, { params });
    const items = extractItems(response.data);

    if (items.length === 0) break;

    collected.push(...items.map(normalizeItem));
    page += 1;

    // Sonuncu səhifə (tam dolmayıb) → dayan
    if (items.length < config.onec.pageSize) break;
  }

  if (page >= config.onec.maxPages) {
    log.warn(`Səhifə limiti (${config.onec.maxPages}) doldu — kataloq natamam ola bilər. ONEC_MAX_PAGES artırın.`);
  }

  log.info(`1C-dən ${collected.length} sətir alındı (${page} səhifə).`);
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

  if (!config.onec.enabled) {
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
    const client = getClient();
    const response = await client.get(config.onec.stockPath, {
      params: { articles: codes.join(',') },
    });

    for (const item of extractItems(response.data)) {
      const normalized = normalizeItem(item);
      const key = String(normalized.article_no || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!key) continue;
      stock.set(key, {
        quantity:  Number.parseInt(normalized.stock_quantity, 10) || 0,
        warehouse: normalized.warehouse,
      });
    }
    return { stock, mode: 'live' };
  } catch (err) {
    // Stok sorğusu uğursuz olarsa axtarış TAM DAYANMAMALIDIR —
    // istifadəçi bazadakı (bir qədər köhnə) stoku görsün.
    log.warn('1C canlı stok sorğusu alınmadı — bazadakı stok istifadə olunacaq', {
      message: err.message,
      status:  err.response?.status,
    });
    return { stock, mode: 'degraded' };
  }
}

/** Bağlantı yoxlaması (health endpoint üçün). */
async function healthCheck() {
  if (!config.onec.enabled) {
    return { ok: true, mode: 'mock', note: '1C konfiqurasiya edilməyib (.env)' };
  }
  try {
    const startedAt = Date.now();
    await getClient().get(config.onec.productsPath, { params: { $top: 1, $format: 'json' } });
    return { ok: true, mode: 'live', latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { ok: false, mode: 'live', error: err.message, status: err.response?.status };
  }
}

module.exports = {
  fetchProducts,
  fetchStock,
  healthCheck,
  getMode,
  normalizeItem,
  resetClient,
  MOCK_PRODUCTS,
};
