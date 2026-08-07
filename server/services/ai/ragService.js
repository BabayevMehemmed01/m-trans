// ============================================================
// FAYL: server/services/ai/ragService.js
// TƏSVİR: RAG (Retrieval-Augmented Generation) axtarış qatı.
//
//  MƏQSƏD: modelə "uydurmağa" imkan verməmək. Model yalnız
//  bazadan ÇIXARILMIŞ faktlar əsasında cavab verir.
//
//  NİYƏ VEKTOR (embedding) DEYİL?
//  Bu PostgreSQL quraşdırmasında `pgvector` genişlənməsi mövcud
//  deyil (yoxlanılıb). Ona görə leksik hibrid axtarış qurulub:
//     • tsvector tam mətn axtarışı (prefiks dəstəyi ilə)
//     • pg_trgm trigram oxşarlığı (səhv yazılışa dözüm)
//     • dəqiq kod uyğunluğu (OEM / artikul)
//  Ehtiyat hissəsi domenində bu yanaşma vektor axtarışından
//  DAHA DƏQİQDİR: "K020345" kimi kodlar semantik yox, hərfi
//  uyğunluq tələb edir. Üstəlik xarici embedding API-sinə
//  ehtiyac yoxdur — gecikmə və xərc sıfırdır.
// ============================================================

'use strict';

const partsRepo     = require('../../db/repositories/partsRepository');
const knowledgeRepo = require('../../db/repositories/knowledgeRepository');
const { createLogger } = require('../../utils/logger');

const log = createLogger('RAG');

const MAX_PRODUCTS_IN_CONTEXT  = 8;
const MAX_ARTICLES_IN_CONTEXT  = 3;
const MAX_ARTICLE_BODY_CHARS   = 900;

/**
 * Məhsulu model üçün kompakt, birmənalı sətrə çevirir.
 * @param {Object} product
 * @returns {string}
 */
function formatProduct(product) {
  const parts = [
    `Artikul: ${product.article_no || product.part_key}`,
    product.brand    ? `Brend: ${product.brand}` : null,
    `Ad: ${product.title}`,
    product.category ? `Kateqoriya: ${product.category}` : null,
    product.price !== null && product.price !== undefined
      ? `Qiymət: ${product.price} ${product.currency || 'AZN'}`
      : 'Qiymət: dəqiqləşdirilir',
    product.stock_quantity === null || product.stock_quantity === undefined
      ? 'Stok: məlum deyil'
      : (product.stock_quantity > 0
          ? `Stok: ${product.stock_quantity} ədəd (MÖVCUDDUR)`
          : 'Stok: 0 (SİFARİŞLƏ)'),
  ].filter(Boolean);

  if (product.oem_codes && product.oem_codes.length > 1) {
    parts.push(`Uyğun OEM kodları: ${product.oem_codes.slice(0, 8).join(', ')}`);
  }

  return parts.join(' | ');
}

/**
 * Bilik məqaləsini kontekst bloku üçün formatlayır.
 * @param {Object} article
 */
function formatArticle(article) {
  const body = article.body.length > MAX_ARTICLE_BODY_CHARS
    ? `${article.body.slice(0, MAX_ARTICLE_BODY_CHARS)}...`
    : article.body;
  return `### ${article.title}\n${body}`;
}

/**
 * Anbardan məhsul konteksti çıxarır.
 *
 * @param {string} query
 * @param {{limit?: number}} options
 * @returns {Promise<{products: Object[], text: string}>}
 */
async function retrieveProducts(query, options = {}) {
  const limit = Math.min(options.limit || MAX_PRODUCTS_IN_CONTEXT, MAX_PRODUCTS_IN_CONTEXT);

  try {
    const products = await partsRepo.search(query, { limit });
    if (products.length === 0) {
      return { products: [], text: '' };
    }
    const text = products.map((p, i) => `${i + 1}. ${formatProduct(p)}`).join('\n');
    return { products, text };
  } catch (err) {
    log.warn('Məhsul axtarışı alınmadı', { message: err.message });
    return { products: [], text: '' };
  }
}

/**
 * Bilik bazasından məqalə konteksti çıxarır.
 *
 * @param {string} query
 * @param {{limit?: number, topics?: string[]}} options
 * @returns {Promise<{articles: Object[], text: string}>}
 */
