// ============================================================
// FAYL: src/components/ChatWidget.jsx
// TƏSVİR: Floating AI Chat Widget — Sağ aşağı küncü.
//         Gemini 2.5 Flash + Function Calling ilə bağlı backend-ə
//         POST /api/chat sorğusu atır.
//         Mövcud dark industrial dizayna tam uyğun glassmorphism UI.
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ── Konfiqurasiya ─────────────────────────────────────────────────
const API_BASE    = 'http://localhost:5000';
const BOT_NAME    = 'AUTRO Assistant';
const MAX_HISTORY = 20; // saxlanacaq tarixçə sayı

// ── Salam mesajı ─────────────────────────────────────────────────
const WELCOME_MSG = {
  id:      0,
  role:    'assistant',
  content: '👋 Salam! Mən AUTRO Assistant-am. Yük texnikası ehtiyat hissələri, OEM kodları, stok vəziyyəti haqqında sizə kömək edə bilərəm.\n\nNə soruşmaq istəyirsiniz?',
  ts:      Date.now(),
};

// ── İkon komponenti ───────────────────────────────────────────────
function BotIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M12 2a3 3 0 0 0-3 3v6h6V5a3 3 0 0 0-3-3z"/>
      <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>
      <path d="M8 11V8M16 11V8"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ── Typing Indicator ─────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'rgba(230,0,0,0.7)',
            animation: `chatDotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Mesaj Bubble ─────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const time   = new Date(msg.ts).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      display:       'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom:  '14px',
      alignItems:    'flex-end',
      gap:           '8px',
    }}>
      {/* Bot avatar */}
      {!isUser && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #1a0a0a 0%, #3d0000 100%)',
          border:     '1px solid rgba(230,0,0,0.35)',
          display:    'flex', alignItems: 'center', justifyContent: 'center',
          color:      '#E60000',
        }}>
          <BotIcon size={14} />
        </div>
      )}

      <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '4px' }}>
        <div style={{
          background:   isUser
            ? 'linear-gradient(135deg, #E60000 0%, #c40000 100%)'
            : 'rgba(255,255,255,0.06)',
          color:        '#fff',
          padding:      '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          fontSize:     '0.875rem',
          lineHeight:   '1.55',
          border:       isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
          whiteSpace:   'pre-wrap',
          wordBreak:    'break-word',
        }}>
          {msg.content}
        </div>
        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', padding: '0 4px' }}>
          {time}
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Ana Widget Komponenti
// ════════════════════════════════════════════════════════════════
export default function ChatWidget() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState([WELCOME_MSG]);
  const [input,     setInput]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // ── Widget-i 2 saniyə gecikmə ilə göstər (UX) ────────────────
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // ── Avtomatik scroll ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // ── Chat açıldıqda inputu fokusla ────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [isOpen]);

  // ── Mesaj göndər ─────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Tarixçəni hazırla (son N mesaj)
    const history = messages
      .filter(m => m.id !== 0) // Welcome mesajı çıxart
      .slice(-MAX_HISTORY)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, history }),
        signal:  AbortSignal.timeout(30000),
      });

      const data = await res.json();

      const botMsg = {
        id:      Date.now() + 1,
        role:    'assistant',
        content: data.reply || 'Cavab alınmadı. Zəhmət olmasa yenidən cəhd edin.',
        ts:      Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);

      // Panel bağlıdırsa unread badge göstər
      if (!isOpen) setHasUnread(true);

    } catch (err) {
      const errMsg = {
        id:      Date.now() + 1,
        role:    'assistant',
        content: err.name === 'TimeoutError'
          ? "Cavab çox gec gəldi. Zəhmət olmasa 'Bizimlə Əlaqə' bölməsindən menecerlə əlaqə saxlayın."
          : "Hazırda assistentimiz məşğuldur. Zəhmət olmasa 'Bizimlə Əlaqə' bölməsindən menecerimizlə əlaqə saxlayın.",
        ts:      Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, isOpen]);

  // ── Enter ilə göndər ─────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Tez cavab sualları ────────────────────────────────────────
  const quickReplies = [
    'Knorr-Bremse varmı?',
    'OEM K020345 nədir?',
    'Volvo FH ehtiyat hissələri?',
    'Stok vəziyyəti',
  ];

  if (!isVisible) return null;

  return (
    <>
      {/* ── CSS Animasiyaları ─────────────────────────────────── */}
      <style>{`
        @keyframes chatWidgetSlideIn {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes chatPanelOpen {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes chatDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatUnreadPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.3); }
        }
        .chat-input-field:focus {
          outline: none !important;
          border-color: rgba(230,0,0,0.5) !important;
          box-shadow: 0 0 0 2px rgba(230,0,0,0.1) !important;
        }
        .chat-send-btn:hover {
          background: #c40000 !important;
          transform: scale(1.05);
        }
        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }
        .chat-toggle-btn:hover .chat-btn-bg {
          transform: scale(1.08);
        }
        .quick-reply-btn:hover {
          background: rgba(230,0,0,0.15) !important;
          border-color: rgba(230,0,0,0.4) !important;
          color: #fff !important;
        }
        .chat-messages-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .chat-messages-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-messages-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
        .chat-messages-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════
          FLOATING TOGGLE BUTTON
          ════════════════════════════════════════════════════════ */}
      <div
        className="chat-toggle-btn"
        onClick={() => setIsOpen(v => !v)}
        role="button"
        aria-label={isOpen ? 'Chatı bağla' : 'AUTRO Assistenti aç'}
        aria-expanded={isOpen}
        style={{
          position:  'fixed',
          bottom:    '28px',
          right:     '28px',
          zIndex:    10000,
          cursor:    'pointer',
          animation: 'chatWidgetSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Unread Badge */}
        {hasUnread && !isOpen && (
          <div style={{
            position:        'absolute',
            top:             '-4px',
            right:           '-4px',
            width:           '14px',
            height:          '14px',
            borderRadius:    '50%',
            background:      '#E60000',
            border:          '2px solid #060B19',
            animation:       'chatUnreadPulse 1.5s ease-in-out infinite',
            zIndex:          1,
          }} />
        )}

        <div
          className="chat-btn-bg"
          style={{
            width:        '58px',
            height:       '58px',
            borderRadius: '50%',
            background:   isOpen
              ? 'linear-gradient(135deg, #333 0%, #222 100%)'
              : 'linear-gradient(135deg, #E60000 0%, #9b0000 100%)',
            boxShadow:    isOpen
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(230,0,0,0.45), 0 0 0 0 rgba(230,0,0,0.4)',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            color:        '#fff',
            transition:   'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            transform:    isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
          }}
        >
          {isOpen ? <CloseIcon /> : <BotIcon size={24} />}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          CHAT PANEL
          ════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="AUTRO AI Asistent"
          style={{
            position:     'fixed',
            bottom:       '100px',
            right:        '28px',
            width:        'min(380px, calc(100vw - 40px))',
            height:       'min(540px, calc(100vh - 140px))',
            zIndex:       9999,
            display:      'flex',
            flexDirection:'column',
            borderRadius: '24px',
            overflow:     'hidden',
            animation:    'chatPanelOpen 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
            background:   'rgba(8, 12, 22, 0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border:       '1px solid rgba(255,255,255,0.1)',
            boxShadow:    '0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(230,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div style={{
            padding:    '18px 20px',
            background: 'linear-gradient(135deg, rgba(230,0,0,0.12) 0%, rgba(0,0,0,0) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display:    'flex',
            alignItems: 'center',
            gap:        '12px',
            flexShrink: 0,
          }}>
            {/* Avatar */}
            <div style={{
              width:        '40px', height: '40px', borderRadius: '50%',
              background:   'linear-gradient(135deg, #1a0505 0%, #3d0000 100%)',
              border:       '1.5px solid rgba(230,0,0,0.4)',
              display:      'flex', alignItems: 'center', justifyContent: 'center',
              color:        '#E60000',
              flexShrink:   0,
            }}>
              <BotIcon size={18} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily:  'var(--f-display, "Montserrat", sans-serif)',
                fontSize:    '0.95rem',
                fontWeight:  '800',
                color:       '#fff',
                letterSpacing: '0.01em',
              }}>
                {BOT_NAME}
              </div>
              <div style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '5px',
                marginTop:  '2px',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow:  '0 0 6px rgba(34,197,94,0.5)',
                  animation:  'chatUnreadPulse 2.5s ease-in-out infinite',
                }} />
                <span style={{ fontSize: '0.72rem', color: '#5a7a5a', fontFamily: 'var(--f-mono, monospace)' }}>
                  Online · M-Trans Parts
                </span>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Chatı bağla"
              style={{
                background:   'rgba(255,255,255,0.06)',
                border:       '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color:        'rgba(255,255,255,0.6)',
                width:        '32px', height: '32px',
                display:      'flex', alignItems: 'center', justifyContent: 'center',
                cursor:       'pointer',
                transition:   'all 0.2s',
                flexShrink:   0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,0,0,0.15)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* ── Messages Area ──────────────────────────────── */}
          <div
            className="chat-messages-scroll"
            style={{
              flex:       1,
              overflowY:  'auto',
              padding:    '18px 16px 8px',
              display:    'flex',
              flexDirection: 'column',
            }}
          >
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{
                display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '14px',
              }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #1a0a0a 0%, #3d0000 100%)',
                  border:     '1px solid rgba(230,0,0,0.35)',
                  display:    'flex', alignItems: 'center', justifyContent: 'center',
                  color:      '#E60000',
                }}>
                  <BotIcon size={14} />
                </div>
                <div style={{
                  background:   'rgba(255,255,255,0.06)',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '18px 18px 18px 4px',
                  padding:      '10px 16px',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Replies ───────────────────────────────── */}
          {messages.length <= 2 && !isLoading && (
            <div style={{
              padding:      '8px 16px',
              borderTop:    '1px solid rgba(255,255,255,0.05)',
              display:      'flex',
              gap:          '6px',
              flexWrap:     'wrap',
              flexShrink:   0,
            }}>
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  className="quick-reply-btn"
                  onClick={() => { setInput(qr); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{
                    background:   'rgba(255,255,255,0.04)',
                    border:       '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    color:        'rgba(255,255,255,0.65)',
                    fontSize:     '0.75rem',
                    padding:      '5px 12px',
                    cursor:       'pointer',
                    transition:   'all 0.2s',
                    fontFamily:   'var(--f-body, "Inter", sans-serif)',
                    whiteSpace:   'nowrap',
                  }}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* ── Input Area ─────────────────────────────────── */}
          <div style={{
            padding:    '12px 16px 16px',
            borderTop:  '1px solid rgba(255,255,255,0.07)',
            display:    'flex',
            gap:        '8px',
            alignItems: 'flex-end',
            flexShrink: 0,
            background: 'rgba(0,0,0,0.2)',
          }}>
            <textarea
              ref={inputRef}
              className="chat-input-field"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ehtiyat hissəsi, OEM kodu soruşun..."
              disabled={isLoading}
              rows={1}
              style={{
                flex:        1,
                background:  'rgba(255,255,255,0.05)',
                border:      '1px solid rgba(255,255,255,0.1)',
                borderRadius:'12px',
                color:       '#fff',
                fontSize:    '0.875rem',
                padding:     '10px 14px',
                fontFamily:  'var(--f-body, "Inter", sans-serif)',
                resize:      'none',
                minHeight:   '42px',
                maxHeight:   '100px',
                lineHeight:  '1.5',
                transition:  'border-color 0.2s, box-shadow 0.2s',
                overflow:    'auto',
              }}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              aria-label="Mesaj göndər"
              style={{
                width:        '42px',
                height:       '42px',
                borderRadius: '12px',
                background:   'linear-gradient(135deg, #E60000 0%, #9b0000 100%)',
                border:       'none',
                color:        '#fff',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                cursor:       'pointer',
                flexShrink:   0,
                transition:   'all 0.2s',
                boxShadow:    '0 4px 12px rgba(230,0,0,0.3)',
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
