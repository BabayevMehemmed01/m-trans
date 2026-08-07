// ============================================================
// FAYL: server/utils/normalize.js
// TƏSVİR: Ehtiyat hissəsi məlumatlarının normallaşdırılması.
//
//         NİYƏ VACİBDİR: 1C "K 020345", TecDoc "K-020345",
//         istifadəçi isə "k020345" yaza bilər. Hamısı EYNİ
//         detaldır. Normallaşdırma olmadan bazada dublikat
//         yaranır və axtarış nəticə vermir.
// ============================================================

'use strict';

const { normalizeWhitespace, cleanText } = require('./sanitize');

// ── Brend adlarının vahid formaya salınması ──────────────────────
// 1C və TecDoc eyni brendi fərqli yaza bilər.
const BRAND_ALIASES = new Map([
  ['knorrbremse',      'Knorr-Bremse'],
  ['knorr',            'Knorr-Bremse'],
  ['knorrbremsesystems', 'Knorr-Bremse'],
  ['wabco',            'WABCO'],
  ['wabcoholdings',    'WABCO'],
  ['zfwabco',          'WABCO'],
  ['mannhummel',       'Mann-Hummel'],
  ['mann',             'Mann-Hummel'],
  ['mannfilter',       'Mann-Hummel'],
  ['hengst',           'Hengst'],
  ['hengstfilter',     'Hengst'],
  ['bosch',            'Bosch'],
  ['roberobosch',      'Bosch'],
  ['robertbosch',      'Bosch'],
  ['sachs',            'Sachs'],
  ['zfsachs',          'Sachs'],
  ['zf',               'ZF'],
  ['zffriedrichshafen','ZF'],
  ['brembo',           'Brembo'],
  ['ferodo',           'Ferodo'],
  ['continental',      'Continental'],
  ['contitech',        'Continental'],
  ['volvo',            'Volvo'],
  ['volvooem',         'Volvo'],
  ['volvotrucks',      'Volvo'],
  ['scania',           'Scania'],
  ['man',              'MAN'],
  ['mantruckbus',      'MAN'],
  ['daf',              'DAF'],
  ['dafttrucks',       'DAF'],
  ['daftrucks',        'DAF'],
  ['mercedes',         'Mercedes-Benz'],
  ['mercedesbenz',     'Mercedes-Benz'],
  ['mercedesoem',      'Mercedes-Benz'],
  ['mb',               'Mercedes-Benz'],
  ['iveco',            'Iveco'],
  ['renault',          'Renault Trucks'],
  ['renaulttrucks',    'Renault Trucks'],
  ['kamaz',            'Kamaz'],
  ['cat',              'Caterpillar'],
  ['catoem',           'Caterpillar'],
  ['caterpillar',      'Caterpillar'],
]);

/**
 * Artikul / OEM kodunu müqayisə üçün kanonik formaya salır.
 * Yalnız hərf və rəqəmlər saxlanılır, hamısı böyük hərfə çevrilir.
 *
 *   "K-020 345"  → "K020345"
 *   "k020345"    → "K020345"
 *   "0 986 424 785" → "0986424785"
 *
 * @param {*} value
 * @returns {string} — normallaşdırılmış kod (boş ola bilər)
 */
function normalizeCode(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  try { text = text.normalize('NFKC'); } catch { /* buraxılır */ }
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Kodu göstərmək üçün səliqəyə salır (orijinal formatı qoruyur,
 * yalnız artıq boşluqları təmizləyir).
 * @param {*} value
 * @returns {string}
 */
function displayCode(value) {
  return cleanText(value, 100).toUpperCase();
}

/**
 * Brend adını vahid formaya salır.
 *   "knorr bremse" / "KNORR-BREMSE" → "Knorr-Bremse"
 *
 * @param {*} value
 * @returns {string}
 */
function normalizeBrand(value) {
  const raw = cleanText(value, 120);
  if (!raw) return '';

  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (BRAND_ALIASES.has(key)) return BRAND_ALIASES.get(key);

  // "Volvo OEM" → "Volvo" kimi şəkilçiləri təmizlə, sonra yenidən yoxla
  const stripped = key.replace(/(oem|original|genuine|parts?|group|gmbh|ag|sa|ltd|inc)$/g, '');
  if (stripped && BRAND_ALIASES.has(stripped)) return BRAND_ALIASES.get(stripped);

  // Tanınmayan brend — Title Case formasına sal
  return raw
    .split(/\s+/)
    .map(w => (w.length <= 3 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

/**
 * Kanonik dedupe açarı.
 *
 * QƏRAR: Açar YALNIZ normallaşdırılmış artikul nömrəsindən ibarətdir.
 * Səbəb: istehsalçı artikulu ticarətdə de-fakto unikal identifikatordur
 * və həm 1C (АртикулПроизводителя), həm TecDoc (articleNumber) məhz onu
 * qaytarır. Brendi açara daxil etsək, "WABCO" / "Wabco Holdings" kimi
 * fərqli yazılışlar EYNİ detal üçün iki ayrı sətir yaradar.
 *
 * Nadir hallarda iki brend eyni artikuldan istifadə edə bilər —
 * belə toqquşmalar `data_quality_issues` cədvəlinə yazılır (bax:
 * dataCleaningService), yəni sükutla itmir.
 *
 * @param {string} articleNo
 * @returns {string}
 */
function buildPartKey(articleNo) {
  return normalizeCode(articleNo);
}

/**
 * Qiyməti təhlükəsiz şəkildə ədədə çevirir.
 * "1 250,50 AZN" → 1250.50
 *
 * @param {*} value
 * @returns {number|null} — çevrilə bilmirsə null
 */
function parsePrice(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  let text = normalizeWhitespace(value).replace(/[^\d.,\-]/g, '');
  if (!text) return null;

  const hasComma = text.includes(',');
  const hasDot   = text.includes('.');

  if (hasComma && hasDot) {
    // Sonuncu görünən ayırıcı onluq ayırıcıdır
    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
      text = text.replace(/\./g, '').replace(',', '.');   // 1.250,50
    } else {
      text = text.replace(/,/g, '');                      // 1,250.50
    }
  } else if (hasComma) {
    // "1,50" → onluq | "1,250" → minlik
    const parts = text.split(',');
    text = parts[parts.length - 1].length === 3 && parts.length > 1
      ? text.replace(/,/g, '')
      : text.replace(',', '.');
  }

  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

/**
 * Stok miqdarını tam ədədə çevirir.
 * @param {*} value
 * @returns {number|null}
 */
function parseQuantity(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : null;
  }
  const text = normalizeWhitespace(value).replace(/[^\d\-.,]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(text);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.trunc(parsed));
}

/**
 * Valyuta kodunu ISO-4217 formasına salır.
 * @param {*} value
 * @param {string} fallback
 * @returns {string}
 */
function normalizeCurrency(value, fallback = 'AZN') {
  const code = normalizeCode(value).slice(0, 3);
  const KNOWN = ['AZN', 'USD', 'EUR', 'TRY', 'RUB', 'GBP'];
  if (KNOWN.includes(code)) return code;
  // Simvollarla gələ bilər
  const text = String(value ?? '').trim();
  if (text.includes('₼')) return 'AZN';
  if (text.includes('$'))  return 'USD';
  if (text.includes('€'))  return 'EUR';
  if (text.includes('₺'))  return 'TRY';
  if (text.includes('₽'))  return 'RUB';
  return fallback;
}

module.exports = {
  normalizeCode,
  displayCode,
  normalizeBrand,
  buildPartKey,
  parsePrice,
  parseQuantity,
  normalizeCurrency,
  BRAND_ALIASES,
};
