// =================================================================
// FAYL: src/pages/About.jsx
// TƏSVİR: Ehtiyyat Hissələri üzrə Şirkət Haqqında Və Sertifikatlar
// =================================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();
  const [lightbox, setLightbox] = useState(null); // { img, pdf, iso }

  return (
    <main style={{ paddingTop: '130px', backgroundColor: 'var(--gray)' }}>
      {/* HERO */}
      <section className="section" style={{ background: 'var(--navy)', color: '#fff', textAlign: 'center', padding: '70px 0' }}>
        <div className="wrap">
          <span className="eyebrow" style={{ color: 'var(--red)' }}>{t('about_page_eyebrow')}</span>
          <h1 className="sec-title standout-title" style={{ marginTop: '10px', color: '#fff' }}>{t('about_page_title')}</h1>
          <p className="sec-lead" style={{ margin: '15px auto', color: '#c4d1e0', maxWidth: '750px' }}>
            {t('about_desc')}
          </p>
        </div>
      </section>

      {/* HAQQIMIZDA MƏTN VƏ ŞƏKİL */}
      <section className="section" style={{ padding: '80px 0' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px', alignItems: 'center' }}>
            <div>
              <span className="eyebrow">{t('about_eyebrow')}</span>
              <h2 className="sec-title" style={{ marginTop: '10px', marginBottom: '20px' }}>{t('about_title')}</h2>
              <p className="about-text-p" style={{ color: 'var(--ink-2)', lineHeight: '1.7', marginBottom: '15px' }}>
                {t('about_p1')}
              </p>
              <p className="about-text-p" style={{ color: 'var(--ink-2)', lineHeight: '1.7', marginBottom: '25px' }}>
                {t('about_p2')}
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ backgroundColor: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--red)', margin: 0 }}>80+</h4>
                  <span style={{ fontSize: '0.82rem', color: 'var(--dim)' }}>Euro 5/6 Trucks Fleet</span>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--navy)', margin: 0 }}>100%</h4>
                  <span style={{ fontSize: '0.82rem', color: 'var(--dim)' }}>Genuine OEM Parts</span>
                </div>
              </div>
            </div>

            <div className="about-image" style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80" alt="M-Trans Spare Parts Warehouse" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      {/* MISSİYA VƏ VİZYON */}
      <section className="section" style={{ backgroundColor: '#fff', padding: '80px 0' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div style={{ backgroundColor: 'var(--gray)', padding: '40px', borderRadius: '20px', border: '1px solid var(--gray-2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🎯</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '12px' }}>{t('about_mission_title')}</h3>
              <p style={{ color: 'var(--ink-2)', lineHeight: '1.6' }}>{t('about_mission_desc')}</p>
            </div>

            <div style={{ backgroundColor: 'var(--gray)', padding: '40px', borderRadius: '20px', border: '1px solid var(--gray-2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🚀</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '12px' }}>{t('about_vision_title')}</h3>
              <p style={{ color: 'var(--ink-2)', lineHeight: '1.6' }}>{t('about_vision_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SERTİFİKATLAR — Klikləndikdə PDF açılır */}
      <section style={{ padding: '80px 0', background: '#f4f6fa' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '55px' }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', fontWeight: '800', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {t('about_certs_title')}
            </span>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)', fontWeight: '900', color: 'var(--navy)', margin: '12px 0 14px', letterSpacing: '-0.02em' }}>
              Qlobal Standartlar və Sertifikatlarımız
            </h2>
            <p style={{ color: 'var(--dim)', fontSize: '0.95rem' }}>
              Sertifikata baxmaq üçün kart üzərinə klikləyin
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {[
              { pdf: '/pdf1.pdf', img: '/sert-1.png', iso: 'ISO 9001:2015',  icon: '🏅', color: '#0284c7', colorBg: 'rgba(2,132,199,0.08)',  label: t('cert_qms'), badge: 'Quality Management' },
              { pdf: '/pdf2.pdf', img: '/sert-2.png', iso: 'ISO 14001:2015', icon: '🌿', color: '#16a34a', colorBg: 'rgba(22,163,74,0.08)',   label: t('cert_ems'), badge: 'Environmental Management' },
              { pdf: '/pdf3.pdf', img: '/sert-3.png', iso: 'ISO 45001:2018', icon: '🛡️', color: '#d97706', colorBg: 'rgba(217,119,6,0.08)',   label: t('cert_ohs'), badge: 'Occupational Health & Safety' },
            ].map((cert, i) => (
              <div
                key={i}
                onClick={() => setLightbox(cert)}
                style={{
                  display: 'block',
                  background: '#fff',
                  borderRadius: '20px',
                  border: `1.5px solid rgba(0,0,0,0.06)`,
                  boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
                  padding: '36px 28px 28px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
                  position: 'relative',
                  overflow: 'hidden',
                  group: 'cert',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.1), 0 0 0 2px ${cert.color}40`;
                  e.currentTarget.style.borderColor = `${cert.color}60`;
                  e.currentTarget.querySelector('.cert-hint').style.opacity = '1';
                  e.currentTarget.querySelector('.cert-hint').style.transform = 'translateY(0)';
                  e.currentTarget.querySelector('.cert-bg').style.opacity = '1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                  e.currentTarget.querySelector('.cert-hint').style.opacity = '0';
                  e.currentTarget.querySelector('.cert-hint').style.transform = 'translateY(6px)';
                  e.currentTarget.querySelector('.cert-bg').style.opacity = '0';
                }}
              >
                {/* Color bg on hover */}
                <div className="cert-bg" style={{ position: 'absolute', inset: 0, background: cert.colorBg, opacity: 0, transition: 'opacity 0.3s ease', borderRadius: '20px' }} />

                {/* PDF badge */}
                <div style={{ position: 'absolute', top: '14px', right: '14px', background: cert.colorBg, border: `1px solid ${cert.color}30`, borderRadius: '8px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={cert.color} strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <span style={{ fontSize: '0.65rem', fontWeight: '800', color: cert.color, fontFamily: 'var(--f-mono)', letterSpacing: '0.5px' }}>PDF</span>
                </div>

                {/* Certificate thumbnail image */}
                <div style={{ position: 'relative', zIndex: 1, marginBottom: '16px', borderRadius: '10px', overflow: 'hidden', height: '120px', background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={cert.img}
                    alt={cert.iso}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: '8px' }}
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                  />
                  <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem' }}>{cert.icon}</div>
                </div>

                {/* ISO title */}
                <h3 style={{ position: 'relative', zIndex: 1, fontFamily: 'var(--f-display)', fontSize: '1.25rem', fontWeight: '900', color: 'var(--navy)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                  {cert.iso}
                </h3>

                {/* Badge */}
                <div style={{ position: 'relative', zIndex: 1, display: 'inline-block', background: cert.colorBg, border: `1px solid ${cert.color}25`, borderRadius: '20px', padding: '3px 12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: cert.color, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {cert.badge}
                  </span>
                </div>

                {/* Description */}
                <p style={{ position: 'relative', zIndex: 1, color: 'var(--dim)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '0' }}>
                  {cert.label}
                </p>

                {/* Hover hint */}
                <div className="cert-hint" style={{
                  position: 'relative', zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  marginTop: '18px', paddingTop: '14px',
                  borderTop: `1px solid ${cert.color}20`,
                  opacity: 0, transform: 'translateY(6px)',
                  transition: 'opacity 0.25s ease, transform 0.25s ease',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cert.color} strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: cert.color }}>Baxmaq üçün klik et</span>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIGHTBOX MODAL ─────────────────────────────── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            animation: 'pageFadeIn 0.2s ease',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              overflow: 'hidden',
              maxWidth: '680px',
              width: '100%',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              animation: 'revealUp 0.3s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f0', background: lightbox.colorBg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.8rem' }}>{lightbox.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--f-display)', fontWeight: '900', color: 'var(--navy)', fontSize: '1.1rem' }}>{lightbox.iso}</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.65rem', fontWeight: '700', color: lightbox.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lightbox.badge}</div>
                </div>
              </div>
              <button
                onClick={() => setLightbox(null)}
                style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '1.2rem', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Certificate Image */}
            <div style={{ background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', padding: '24px' }}>
              <img
                src={lightbox.img}
                alt={lightbox.iso}
                style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
              <p style={{ color: '#6b7a8d', fontSize: '0.85rem', margin: 0, flex: 1 }}>{lightbox.label}</p>
              <a
                href={lightbox.pdf}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: lightbox.color, color: '#fff',
                  padding: '10px 22px', borderRadius: '10px',
                  fontWeight: '800', fontSize: '0.85rem',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  boxShadow: `0 4px 14px ${lightbox.color}40`,
                  transition: 'all 0.2s',
                  fontFamily: 'var(--f-body)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                PDF Yüklə
              </a>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
