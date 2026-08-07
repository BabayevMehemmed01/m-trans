// =================================================================
// FAYL: src/components/PartDetailModal.jsx
// TƏSVİR: Detalın ətraflı düyməsinə basdıqda açılan texniki spesifikasiyalar modali
// =================================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInquiry } from '../context/InquiryContext';

export default function PartDetailModal() {
  const { t } = useTranslation();
  const { activeModalPart, setActiveModalPart, addToInquiry, setIsDrawerOpen } = useInquiry();

  if (!activeModalPart) return null;

  const partName = t(activeModalPart.nameKey);
  const partCat = t(activeModalPart.catKey);
  const partDesc = t(activeModalPart.descKey);

  const handleAddAndOpenDrawer = () => {
    addToInquiry(activeModalPart);
    setActiveModalPart(null);
    setIsDrawerOpen(true);
  };

  const handleDirectWhatsApp = () => {
    const message = encodeURIComponent(
      `Salam M-Trans Logistics, "OEM: ${activeModalPart.oemCode} - ${partName}" ehtiyyat hissəsi haqqında qiymət və mövcudluq öyrənmək istəyirəm.`
    );
    window.open(`https://wa.me/994500000000?text=${message}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(17, 17, 17, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={() => setActiveModalPart(null)}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          maxWidth: '850px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          padding: '0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bağlama düyməsi */}
        <button
          onClick={() => setActiveModalPart(null)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            background: 'var(--gray)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--navy)'
          }}
          aria-label="Close modal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Şəkil Paneli */}
          <div style={{ background: '#f8fafc', padding: '30px', display: 'flex', flexContent: 'center', alignItems: 'center', flexDirection: 'column', borderRight: '1px solid var(--gray-2)' }}>
            <div style={{ width: '100%', height: '300px', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <img src={activeModalPart.img} alt={partName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
              <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: '700', padding: '6px 12px', borderRadius: '20px' }}>
                {t('modal_guarantee_badge')}
              </span>
              <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: '700', padding: '6px 12px', borderRadius: '20px' }}>
                {t('modal_in_stock')}
              </span>
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: '700', padding: '6px 12px', borderRadius: '20px' }}>
                OEM: {activeModalPart.oemCode || 'OEM-GENUINE'}
              </span>
            </div>
          </div>

          {/* Məlumat Paneli */}
          <div style={{ padding: '35px', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              {partCat} • {activeModalPart.brand || 'Original OEM'}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '12px' }}>
              {partName}
            </h2>
            <p style={{ color: 'var(--ink-2)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
              {partDesc}
            </p>

            {/* Texniki Xüsusiyyətlər Cədvəli */}
            <div style={{ backgroundColor: 'var(--gray)', borderRadius: '12px', padding: '16px', marginBottom: '25px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                {t('modal_specs_title')}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                <div><span style={{ color: 'var(--dim)' }}>OEM Code:</span> <strong>{activeModalPart.oemCode || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--dim)' }}>{t('modal_brand')}:</span> <strong>{activeModalPart.brand || 'OEM'}</strong></div>
                <div><span style={{ color: 'var(--dim)' }}>{t('modal_compatibility')}:</span> <strong>{activeModalPart.compatibility || 'Volvo, Actros, MAN'}</strong></div>
                <div><span style={{ color: 'var(--dim)' }}>{t('modal_origin')}:</span> <strong>Germany / Sweden</strong></div>
              </div>
            </div>

            {/* Əməliyyat Düymələri */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button onClick={handleAddAndOpenDrawer} className="btn btn-primary btn-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                {t('btn_add_to_inquiry')}
              </button>

              <button onClick={handleDirectWhatsApp} className="btn btn-ghost btn-block" style={{ color: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                {t('btn_whatsapp_inquiry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
