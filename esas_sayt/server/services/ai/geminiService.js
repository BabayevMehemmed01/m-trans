// ============================================================
// FAYL: server/services/ai/geminiService.js
// TƏSVİR: Gemini chat orkestrasiyası.
//
//  DİZAYN QƏRARI — niyə function-calling YOXDUR:
//  Köhnə tətbiqdə model `search_inventory` alətini ÖZÜ çağırmalı
//  idi. Bu etibarsız idi: model bəzən aləti çağırmır, bəzən səhv
//  sorğu ilə çağırır, nəticədə "yoxdur" cavabı verirdi, halbuki
//  anbarda məhsul var idi.
//
//  Bunun əvəzinə: HƏR sorğu üçün ragService.buildContext() ƏVVƏLCƏDƏN
//  (modeldən asılı olmadan) PostgreSQL-dən faktları çıxarır və
//  promptun içinə "KONTEKST" bloku kimi yerləşdirir. Model YALNIZ bu
//  konteksti şərh edir — nə axtaracağına özü qərar vermir.
//  Nəticə: sabit, təkrarlana bilən, "uydurmayan" cavablar.
//
//  MODEL EHTİYAT SİYAHISI (fallback):
//  Əsas model (config.ai.model) 404/xəta versə, config.ai.fallbackModels
//  siyahısındakı modellər ardıcıl sınanır — istifadəçi xəta görmür.
// ============================================================

'use strict';

const { GoogleGenAI } = require('@google/genai');
const config = require('../../config/env');
const ragService = require('./ragService');
const { cleanChatMessage } = require('../../utils/sanitize');
const { createLogger } = require('../../utils/logger');

const log = createLogger('Gemini');

let client = null;
function getClient() {
  if (!client) client = new GoogleGenAI({ apiKey: config.ai.apiKey });
  return client;
}

const SYSTEM_INSTRUCTION = `Sən M-Trans Logistics şirkətinin yük texnikası ehtiyat hissələri üzrə ixtisaslaşmış rəqəmsal assistentisən. Adın "AUTRO Assistant"-dır.

ƏSAS MİSSİYAN:
- Tır, ağır yük avtomobili (Volvo, Mercedes-Benz Actros, Scania, DAF, MAN, Iveco, Renault Trucks, Kamaz) ehtiyat hissələri haqqında məlumat ver.
- Saytdan istifadə (axtarış, sifariş, VIN sorğusu, promokod, əlaqə) haqqında sual gələrsə, təlimatlandır.
- Ümumi texniki suallara (yağ dəyişmə intervalı, filtr növləri, əyləc aşınması və s.) qısa, dəqiq məsləhət ver.
- Bütün cavablarını Azərbaycan dilində ver. Professional, qısa və dəqiq ol.

KONTEKSTDƏN İSTİFADƏ QAYDASI (ÇOX VACİB):
- Aşağıda hər istifadəçi sualından əvvəl "KONTEKST" bloku gələ bilər — bu, PostgreSQL anbarımızdan və bilik bazamızdan ÇIXARILMIŞ REAL məlumatdır.
- Məhsul, qiymət, stok haqqında YALNIZ kontekstdə verilən məlumata əsaslan. Kontekstdə olmayan məhsulu, qiyməti və ya stoku UYDURMA.
- Kontekstdə heç nə yoxdursa (boşdursa) və sual məhsul/stok haqqındadırsa: "Hazırda bu barədə dəqiq məlumat tapa bilmədim. Zəhmət olmasa 'Bizimlə Əlaqə' bölməsindən menecerimizlə əlaqə saxlayın." de.
- Kontekstdəki "Stok: 0" olan məhsullar üçün "Hazırda anbarımızda mövcud deyil, lakin sifariş edə bilərsiniz." de.
- Dəqiq çatdırılma tarixi vəd etmə — bu qərarı menecer verir.

NƏZAKƏTLİ İMTİNA QAYDASI:
- Avtomobil texnikasından və saytdan kənar mövzulara (siyasət, məişət, əyləncə, şəxsi suallar) nəzakətlə imtina et:
  "Bu mövzu ixtisas sahəmin xaricindədir. Yük texnikası ehtiyat hissələri ilə bağlı hər hansı sualınız varsa, kömək etməkdən məmnunam."

CAVAB FORMATI QAYDALARI:
- Cümlələri HƏMİŞƏ tam və məntiqi şəkildə bitir. Yarımçıq cümlə yolverilməzdir.
- Cavabı nöqtə, sual işarəsi və ya nida işarəsi ilə bitir.
- Hər cavabın sonunda "Əlavə suallarınız üçün menecerimizlə əlaqə saxlayın." cümləsini əlavə et.`;

const FALLBACK_MESSAGE =
  "Hazırda assistentimiz məşğuldur. Zəhmət olmasa 'Bizimlə Əlaqə' bölməsindən menecerimizlə əlaqə saxlayın.";

