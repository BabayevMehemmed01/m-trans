// ============================================================
// FAYL: server/services/dataCleaningService.js
// TƏSVİR: Verilənlər Anbarı üçün MƏLUMAT TƏMİZLƏMƏ (data cleaning)
//         servisi.
//
//  Hansı mənbədən (1C, TecDoc, manual import) gəlməsindən asılı
//  olmayaraq BÜTÜN məlumatlar bazaya düşməzdən əvvəl buradan keçir.
//
//  MƏRHƏLƏLƏR:
//    1. NORMALLAŞDIRMA — kodlar, brendlər, qiymətlər vahid formaya
//    2. VALİDASİYA     — məcburi sahələr, məntiqi hədlər
//    3. ZİBİL FİLTRİ   — "test", "---", "не использовать" və s.
//    4. KEYFİYYƏT BALI — 0-100 arası dolğunluq qiymətləndirməsi
//    5. DEDUPLİKASİYA  — eyni part_key-li sətirlər ağıllı birləşdirilir
//
//  PRİNSİP: rədd edilən heç bir sətir SÜKUTLA İTMİR — səbəbi ilə
//  birlikdə `data_quality_issues` karantininə yazılır.
// ============================================================

'use strict';

const { cleanText } = require('../utils/sanitize');
const {
  normalizeCode,
  normalizeBrand,
  buildPartKey,
  parsePrice,
  parseQuantity,
  normalizeCurrency,
  displayCode,
} = require('../utils/normalize');
const { createLogger } = require('../utils/logger');

const log = createLogger('DataCleaning');

// ── Hədlər ───────────────────────────────────────────────────────
const LIMITS = {
  titleMin:      3,
  titleMax:      500,
  descriptionMax: 4000,
  articleMin:    2,
  articleMax:    60,
  priceMax:      10_000_000,   // absurd qiymətlər (məs. 1C-də vergül səhvi)
  stockMax:      1_000_000,
  categoryMax:   120,
  brandMax:      120,
};

// ── Zibil (junk) nümunələri ──────────────────────────────────────
// 1C bazalarında real qarşılaşılan "boş" dəyərlər.
const JUNK_EXACT = new Set([
  'test', 'testtest', 'xxx', 'xxxx', 'na', 'n/a', 'null', 'undefined', 'none',
  'yoxdur', 'bos', 'boş', '---', '--', '-', '.', '..', '...', '0', '00', '000',
  'нет', 'нету', 'пусто', 'тест', 'удалить', 'неиспользуемый', 'не использовать',
  'delete', 'deleted', 'silinsin', 'unknown', 'noname', 'no name', 'dummy',
]);

const JUNK_PATTERNS = [
  /^[\s\-_.=*#]+$/,            // yalnız durğu/ayırıcı simvollar
  /^(test|тест|demo)[\s\-_]*\d*$/i,
  /^z+$/i,
  /^\?+$/,
  /удалить|не\s*использовать|списан/i,
  /^köhnə\s*silinsin/i,
];

/**
 * Mətnin "zibil" olub-olmadığını yoxlayır.
 * @param {string} value
 * @returns {boolean}
 */
function isJunkText(value) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  if (JUNK_EXACT.has(normalized)) return true;
  return JUNK_PATTERNS.some(re => re.test(normalized));
}

/**
 * Artikul kodunun mənasız olub-olmadığını yoxlayır.
 * @param {string} code — artıq normallaşdırılmış (A-Z0-9)
 * @returns {boolean}
 */
function isJunkCode(code) {
  if (!code || code.length < LIMITS.articleMin) return true;
  if (/^0+$/.test(code)) return true;              // "000000"
  if (/^(.)\1+$/.test(code)) return true;          // "AAAAAA", "111111"
  if (JUNK_EXACT.has(code.toLowerCase())) return true;
  return false;
}

// ── Keyfiyyət balı ───────────────────────────────────────────────

/**
 * Sətrin dolğunluğunu 0-100 arası qiymətləndirir.
 * Deduplikasiyada "hansı sətir daha yaxşıdır" sualına cavab verir.
 *
 * @param {Object} record
 * @returns {number}
 */
function scoreQuality(record) {
  let score = 0;
  if (record.article_no)                score += 25;
  if (record.title && record.title.length >= 8) score += 20;
  else if (record.title)                score += 10;
  if (record.brand)                     score += 15;
  if (record.price !== null && record.price > 0) score += 15;
  if (record.stock_quantity !== null)   score += 10;
  if (record.category)                  score += 8;
  if (record.description)               score += 5;
  if (record.oem_codes && record.oem_codes.length > 0) score += 2;
  return Math.min(100, score);
}

// ── Bir sətrin normallaşdırılması ────────────────────────────────

/**
 * Xam sətri kanonik anbar formatına salır.
 *
 * @param {Object} raw — mənbədən gələn normallaşdırılmamış obyekt
 * @param {{source: string, defaultCurrency?: string}} context
 * @returns {{record: Object|null, reasons: string[]}}
 */
