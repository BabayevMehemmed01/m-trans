// ============================================================
// FAYL: server/controllers/chatController.js
// TƏSVİR: POST /api/chat — Gemini RAG chatbot kontrolleri.
// ============================================================

'use strict';

const geminiService = require('../services/ai/geminiService');
const { createLogger } = require('../utils/logger');

const log = createLogger('ChatCtrl');

/**
 * POST /api/chat
 * Body: { message: string, history?: Array<{role, content}> }
 */
async function chat(req, res) {
  const { message, history } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Mesaj boş ola bilməz.' });
  }

  try {
    const result = await geminiService.generateReply(message, history);
    return res.json({
      reply: result.reply,
      meta: {
        model:       result.model,
        has_context: result.hasContext,
        products:    result.products.length,
        articles:    result.articles.length,
      },
    });
  } catch (err) {
    const errType = err.errType || 'UNKNOWN';
    log.error('Chat sorğusu uğursuz oldu', { errType, message: err.message });

    if (errType === 'RATE_LIMIT') {
      return res.status(429).json({ reply: geminiService.FALLBACK_MESSAGE, error: 'rate_limit' });
    }
    if (errType === 'SAFETY_BLOCK') {
      return res.status(200).json({
        reply: 'Bu sualı cavablandıra bilmirəm. Əlavə suallarınız üçün menecerimizlə əlaqə saxlayın.',
        error: 'safety_block',
      });
    }
    return res.status(500).json({ reply: geminiService.FALLBACK_MESSAGE, error: errType });
  }
}

module.exports = { chat };