/** Cavab mətnini nəticədən çıxarır. */
function extractText(result) {
  try {
    return result?.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join('') || '';
  } catch {
    return '';
  }
}

/** Xətanı kateqoriyalaşdırır — həm loqlama, həm istifadəçiyə cavab üçün. */
function classifyError(err) {
  const status = err.status ?? err.statusCode ?? err?.cause?.status ?? null;
  const message = err.message ?? String(err);

  if (status === 429 || /quota|rate/i.test(message)) return 'RATE_LIMIT';
  if (status === 404 || /not found/i.test(message))  return 'MODEL_NOT_FOUND';
  if (status === 400 || /INVALID_ARGUMENT/i.test(message)) return 'INVALID_REQUEST';
  if (status === 403 || /API_KEY/i.test(message))    return 'AUTH_ERROR';
  if (/SAFETY/i.test(message))                       return 'SAFETY_BLOCK';
  if (/ETIMEDOUT|timeout/i.test(message))             return 'TIMEOUT';
  return 'UNKNOWN';
}

/** Növbəti modeli sınamağa dəyərmi? Auth/invalid-request xətaları hər modeldə təkrarlanacaq. */
function isRetryableWithFallback(errType) {
  return errType === 'MODEL_NOT_FOUND' || errType === 'RATE_LIMIT' || errType === 'UNKNOWN' || errType === 'TIMEOUT';
}

/**
 * Söhbət tarixçəsini Gemini `contents` formatına çevirir.
 * @param {Array<{role: string, content: string}>} history
 */
function buildHistoryContents(history) {
  const turns = Array.isArray(history) ? history.slice(-config.ai.maxHistoryTurns) : [];
  const contents = [];
  for (const msg of turns) {
    const text = cleanChatMessage(msg?.content, config.ai.maxMessageChars);
    if (!text) continue;
    contents.push({
      role:  msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text }],
    });
  }
  return contents;
}

/**
 * Bir modellə cavab almağı sınayır.
 * @param {string} model
 * @param {Array} contents
 */
async function callModel(model, contents) {
  const reqConfig = {
    systemInstruction: { text: SYSTEM_INSTRUCTION },
    maxOutputTokens:   config.ai.maxOutputTokens,
    temperature:       config.ai.temperature,
    httpOptions:       { timeout: config.ai.timeoutMs },
  };
  if (config.ai.thinkingBudget !== null) {
    reqConfig.thinkingConfig = { thinkingBudget: config.ai.thinkingBudget };
  }

  const result = await getClient().models.generateContent({
    model,
    contents,
    config: reqConfig,
  });

  const text = extractText(result);
  if (!text) throw new Error('Model boş cavab qaytardı.');
  return text;
}

/**
 * İstifadəçi mesajına RAG-əsaslı cavab qurur.
 *
 * @param {string} rawMessage
 * @param {Array<{role: string, content: string}>} history
 * @returns {Promise<{reply: string, model: string, hasContext: boolean, products: Object[], articles: Object[]}>}
 */
async function generateReply(rawMessage, history = []) {
  const message = cleanChatMessage(rawMessage, config.ai.maxMessageChars);
  if (!message) {
    const err = new Error('Mesaj boş ola bilməz.');
    err.statusCode = 400;
    err.expose = true;
    throw err;
  }

  if (!config.ai.enabled) {
    return {
      reply: 'AI asistenti konfiqurasiya olunmayıb. ' + FALLBACK_MESSAGE,
      model: 'none',
      hasContext: false,
      products: [],
      articles: [],
    };
  }

  const rag = await ragService.buildContext(message);

  const contents = buildHistoryContents(history);
  const userText = rag.hasContext
    ? `KONTEKST:\n${rag.context}\n\nSUAL: ${message}`
    : message;
  contents.push({ role: 'user', parts: [{ text: userText }] });

  const modelChain = [config.ai.model, ...config.ai.fallbackModels];
  let lastErr = null;

  for (let i = 0; i < modelChain.length; i++) {
    const model = modelChain[i];
    try {
      const reply = await callModel(model, contents);
      if (i > 0) log.warn(`Ehtiyat model istifadə olundu: ${model} (əsas: ${modelChain[0]})`);
      return { reply, model, hasContext: rag.hasContext, products: rag.products, articles: rag.articles };
    } catch (err) {
      const errType = classifyError(err);
      lastErr = err;
      lastErr.errType = errType;
      log.error(`Model xətası (${model})`, { errType, message: err.message });

      if (i < modelChain.length - 1 && isRetryableWithFallback(errType)) {
        continue; // növbəti modeli sına
      }
      throw lastErr;
    }
  }

  throw lastErr || new Error('Gemini sorğusu alınmadı.');
}

module.exports = {
  generateReply,
  classifyError,
  FALLBACK_MESSAGE,
};
