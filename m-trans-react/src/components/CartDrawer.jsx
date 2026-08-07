// =================================================================
// FAYL: src/components/CartDrawer.jsx
// TƏSVİR: Alış-veriş Səbəti — Promokod + Çıxış + i18n
// =================================================================

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart }  from '../context/CartContext';
import { useAdmin } from '../context/AdminContext';

const R = '#E60000';

function fmtPrice(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toFixed(2);
}

export default function CartDrawer() {
  const { t } = useTranslation();
  const { validatePromo } = useAdmin();
  const {
    items, removeFromCart, updateQty, clearCart,
    isCartOpen, setIsCartOpen,
    promoCode, setPromoCode,
    appliedPromo, promoError,
    applyPromo, removePromo,
    totals,
  } = useCart();

  const [orderSent, setOrderSent] = useState(false);

  // ESC key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setIsCartOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setIsCartOpen]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  const handleApplyPromo = () => {
    applyPromo(validatePromo, promoCode);
  };

  const handleCheckout = () => {
    setOrderSent(true);
    setTimeout(() => {
      clearCart();
      setIsCartOpen(false);
      setOrderSent(false);
    }, 2800);
  };

  if (!isCartOpen) return null;

  return (
    <>
      <style>{`
        @keyframes cartSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes cartFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cartSuccess {
          0%   { transform: scale(0.8); opacity: 0; }
          50%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .cart-aside { animation: cartSlideIn 0.32s cubic-bezier(0.22,1,0.36,1); }
        .cart-scrim  { animation: cartFadeIn 0.25s ease; }
        .cart-qbtn { transition: all 0.15s; }
        .cart-qbtn:hover { opacity: 0.75; transform: scale(1.1); }
        .cart-item { transition: background 0.2s; border-radius: 12px; }
        .cart-item:hover { background: rgba(255,255,255,0.04); }
      `}</style>

      {/* Overlay */}
      <div
        className="cart-scrim"
        onClick={() => setIsCartOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 1099,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
        }}
      />

      {/* Drawer panel */}
      <aside
        className="cart-aside"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(420px, 100vw)',
          zIndex: 1100,
          background: '#0d1117',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: `${R}15`, border: `1px solid ${R}30`, borderRadius: '10px', padding: '8px', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={R} strokeWidth="2.2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontFamily:'var(--f-display)', fontWeight:'900', fontSize:'1.05rem', color:'#fff', margin:0 }}>
                🛒 {t('cart_title')}
              </h2>
              <div style={{ fontFamily:'var(--f-mono)', fontSize:'0.68rem', color:'#4e6074', marginTop:'2px' }}>
                {totals.itemCount} {t('dash_stat_total')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'#6b7a8d', width:'36px', height:'36px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', transition:'all 0.2s' }}
          >✕</button>
        </div>

        {/* ── Success State ──────────────────────────────── */}
        {orderSent && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'16px', animation:'cartSuccess 0.5s ease' }}>✅</div>
            <h3 style={{ fontFamily:'var(--f-display)', fontSize:'1.3rem', fontWeight:'900', color:'#4ade80', marginBottom:'12px' }}>
              {t('cart_title')} ✓
            </h3>
            <p style={{ color:'#5e748a', fontSize:'0.9rem', lineHeight:1.6 }}>
              {t('cart_order_sent')}
            </p>
          </div>
        )}

        {/* ── Empty State ────────────────────────────────── */}
        {!orderSent && items.length === 0 && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:'14px', opacity:0.3 }}>🛒</div>
            <h3 style={{ fontFamily:'var(--f-display)', fontSize:'1rem', fontWeight:'800', color:'#4e6074', marginBottom:'8px' }}>
              {t('cart_empty')}
            </h3>
            <p style={{ color:'#3d4f62', fontSize:'0.82rem', lineHeight:1.6, maxWidth:'220px' }}>
              Kataloqdan qiymətli məhsulları seçib səbətə əlavə edin
            </p>
          </div>
        )}

        {/* ── Items List ─────────────────────────────────── */}
        {!orderSent && items.length > 0 && (
          <div style={{ flex:1, overflowY:'auto', padding:'16px 22px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {items.map(item => (
              <div key={item.id} className="cart-item" style={{ display:'flex', gap:'12px', alignItems:'center', padding:'10px 8px' }}>

                {/* Image */}
                <div style={{ width:'58px', height:'58px', borderRadius:'10px', overflow:'hidden', flexShrink:0, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  {item.img
                    ? <img src={item.img} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>⚙️</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:'800', color:'#e2e8f0', fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'2px' }}>
                    {item.name || item.brand}
                  </div>
                  <div style={{ color:'#5e748a', fontSize:'0.7rem', fontFamily:'var(--f-mono)', marginBottom:'4px' }}>
                    {item.sku || item.oemCode}
                  </div>
                  {item.price && (
                    <div style={{ color:R, fontSize:'0.85rem', fontWeight:'900' }}>
                      {fmtPrice(parseFloat(item.price) * item.qty)} {item.currency || 'USD'}
                    </div>
                  )}
                </div>

                {/* Qty + Remove */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px', flexShrink:0 }}>
                  <button className="cart-qbtn" onClick={() => removeFromCart(item.id)}
                    style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'6px', color:'#f87171', padding:'3px 8px', cursor:'pointer', fontSize:'0.8rem' }}>
                    🗑️
                  </button>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <button className="cart-qbtn" onClick={() => updateQty(item.id, item.qty - 1)} disabled={item.qty <= 1}
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', color:'#9aa8b6', width:'26px', height:'26px', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      −
                    </button>
                    <span style={{ color:'#fff', fontWeight:'900', fontSize:'0.9rem', minWidth:'20px', textAlign:'center' }}>{item.qty}</span>
                    <button className="cart-qbtn" onClick={() => updateQty(item.id, item.qty + 1)}
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', color:'#9aa8b6', width:'26px', height:'26px', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer: Promo + Totals + Actions ───────────── */}
        {!orderSent && items.length > 0 && (
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'18px 22px', flexShrink:0, display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* 🎟️ Promokod sahəsi */}
            <div>
              <div style={{ fontFamily:'var(--f-mono)', fontSize:'0.68rem', color:'#6b7a8d', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
                🎟️ {t('cart_promo_label')}
                <span style={{ color:'#3d4f62', fontSize:'0.6rem' }}>— MTRANS10, SPARE20</span>
              </div>

              {appliedPromo ? (
                /* Applied state */
                <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:'10px', padding:'10px 14px' }}>
                  <div style={{ flex:1 }}>
                    <code style={{ color:'#4ade80', fontWeight:'900', fontFamily:'var(--f-mono)', fontSize:'0.9rem', letterSpacing:'1px' }}>
                      {appliedPromo.code}
                    </code>
                    <span style={{ color:'#22c55e', fontSize:'0.82rem', marginLeft:'8px' }}>
                      −{appliedPromo.discount}{appliedPromo.type === 'percent' ? '%' : ' AZN'} {t('cart_promo_applied')}
                    </span>
                  </div>
                  <button onClick={removePromo}
                    style={{ background:'rgba(239,68,68,0.15)', border:'none', borderRadius:'6px', color:'#f87171', padding:'4px 10px', cursor:'pointer', fontSize:'0.8rem', fontFamily:'var(--f-body)' }}>
                    ✕
                  </button>
                </div>
              ) : (
                /* Input state */
                <>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                      placeholder={t('cart_promo_placeholder')}
                      style={{
                        flex:1, height:'42px',
                        background:'rgba(255,255,255,0.05)',
                        border:`1px solid ${promoError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius:'10px', color:'#fff',
                        padding:'0 14px', fontSize:'0.9rem',
                        outline:'none', fontFamily:'var(--f-mono)',
                        textTransform:'uppercase', letterSpacing:'2px',
                        transition:'border-color 0.2s',
                      }}
                    />
                    <button
                      onClick={handleApplyPromo}
                      style={{
                        padding:'0 18px', height:'42px',
                        background:'rgba(34,197,94,0.15)',
                        border:'1px solid rgba(34,197,94,0.3)',
                        borderRadius:'10px', color:'#4ade80',
                        cursor:'pointer', fontWeight:'800',
                        fontSize:'0.82rem', whiteSpace:'nowrap',
                        fontFamily:'var(--f-body)', transition:'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(34,197,94,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(34,197,94,0.15)'; }}
                    >
                      {t('cart_promo_apply')}
                    </button>
                  </div>
                  {promoError && (
                    <div style={{ marginTop:'7px', color:'#f87171', fontSize:'0.78rem', fontFamily:'var(--f-mono)', display:'flex', alignItems:'center', gap:'5px' }}>
                      ⚠️ {promoError === 'not_found' ? t('cart_promo_not_found') : t('cart_promo_inactive')}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Qiymət xülasəsi */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', color:'#6b7a8d', fontSize:'0.85rem' }}>
                <span>{t('cart_subtotal')}</span>
                <span>{fmtPrice(totals.subtotal)} USD</span>
              </div>
              {totals.discount > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', color:'#4ade80', fontSize:'0.85rem' }}>
                  <span>🎟️ {t('cart_discount')} ({appliedPromo?.code})</span>
                  <span>−{fmtPrice(totals.discount)} USD</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', color:'#fff', fontSize:'1.1rem', fontWeight:'900', fontFamily:'var(--f-display)', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'10px' }}>
                <span>{t('cart_total')}</span>
                <span style={{ color:R }}>{fmtPrice(totals.total)} USD</span>
              </div>
            </div>

            {/* Əməliyyat düymələri */}
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <button
                onClick={handleCheckout}
                style={{
                  width:'100%', height:'50px',
                  background:R, color:'#fff',
                  border:'none', borderRadius:'14px',
                  fontWeight:'900', fontSize:'1rem',
                  cursor:'pointer',
                  fontFamily:'var(--f-display)',
                  boxShadow:`0 6px 20px ${R}40`,
                  letterSpacing:'0.3px',
                  transition:'all 0.2s',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 10px 28px ${R}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 6px 20px ${R}40`; }}
              >
                🚀 {t('cart_checkout')}
              </button>
              <button
                onClick={clearCart}
                style={{
                  width:'100%', height:'40px',
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'10px', color:'#5e748a',
                  fontWeight:'700', fontSize:'0.85rem',
                  cursor:'pointer',
                  fontFamily:'var(--f-body)',
                  transition:'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#5e748a'; }}
              >
                🗑️ {t('cart_clear')}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
