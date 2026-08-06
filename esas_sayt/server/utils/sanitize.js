// ============================================================
// FAYL: server/utils/sanitize.js
// TƏSVİR: XSS və data-injection müdafiəsi üçün təmizləmə
//         funksiyaları.
//
//         MÜDAFİƏ STRATEGİYASI:
//         1. Girişdə (input) — təhlükəli struktur elementləri
//            (HTML tag, control char, null byte) silinir.
//         2. Çıxışda (output) — API yalnız JSON qaytarır və
//            Content-Type sərt təyin olunur, ona görə brauzer
//            HTML kimi şərh etmir.
//         3. Bazaya yazılan mətnlər saxlanılan XSS (stored XSS)
//            olmaması üçün əvvəlcədən təmizlənir.
// ============================================================

'use strict';

// Control simvollar (null byte daxil) — DB və log injection riski
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// Görünməz / istiqamət dəyişdirən Unicode simvollar (homoqraf hücumlar)
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

const HTML_ENTITIES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;',
};

/**
 * HTML xüsusi simvollarını escape edir.
 * Mətn HTML kontekstinə düşərsə icra olunmasın deyə.
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'/]/g, ch => HTML_ENTITIES[ch]);
}

/**
 * HTML tag-larını və script məzmununu tamamilə silir.
 * @param {*} value
 * @returns {string}
 */
function stripHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    // <script>, <style>, <iframe> — məzmunu ilə birlikdə sil
    .replace(/<\s*(script|style|iframe|object|embed|template)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    // Qalan bütün tag-lar
    .replace(/<[^>]*>/g, ' ')
    // Təhlükəli protokollar
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/vbscript\s*:/gi, '')
    // Inline event handler-lər
    .replace(/\bon[a-z]+\s*=/gi, '');
}

/**
 * Mətni normallaşdırır: Unicode NFKC, control/invisible simvolları
 * silir, ardıcıl boşluqları birləşdirir.
 * @param {*} value
 * @returns {string}
 */
function normalizeWhitespace(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  try { text = text.normalize('NFKC'); } catch { /* köhnə runtime — buraxılır */ }
  return text
    .replace(CONTROL_CHARS, ' ')
    .replace(INVISIBLE_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bazaya yazılacaq / API-dən qaytarılacaq sərbəst mətn üçün
 * tam təmizləmə: HTML silinir + normallaşdırılır + uzunluq kəsilir.
 *
 * @param {*} value
 * @param {number} maxLength
 * @returns {string}
 */
function cleanText(value, maxLength = 1000) {
  const cleaned = normalizeWhitespace(stripHtml(value));
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength).trim() : cleaned;
}

/**
 * İstifadəçinin chat mesajı üçün təmizləmə.
 * Sətir sonlarını qoruyur (mesaj formatı üçün vacibdir),
 * lakin HTML və control simvolları silir.
 *
 * @param {*} value
 * @param {number} maxLength
 * @returns {string}
 */
function cleanChatMessage(value, maxLength = 1500) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  try { text = text.normalize('NFKC'); } catch { /* buraxılır */ }

  text = stripHtml(text)
    .replace(CONTROL_CHARS, '')
    .replace(INVISIBLE_CHARS, '')
    // 3-dən çox ardıcıl sətir sonunu 2-yə endir
    .replace(/\n{3,}/g, '\n\n')
    // Sətir daxilindəki artıq boşluqlar
    .replace(/[^\S\n]{2,}/g, ' ')
    .trim();

  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

/**
 * Axtarış sorğusu üçün təmizləmə.
 * SQL injection-a qarşı əsas müdafiə parametrləşdirilmiş
 * sorğulardır (bax: db/index.js) — bu funksiya əlavə qatdır:
 * mənasız/təhlükəli simvolları atır və uzunluğu məhdudlaşdırır.
 *
 * @param {*} value
 * @param {number} maxLength
 * @returns {string}
 */
function cleanSearchQuery(value, maxLength = 120) {
  const cleaned = normalizeWhitespace(stripHtml(value))
    // SQL/LIKE meta-simvolları və dırnaqları at (parametrləşdirmə
    // onsuz da qoruyur, bu isə "səs-küyü" azaldır)
    .replace(/[%_\\`'"$;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength).trim() : cleaned;
}

/**
 * LIKE/ILIKE şablonu üçün wildcard escape.
 * Parametrləşdirilmiş sorğuda belə `%` və `_` istifadəçi
 * tərəfindən idarə olunmamalıdır (ReDoS / tam cədvəl skanı riski).
 *
 * @param {string} value
 * @returns {string}
 */
function escapeLikePattern(value) {
  return String(value).replace(/[\\%_]/g, ch => `\\${ch}`);
}

module.exports = {
  escapeHtml,
  stripHtml,
  normalizeWhitespace,
  cleanText,
  cleanChatMessage,
  cleanSearchQuery,
  escapeLikePattern,
};
