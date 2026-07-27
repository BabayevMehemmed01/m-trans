// =================================================================
// FAYL: src/pages/Partners.jsx
// TƏSVİR: Qlobal Ehtiyyat Hissələri Tərəfdaşları Və İstehsalçılar
// =================================================================

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Partners() {
  const { t } = useTranslation();

  const brandList = [
    { name: 'Knorr-Bremse', descKey: 'partners_knorr_desc', lis: ['partners_knorr_li1', 'partners_knorr_li2', 'partners_knorr_li3'] },
    { name: 'WABCO Systems', descKey: 'partners_wabco_desc', lis: ['partners_wabco_li1', 'partners_wabco_li2', 'partners_wabco_li3'] },
    { name: 'Hengst Filtration', descKey: 'partners_hengst_desc', lis: ['partners_hengst_li1', 'partners_hengst_li2', 'partners_hengst_li3'] },
    { name: 'Sachs Shock Absorbers', descKey: 'partners_sachs_desc', lis: ['partners_sachs_li1', 'partners_sachs_li2', 'partners_sachs_li3'] },
    { name: 'Bosch Commercial', descKey: 'partners_bosch_desc', lis: ['partners_bosch_li1', 'partners_bosch_li2', 'partners_bosch_li3'] },
    { name: 'Volvo & Mercedes Parts', descKey: 'partners_volvo_desc', lis: ['partners_volvo_li1', 'partners_volvo_li2', 'partners_volvo_li3'] }
  ];

  return (
    <main style={{ paddingTop: '130px', backgroundColor: 'var(--gray)' }}>
      {/* HERO */}
      <section className="section" style={{ background: 'var(--navy)', color: '#fff', textAlign: 'center', padding: '70px 0' }}>
        <div className="wrap">
          <span className="eyebrow" style={{ color: 'var(--red)' }}>OEM MANUFACTURERS</span>
          <h1 className="sec-title standout-title" style={{ marginTop: '10px', color: '#fff' }}>{t('partners_title')}</h1>
          <p className="sec-lead" style={{ margin: '15px auto', color: '#c4d1e0', maxWidth: '750px' }}>
            {t('partners_subtitle')}
          </p>
        </div>
      </section>

      {/* BRANDS LIST */}
      <section className="section" style={{ padding: '80px 0' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
            {brandList.map((brand, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  padding: '35px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                  border: '1px solid var(--gray-2)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--navy)', margin: 0 }}>{brand.name}</h3>
                  <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: '700', padding: '4px 10px', borderRadius: '12px' }}>
                    OFFICIAL OEM
                  </span>
                </div>
                <p style={{ color: 'var(--ink-2)', fontSize: '0.92rem', marginBottom: '20px', lineHeight: '1.6' }}>
                  {t(brand.descKey)}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 'auto 0 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--dim)' }}>
                  {brand.lis.map((liKey, i) => (
                    <li key={i} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'var(--red)' }}>✓</span> {t(liKey)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
