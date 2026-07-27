// =================================================================
// FAYL: src/pages/Contact.jsx
// TƏSVİR: Əlaqə, VIN Sorğusu — Video düzəldildi, Form Scroll bərkidildi
// =================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInquiry } from '../context/InquiryContext';

export default function Contact() {
  const { t } = useTranslation();
  const location = useLocation();
  const { vinNumber, setVinNumber } = useInquiry();

  const [activeTab, setActiveTab] = useState('map');
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null); // ← form-a scroll üçün ref

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', company: '',
    vin: vinNumber || '', partOem: '', message: ''
  });

  // VIN param OR ?scroll=form → field doldur + form-a scroll
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const vinParam   = params.get('vin');
    const scrollForm = params.get('scroll') === 'form';
    if (vinParam) {
      const upper = vinParam.toUpperCase();
      setFormData(prev => ({ ...prev, vin: upper }));
      setVinNumber(upper);
    }
    if (vinParam || scrollForm) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
  }, [location.search, setVinNumber]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'vin') setVinNumber(value.toUpperCase());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main style={{ paddingTop: '130px', backgroundColor: '#0d1117', minHeight: '100vh', color: '#fff' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #05080f 0%, #0f1827 100%)',
        textAlign: 'center', padding: '60px 0 50px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', fontWeight: '800', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {t('contact_heading')}
          </span>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: '900', margin: '14px 0 18px', color: '#fff', letterSpacing: '-0.02em' }}>
            {t('contact_title')}
          </h1>
          <p style={{ color: '#7a8ea8', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
            {t('contact_hero_desc')}
          </p>
        </div>
      </section>

      {/* ── MAP / VIDEO ──────────────────────────────────────── */}
      <section style={{ padding: '50px 0' }}>
        <div className="wrap">

          {/* TAB BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
            {[
              { key: 'map',   icon: '📍', label: t('map_btn_map')   },
              { key: 'video', icon: '🎥', label: t('map_btn_video') },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '10px 24px', borderRadius: '10px', fontWeight: '700',
                  fontSize: '0.88rem', cursor: 'pointer', border: 'none',
                  fontFamily: 'var(--f-body)', transition: 'all 0.2s',
                  background: activeTab === tab.key ? 'var(--red)' : 'rgba(255,255,255,0.06)',
                  color: activeTab === tab.key ? '#fff' : '#8a9bb0',
                  boxShadow: activeTab === tab.key ? '0 4px 14px rgba(230,0,0,0.35)' : 'none',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* MAP / VIDEO FRAME */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', height: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', marginBottom: '50px', background: '#000' }}>
            {activeTab === 'map' ? (
              <iframe
                title="M-Trans MMC Ünvanı"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3035.85549060325!2d49.703081999999995!3d40.4563353!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40308566f6267987%3A0x4c268b91d716a473!2sM-Trans%20MMC!5e0!3m2!1sen!2saz!4v1781370630379!5m2!1sen!2saz"
                width="100%" height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              /* ── Orijinal M-Trans video faylı ── */
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                <video
                  key="mtrans-konum"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                >
                  {/* Əvvəlcə konum videosunu cəhd et */}
                  <source src="/konum_video.mp4" type="video/mp4" />
                  {/* Fallback: əsas M-Trans videosu */}
                  <source src="/m-trans-video.mp4" type="video/mp4" />
                  Brauzeriniz video formatını dəstəkləmir.
                </video>
                <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', backdropFilter: 'blur(8px)', letterSpacing: '0.5px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  📍 Xırdalan İqtisadi Zonası
                </div>
              </div>
            )}
          </div>

          {/* OFFICES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '55px' }}>
            {[
              { badge: t('hq_badge'), title: t('hq_title'), address: t('hq_address'), phone: '*0027 / (+994 12) 345-6789', email: 'info@m-trans.az', color: 'var(--red)' },
              { badge: 'GEORGIA TERMINAL', title: t('poti_title'), address: t('poti_address'), phone: '+995 32 200 0000', email: 'poti@m-trans.az', color: '#3B82F6' },
            ].map((office, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px', backdropFilter: 'blur(10px)' }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', fontWeight: '800', color: office.color, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{office.badge}</span>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', fontWeight: '800', color: '#fff', margin: '10px 0 14px' }}>{office.title}</h3>
                <p style={{ color: '#7a8ea8', fontSize: '0.9rem', marginBottom: '8px' }}>📍 {office.address}</p>
                <p style={{ color: '#7a8ea8', fontSize: '0.9rem', marginBottom: '8px' }}>📞 {office.phone}</p>
                <p style={{ color: '#7a8ea8', fontSize: '0.9rem' }}>✉️ {office.email}</p>
              </div>
            ))}
          </div>

          {/* ── VIN & FORM ─────────────────────────────────────── */}
          <div
            ref={formRef}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: 'clamp(30px, 5vw, 56px)',
              maxWidth: '880px',
              margin: '0 auto',
              scrollMarginTop: '110px',  // ← header yüksəkliyi qədər offset
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', fontWeight: '800', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {t('form_eyebrow')}
              </span>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: '900', color: '#fff', margin: '12px 0 8px' }}>
                {t('contact_form_title')}
              </h2>
              <p style={{ color: '#6b7a8d', fontSize: '0.95rem' }}>{t('contact_form_desc')}</p>
            </div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(34,197,94,0.06)', borderRadius: '16px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '14px' }}>✅</div>
                <h3 style={{ color: '#22c55e', fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px' }}>{t('success_title')}</h3>
                <p style={{ color: '#7a8ea8', fontSize: '0.95rem' }}>{t('contact_success_desc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>

                {/* Input style helper */}
                {[
                  { label: `${t('input_name')} *`,  name: 'name',    type: 'text',  ph: t('placeholder_name'),  req: true  },
                  { label: `${t('label_phone')} *`,  name: 'phone',   type: 'tel',   ph: t('placeholder_phone'), req: true  },
                  { label: t('label_email'),          name: 'email',   type: 'email', ph: t('placeholder_email'), req: false },
                  { label: '🚘 VIN Kod *',            name: 'vin',     type: 'text',  ph: '17 rəqəmli VIN kodu', req: true, mono: true },
                ].map(field => (
                  <div key={field.name}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'var(--f-mono)' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      required={field.req}
                      placeholder={field.ph}
                      value={formData[field.name]}
                      onChange={handleChange}
                      style={{
                        width: '100%', height: '46px', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px', color: '#fff', padding: '0 14px',
                        fontSize: '0.9rem', fontFamily: field.mono ? 'var(--f-mono)' : 'var(--f-body)',
                        textTransform: field.name === 'vin' ? 'uppercase' : 'none',
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={e  => { e.target.style.borderColor = 'rgba(230,0,0,0.5)'; }}
                      onBlur={e   => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    />
                  </div>
                ))}

                {/* OEM — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'var(--f-mono)' }}>
                    🏷️ OEM {t('contact_oem_code_label')}
                  </label>
                  <input
                    type="text" name="partOem"
                    placeholder="e.g. K020345 / Hengst E500KP02"
                    value={formData.partOem} onChange={handleChange}
                    style={{ width: '100%', height: '46px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '0 14px', fontSize: '0.9rem', fontFamily: 'var(--f-mono)', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(230,0,0,0.5)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>

                {/* Message — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'var(--f-mono)' }}>
                    {t('input_msg')}
                  </label>
                  <textarea
                    name="message" rows="4"
                    placeholder={t('contact_msg_placeholder')}
                    value={formData.message} onChange={handleChange}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'var(--f-body)', outline: 'none', resize: 'vertical', transition: 'border-color 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(230,0,0,0.5)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>

                {/* Submit */}
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      background: 'var(--red)', color: '#fff', border: 'none',
                      padding: '15px 48px', borderRadius: '12px',
                      fontWeight: '800', fontSize: '1rem', cursor: 'pointer',
                      fontFamily: 'var(--f-body)', letterSpacing: '0.3px',
                      boxShadow: '0 6px 24px rgba(230,0,0,0.35)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(230,0,0,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(230,0,0,0.35)'; }}
                  >
                    🚀 {t('btn_submit')}
                  </button>
                </div>

              </form>
            )}
          </div>

        </div>
      </section>
    </main>
  );
}