function normalizeRecord(raw, context) {
  const reasons = [];

  if (!raw || typeof raw !== 'object') {
    return { record: null, reasons: ['sətir obyekt deyil'] };
  }

  // ── Mətn sahələri ────────────────────────────────────────────
  const title       = cleanText(raw.title, LIMITS.titleMax);
  const description = cleanText(raw.description, LIMITS.descriptionMax);
  const category    = cleanText(raw.category, LIMITS.categoryMax);
  const brand       = normalizeBrand(raw.brand).slice(0, LIMITS.brandMax);
  const warehouse   = cleanText(raw.warehouse, 120);

  // ── Kodlar ───────────────────────────────────────────────────
  const articleNorm = normalizeCode(raw.article_no ?? raw.brand_code);
  const partKey     = buildPartKey(articleNorm);

  // OEM kodları: massiv və ya tək dəyər ola bilər
  const rawOemList = Array.isArray(raw.oem_codes)
    ? raw.oem_codes
    : [raw.oem_codes ?? raw.oem_code].filter(Boolean);

  const oemCodes = [...new Set(
    rawOemList
      .map(code => normalizeCode(code))
      .filter(code => code && !isJunkCode(code))
  )];

  // Detalın öz artikulu da OEM kimi axtarıla bilməlidir
  if (partKey && !oemCodes.includes(partKey)) oemCodes.unshift(partKey);

  // ── Ədədi sahələr ────────────────────────────────────────────
  const price    = parsePrice(raw.price);
  const quantity = parseQuantity(raw.stock_quantity ?? raw.quantity ?? raw.stock);
  const currency = normalizeCurrency(raw.currency, context.defaultCurrency || 'AZN');

  // ── 1C identifikatoru ────────────────────────────────────────
  const onecId = cleanText(raw.onec_id, 100) || null;

  const record = {
    part_key:       partKey,
    onec_id:        onecId,
    article_no:     displayCode(raw.article_no ?? raw.brand_code) || articleNorm,
    brand:          brand || null,
    title:          title || null,
    description:    description || null,
    category:       category || null,
    price:          price,
    currency:       currency,
    stock_quantity: quantity,
    warehouse:      warehouse || null,
    source:         context.source,
    oem_codes:      oemCodes,
    is_active:      raw.is_active === undefined ? true : Boolean(raw.is_active),
  };

  return { record, reasons };
}

// ── Validasiya ───────────────────────────────────────────────────

/**
 * Normallaşdırılmış sətri yoxlayır.
 * @param {Object} record
 * @returns {string[]} — problem səbəbləri (boşdursa sətir keçərlidir)
 */
function validateRecord(record) {
  const reasons = [];

  // Artikul — mütləq şərt (kanonik açar ondan qurulur)
  if (!record.part_key) {
    reasons.push('artikul (article_no) yoxdur');
  } else if (isJunkCode(record.part_key)) {
    reasons.push(`artikul mənasızdır: "${record.part_key}"`);
  } else if (record.part_key.length > LIMITS.articleMax) {
    reasons.push(`artikul həddindən uzundur (${record.part_key.length})`);
  }

  // Ad
  if (!record.title) {
    reasons.push('məhsul adı yoxdur');
  } else if (record.title.length < LIMITS.titleMin) {
    reasons.push(`məhsul adı çox qısadır: "${record.title}"`);
  } else if (isJunkText(record.title)) {
    reasons.push(`məhsul adı zibildir: "${record.title}"`);
  }

  // Brend zibildirsə — sətri rədd etmirik, sadəcə brendi silirik
  if (record.brand && isJunkText(record.brand)) {
    record.brand = null;
  }
  if (record.category && isJunkText(record.category)) {
    record.category = null;
  }
  if (record.description && isJunkText(record.description)) {
    record.description = null;
  }

  // Qiymət
  if (record.price !== null) {
    if (record.price < 0) {
      reasons.push(`mənfi qiymət: ${record.price}`);
    } else if (record.price > LIMITS.priceMax) {
      reasons.push(`qeyri-real qiymət: ${record.price}`);
    }
  }

  // Stok
  if (record.stock_quantity !== null) {
    if (record.stock_quantity > LIMITS.stockMax) {
      reasons.push(`qeyri-real stok: ${record.stock_quantity}`);
    }
  }

  return reasons;
}

// ── Deduplikasiya / birləşdirmə ──────────────────────────────────

/**
 * Eyni detalın iki variantını birləşdirir.
 * Qayda: hər sahə üçün "daha dolğun" dəyər qalır; bərabər olduqda
 * daha yüksək keyfiyyət balına malik sətrin dəyəri üstün sayılır.
 *
 * @param {Object} existing
 * @param {Object} incoming
 * @returns {{merged: Object, conflicts: string[]}}
 */
