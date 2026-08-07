// =================================================================
// FAYL: src/components/InquiryDrawer.jsx
// TƏSVİR: Sorğu Siyahısı (Basket Drawer) slide-over paneli
// =================================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInquiry } from '../context/InquiryContext';

export default function InquiryDrawer() {
  const { t } = useTranslation();
  const {
    inquiryList,
    removeFromInquiry,
    updateQuantity,
    clearInquiry,
    vinNumber,
    setVinNumber,
    isDrawerOpen,
    setIsDrawerOpen
  } = useInquiry();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isDrawerOpen) return null;

  const handleSendWhatsApp = () => {
    if (inquiryList.length === 0) return;

    let text = `*M-TRANS LOGISTICS - EHTİYYAT HİSSƏLƏRİ SORĞUSU*\n\n`;
    if (vinNumber) text += `🚘 *VIN / Şassi Kodu:* ${vinNumber}\n`;
    if (customerName) text += `👤 *Müştəri:* ${customerName}\n`;
    if (customerPhone) text += `📞 *Əlaqə:* ${customerPhone}\n`;
    if (companyName) text += `🏢 *Şirkət:* ${companyName}\n`;
    text += `\n*SEÇİLMİŞ EHTİYYAT HİSSƏLƏRİ:*\n`;

    inquiryList.forEach((item, i) => {
      text += `${i + 1}. ${t(item.nameKey)} (OEM: ${item.oemCode || 'N/A'}) - x${item.quantity}\n`;
    });

    if (notes) text += `\n💬 *Qeyd:* ${notes}\n`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/994500000000?text=${encoded}`, '_blank');
  };

  const handleSendEmail = () => {
    if (inquiryList.length === 0) return;

    const subject = encodeURIComponent(`Ehtiyyat Hissəsi Sorğusu - VIN: ${vinNumber || 'Bilinmir'}`);
    let body = `Salam M-Trans Logistics,\n\nAşağıdakı ehtiyyat hissələri üçün qiymət və mövcudluq təklifi almaq istəyirəm:\n\n`;
    if (vinNumber) body += `VIN / Şassi Kodu: ${vinNumber}\n`;
    if (customerName) body += `Ad, Soyad: ${customerName}\n`;
    if (customerPhone) body += `Telefon: ${customerPhone}\n`;
    if (companyName) body += `Şirkət: ${companyName}\n\n`;

    body += `SİFARİŞ EDİLƏN HİSSƏLƏR:\n`;
    inquiryList.forEach((item, i) => {
      body += `${i + 1}. ${t(item.nameKey)} (OEM: ${item.oemCode || 'N/A'}) - Say: ${item.quantity}\n`;
    });

    if (notes) body += `\nQeydlər: ${notes}\n`;

    window.location.href = `mailto:info@m-trans.az?subject=${subject}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={() => setIsDrawerOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          backgroundColor: '#fff',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Başlığı */}
        <div style={{ padding: '24px', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '22px', height: '22px', color: 'var(--red)' }}>
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', margin: 0 }}>
              {t('drawer_title')} ({inquiryList.length})
            </h3>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Drawer Əsas Məzmunu */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
          {/* VIN input bölməsi */}
          <div style={{ marginBottom: '25px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--gray-2)' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--navy)', textTransform: 'uppercase', marginBottom: '6px' }}>
              🚘 {t('drawer_vin_label')}
            </label>
            <input
              type="text"
              className="input"
              placeholder={t('drawer_vin_placeholder')}
              value={vinNumber}
              onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
              style={{ fontFamily: 'var(--f-mono)', letterSpacing: '1px', textTransform: 'uppercase' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--dim)', marginTop: '4px', display: 'block' }}>
              {t('drawer_vin_hint')}
            </span>
          </div>

          {/* Siyahı */}
          {inquiryList.length > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--dim)' }}>{t('drawer_items_list')}</span>
                <button onClick={clearInquiry} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  {t('drawer_clear_all')}
                </button>
              </div>

              {inquiryList.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '15px', padding: '12px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--gray-2)' }}>
                  <img src={item.img} alt={t(item.nameKey)} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flexGrow: 1 }}>
                    <h5 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--navy)', margin: '0 0 4px 0' }}>{t(item.nameKey)}</h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--dim)', fontFamily: 'var(--f-mono)' }}>OEM: {item.oemCode || 'GENUINE'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--gray-2)', background: '#fff', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--gray-2)', background: '#fff', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                  <button onClick={() => removeFromInquiry(item.id)} style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: '4px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}

              {/* Müştəri Məlumatları */}
              <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed var(--gray-2)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '12px' }}>
                  {t('drawer_contact_info')}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder={t('input_name')}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <input
                    type="tel"
                    className="input"
                    placeholder={t('placeholder_phone')}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder={t('drawer_company_placeholder')}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <textarea
                    className="textarea"
                    rows="2"
                    placeholder={t('drawer_notes_placeholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 10px', color: 'var(--dim)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '56px', height: '56px', margin: '0 auto 15px', color: 'var(--dim)' }}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <h4 style={{ color: 'var(--navy)', fontSize: '1.1rem', marginBottom: '6px' }}>{t('drawer_empty_title')}</h4>
              <p style={{ fontSize: '0.85rem' }}>{t('drawer_empty_desc')}</p>
            </div>
          )}
        </div>

        {/* Drawer Alt Göndərmə Paneli */}
        {inquiryList.length > 0 && (
          <div style={{ padding: '20px', borderTop: '1px solid var(--gray-2)', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={handleSendWhatsApp} className="btn btn-primary btn-block" style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              {t('btn_send_whatsapp_inquiry')}
            </button>

            <button onClick={handleSendEmail} className="btn btn-ghost btn-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              {t('btn_send_email_inquiry')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