async function retrieveKnowledge(query, options = {}) {
  const limit = Math.min(options.limit || MAX_ARTICLES_IN_CONTEXT, MAX_ARTICLES_IN_CONTEXT);

  try {
    const articles = await knowledgeRepo.search(query, { limit, topics: options.topics });
    if (articles.length === 0) return { articles: [], text: '' };
    return { articles, text: articles.map(formatArticle).join('\n\n') };
  } catch (err) {
    log.warn('Bilik bazası axtarışı alınmadı', { message: err.message });
    return { articles: [], text: '' };
  }
}

/**
 * Sualın xarakterini müəyyən edir — hansı mənbələrdən
 * məlumat çıxarılacağını seçmək üçün.
 *
 * @param {string} query
 * @returns {{wantsProducts: boolean, wantsKnowledge: boolean, topics: string[]|null}}
 */
function classifyIntent(query) {
  const text = String(query || '').toLowerCase();

  const siteWords = [
    'sayt', 'sifariş', 'səbət', 'sebet', 'necə', 'nece', 'qeydiyyat', 'hesab',
    'promokod', 'endirim', 'çatdırılma', 'catdirilma', 'əlaqə', 'elaqe',
    'telefon', 'ünvan', 'unvan', 'menecer', 'vin', 'dil', 'giriş', 'filtrlə',
  ];
  const technicalWords = [
    'nə vaxt', 'ne vaxt', 'interval', 'dəyişmə', 'deyisme', 'problem', 'səs', 'ses',
    'qızır', 'qizir', 'işə düşmür', 'ise dusmur', 'niyə', 'niye', 'nədir', 'nedir',
    'necə işləyir', 'aşınma', 'asinma', 'əlamət', 'elamet', 'nasazlıq', 'təmir',
  ];
  const productWords = [
    'stok', 'qiymət', 'qiymet', 'var', 'varmı', 'varmi', 'neçə', 'nece ededd',
    'oem', 'kod', 'artikul', 'brend', 'satır', 'satir', 'alıram', 'lazımdır', 'lazimdir',
  ];

  const hasSite      = siteWords.some(w => text.includes(w));
  const hasTechnical = technicalWords.some(w => text.includes(w));
  const hasProduct   = productWords.some(w => text.includes(w));
  // Kod formalı sorğu (K020345, 0986424785) — mütləq məhsul axtarışıdır
  const hasCode      = /[a-z]*\d{3,}/i.test(text.replace(/\s+/g, ''));

  const topics = [];
  if (hasSite)      topics.push('site_usage', 'company');
  if (hasTechnical) topics.push('technical');

  return {
    wantsProducts:  hasProduct || hasCode || (!hasSite && !hasTechnical),
    wantsKnowledge: hasSite || hasTechnical || (!hasProduct && !hasCode),
    topics: topics.length > 0 ? [...new Set(topics)] : null,
  };
}

/**
 * Sual üçün TAM RAG konteksti qurur.
 *
 * @param {string} query
 * @param {{productLimit?: number, articleLimit?: number}} options
 * @returns {Promise<{
 *   context: string,
 *   products: Object[],
 *   articles: Object[],
 *   hasContext: boolean
 * }>}
 */
async function buildContext(query, options = {}) {
  const startedAt = Date.now();
  const intent = classifyIntent(query);

  // İki axtarışı PARALEL apar — gecikməni ikiqat azaldır
  const [productResult, knowledgeResult] = await Promise.all([
    intent.wantsProducts
      ? retrieveProducts(query, { limit: options.productLimit })
      : Promise.resolve({ products: [], text: '' }),
    intent.wantsKnowledge
      ? retrieveKnowledge(query, { limit: options.articleLimit, topics: intent.topics })
      : Promise.resolve({ articles: [], text: '' }),
  ]);

  const blocks = [];

  if (productResult.text) {
    blocks.push(
      '## ANBARIMIZDAKI UYĞUN MƏHSULLAR (PostgreSQL — real məlumat)\n' +
      productResult.text
    );
  }

  if (knowledgeResult.text) {
    blocks.push('## BİLİK BAZASI\n' + knowledgeResult.text);
  }

  const context = blocks.join('\n\n');

  log.debug('RAG konteksti quruldu', {
    products: productResult.products.length,
    articles: knowledgeResult.articles.length,
    chars:    context.length,
    ms:       Date.now() - startedAt,
  });

  return {
    context,
    products:   productResult.products,
    articles:   knowledgeResult.articles,
    hasContext: context.length > 0,
  };
}

module.exports = {
  buildContext,
  retrieveProducts,
  retrieveKnowledge,
  classifyIntent,
  formatProduct,
};