function mergeRecords(existing, incoming) {
  const conflicts = [];
  const preferIncoming = scoreQuality(incoming) > scoreQuality(existing);

  /** Boş olmayan dəyəri seç; ikisi də doludursa keyfiyyətə görə. */
  const pick = (field) => {
    const a = existing[field];
    const b = incoming[field];
    if (a === null || a === undefined || a === '') return b;
    if (b === null || b === undefined || b === '') return a;
    if (a !== b) {
      // Brend toqquşması xüsusi əhəmiyyət daşıyır (part_key toqquşması ola bilər)
      if (field === 'brand') conflicts.push(`brend toqquşması: "${a}" ↔ "${b}"`);
      return preferIncoming ? b : a;
    }
    return a;
  };

  const merged = {
    ...existing,
    onec_id:     existing.onec_id ?? incoming.onec_id,
    article_no:  pick('article_no'),
    brand:       pick('brand'),
    title:       pick('title'),
    description: pick('description'),
    category:    pick('category'),
    warehouse:   pick('warehouse'),
    currency:    pick('currency'),
    // Qiymət və stok: HƏMİŞƏ ən son gələn (daha təzə) dəyər
    price:          incoming.price !== null ? incoming.price : existing.price,
    stock_quantity: incoming.stock_quantity !== null ? incoming.stock_quantity : existing.stock_quantity,
    // OEM kodları birləşdirilir
    oem_codes:   [...new Set([...(existing.oem_codes || []), ...(incoming.oem_codes || [])])],
    is_active:   existing.is_active || incoming.is_active,
  };

  merged.quality_score = scoreQuality(merged);
  return { merged, conflicts };
}

// ── Əsas giriş nöqtəsi ───────────────────────────────────────────

/**
 * Xam sətir massivini təmizləyir və anbara yazılmağa hazır hala gətirir.
 *
 * @param {Object[]} rawRecords
 * @param {{source: string, defaultCurrency?: string}} context
 * @returns {{
 *   accepted: Object[],
 *   rejected: Array<{raw: Object, reasons: string[]}>,
 *   stats: Object
 * }}
 */
function cleanPartRecords(rawRecords, context) {
  const startedAt = Date.now();
  const source = context?.source || 'manual';

  if (!Array.isArray(rawRecords)) {
    log.warn('cleanPartRecords massiv gözləyirdi', { received: typeof rawRecords });
    return {
      accepted: [],
      rejected: [],
      stats: { fetched: 0, accepted: 0, rejected: 0, duplicates: 0, conflicts: 0, durationMs: 0 },
    };
  }

  const byPartKey = new Map();
  const rejected  = [];
  let duplicates  = 0;
  const allConflicts = [];

  for (const raw of rawRecords) {
    // 1-2. Normallaşdırma
    const { record, reasons: normReasons } = normalizeRecord(raw, { source, ...context });
    if (!record) {
      rejected.push({ raw, reasons: normReasons });
      continue;
    }

    // 3-4. Validasiya + zibil filtri
    const reasons = validateRecord(record);
    if (reasons.length > 0) {
      rejected.push({ raw, reasons });
      continue;
    }

    record.quality_score = scoreQuality(record);

    // 5. Deduplikasiya
    const existing = byPartKey.get(record.part_key);
    if (existing) {
      duplicates += 1;
      const { merged, conflicts } = mergeRecords(existing, record);
      byPartKey.set(record.part_key, merged);
      if (conflicts.length > 0) {
        allConflicts.push({ part_key: record.part_key, conflicts });
      }
    } else {
      byPartKey.set(record.part_key, record);
    }
  }

  const accepted = [...byPartKey.values()];
  const stats = {
    fetched:    rawRecords.length,
    accepted:   accepted.length,
    rejected:   rejected.length,
    duplicates,
    conflicts:  allConflicts.length,
    durationMs: Date.now() - startedAt,
  };

  log.info('Təmizləmə tamamlandı', stats);

  if (allConflicts.length > 0) {
    log.warn(`${allConflicts.length} artikulda brend toqquşması aşkarlandı`, {
      examples: allConflicts.slice(0, 3),
    });
  }

  if (rejected.length > 0) {
    // Ən çox rast gəlinən rədd səbəblərini göstər — data problemini tez görmək üçün
    const reasonCounts = {};
    for (const item of rejected) {
      for (const reason of item.reasons) {
        const key = reason.split(':')[0];
        reasonCounts[key] = (reasonCounts[key] || 0) + 1;
      }
    }
    log.warn(`${rejected.length} sətir rədd edildi (karantinə yazılır)`, reasonCounts);
  }

  return { accepted, rejected, stats, conflicts: allConflicts };
}

module.exports = {
  cleanPartRecords,
  normalizeRecord,
  validateRecord,
  mergeRecords,
  scoreQuality,
  isJunkText,
  isJunkCode,
  LIMITS,
};
