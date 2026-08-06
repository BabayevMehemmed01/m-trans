// ============================================================
// FAYL: server/utils/ftsQuery.js
// TƏSVİR: İstifadəçi mətnindən TƏHLÜKƏSİZ PostgreSQL tsquery qurur.
//
//  NİYƏ AYRICA MODUL:
//  `to_tsquery()` sintaksis xətası verə bilən operatorları
//  (& | ! <-> parantez) qəbul edir. İstifadəçi mətnini birbaşa
//  ötürsək, sorğu ya çökər, ya da gözlənilməz davranar.
//
//  BU MODUL: mətni yalnız hərf+rəqəm tokenlərinə parçalayır və
//  operatorları ÖZÜ qurur. Nəticə həmişə sintaktik düzgündür və
//  parametr ($1) kimi ötürüldüyü üçün injection mümkün deyil.
//
//  Prefiks (`:*`) əlavə olunur, çünki Azərbaycan dilində şəkilçi
//  var: "filtr" sorğusu "Filtri" sözünü tapmalıdır.
// ============================================================

'use strict';

const MAX_TOKENS = 8;      // ReDoS / ağır sorğu müdafiəsi
const MAX_TOKEN_LEN = 40;

/**
 * Mətni təhlükəsiz tokenlərə parçalayır.
 * @param {*} input
 * @returns {string[]}
 */
function tokenize(input) {
  if (input === null || input === undefined) return [];
  let text = String(input);
  try { text = text.normalize('NFKC'); } catch { /* buraxılır */ }

  return text
    .toLowerCase()
    // Hərf/rəqəm olmayan hər şey ayırıcıdır (Azərbaycan hərfləri saxlanılır)
    .split(/[^\p{L}\p{N}]+/u)
    .map(token => token.slice(0, MAX_TOKEN_LEN))
    .filter(token => token.length >= 1)
    .slice(0, MAX_TOKENS);
}

/**
 * AND (`&`) məntiqli prefiks tsquery qurur.
 *   "hava filtri" → "hava:* & filtri:*"
 *
 * @param {*} input
 * @returns {string|null} — token yoxdursa null
 */
function buildAndQuery(input) {
  const tokens = tokenize(input);
  if (tokens.length === 0) return null;
  return tokens.map(t => `${t}:*`).join(' & ');
}

/**
 * OR (`|`) məntiqli prefiks tsquery qurur.
 * Geniş axtarış üçün (AND nəticə verməyəndə ehtiyat variant).
 *
 * @param {*} input
 * @returns {string|null}
 */
function buildOrQuery(input) {
  const tokens = tokenize(input);
  if (tokens.length === 0) return null;
  return tokens.map(t => `${t}:*`).join(' | ');
}

module.exports = { tokenize, buildAndQuery, buildOrQuery, MAX_TOKENS };
