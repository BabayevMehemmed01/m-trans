// =================================================================
// FAYL: src/components/PartCard.jsx
// TƏSVİR: Premium 3D TiltCard inteqrasiyalı Ehtiyyat Hissəsi Kartı
//         Dark Industrial dizayn + Glassmorphism hover overlay
// =================================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInquiry } from '../context/InquiryContext';
import TiltCard from './TiltCard';

export default function PartCard({ product, index = 0 }) {
  const { t } = useTranslation();
  const { addToInquiry, setActiveModalPart, setIsDrawerOpen } = useInquiry();

  const partName = t(product.nameKey);
  const partCat  = t(product.catKey);
  const partDesc = t(product.descKey);

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToInquiry(product);
    setIsDrawerOpen(true);
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const msg = encodeURIComponent(
      `Salam M-Trans, "OEM: ${product.oemCode || 'OEM'} — ${partName}" üçün qiymət sorğusu.`
    );
    window.open(`https://wa.me/994500000000?text=${msg}`, '_blank');
  };

  return (
    <TiltCard
      intensity={10}
      glare={true}
      onClick={() => setActiveModalPart(product)}
      style={{
        animationDelay: `${(index % 4) * 0.08}s`,
        backgroundColor: '#fff',
        border: '1px solid #e8ecf2',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* ── Şəkil ─────────────────────────────────── */}
      <div style={{ height: '220px', position: 'relative', overflow: 'hidden', background: '#f4f6f9', flexShrink: 0 }}>
        <img
          src={product.img}
          alt={partName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
            display: 'block',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        />

        {/* OEM Badge */}
        <span style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'rgba(9,13,19,0.82)', color: '#e0e7ef',
          fontFamily: 'var(--f-mono)', fontSize: '0.68rem',
          padding: '4px 10px', borderRadius: '6px',
          backdropFilter: 'blur(6px)', letterSpacing: '0.5px',
        }}>
          {product.oemCode || 'OEM'}
        </span>

        {/* Brand Badge */}
        {product.brand && (
          <span style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'var(--red)', color: '#fff',
            fontSize: '0.68rem', fontWeight: '800',
            padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {product.brand}
          </span>
        )}

        {/* "In Stock" dot */}
        <span style={{
          position: 'absolute', bottom: '12px', right: '12px',
          background: 'rgba(255,255,255,0.92)', color: '#16a34a',
          fontSize: '0.68rem', fontWeight: '700',
          padding: '3px 9px', borderRadius: '20px',
          display: 'flex', alignItems: 'center', gap: '4px',
          backdropFilter: 'blur(6px)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>
          {t('parts_in_stock')}
        </span>
      </div>

      {/* ── Kontent ───────────────────────────────── */}
      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <span style={{
          fontFamily: 'var(--f-mono)', fontSize: '0.7rem',
          color: 'var(--red)', textTransform: 'uppercase',
          letterSpacing: '1.2px', fontWeight: '700',
          marginBottom: '8px', display: 'block',
        }}>
          {partCat}
        </span>

        <h3 style={{
          fontFamily: 'var(--f-display)', fontSize: '1.08rem',
          fontWeight: '700', color: 'var(--navy)',
          margin: '0 0 10px', lineHeight: '1.35',
        }}>
          {partName}
        </h3>

        <p style={{
          color: '#6b7a8d', fontSize: '0.875rem',
          lineHeight: '1.55', flexGrow: 1, marginBottom: '20px',
        }}>
          {partDesc}
        </p>

        {/* ── Düymələr ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
          {/* Sorğuya əlavə et */}
          <button
            onClick={handleQuickAdd}
            className="btn btn-primary"
            style={{ padding: '10px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {t('btn_add_to_inquiry')}
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            style={{
              padding: '10px 12px', fontSize: '0.8rem',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '10px', color: '#16a34a', fontWeight: '700',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s',
              fontFamily: 'var(--f-body)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#22c55e'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#22c55e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            WhatsApp
          </button>
        </div>
      </div>
    </TiltCard>
  );
}
