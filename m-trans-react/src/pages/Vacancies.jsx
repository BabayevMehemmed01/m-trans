// =================================================================
// FAYL: src/pages/Vacancies.jsx
// TƏSVİR: Vakansiyalar Və Karyera Müraciəti Səhifəsi
// =================================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Vacancies() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main style={{ paddingTop: '130px', backgroundColor: 'var(--gray)', minHeight: '100vh' }}>
      {/* HERO */}
      <section className="section" style={{ background: 'var(--navy)', color: '#fff', textAlign: 'center', padding: '70px 0' }}>
        <div className="wrap">
          <span className="eyebrow" style={{ color: 'var(--red)' }}>CAREERS AT M-TRANS</span>
          <h1 className="sec-title standout-title" style={{ marginTop: '10px', color: '#fff' }}>{t('vac_title')}</h1>
          <p className="sec-lead" style={{ margin: '15px auto', color: '#c4d1e0', maxWidth: '650px' }}>
            {t('vac_desc')}
          </p>
        </div>
      </section>

      <section className="section" style={{ padding: '80px 0' }}>
        <div className="wrap">
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--gray-2)', maxWidth: '750px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📋</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy)', marginBottom: '8px' }}>
                {t('vac_add_cv_title')}
              </h3>
              <p style={{ color: 'var(--dim)', fontSize: '0.92rem' }}>
                {t('vac_add_cv_desc')}
              </p>
            </div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                <h4 style={{ color: '#166534', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>
                  {t('vac_success_msg')}
                </h4>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '6px' }}>{t('vac_field_label')} *</label>
                  <input type="text" className="input" placeholder={t('vac_field_placeholder')} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '6px' }}>{t('input_name')} *</label>
                    <input type="text" className="input" placeholder={t('vac_name_ph')} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--navy)', marginBottom: '6px' }}>{t('vac_email_label')} *</label>
                    <input type="email" className="input" placeholder={t('vac_email_ph')} required />
                  </div>
                </div>

                <div style={{ border: '2px dashed var(--gray-2)', padding: '30px', borderRadius: '14px', textAlign: 'center', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>📁</span>
                  <strong style={{ display: 'block', color: 'var(--navy)', fontSize: '0.95rem' }}>{t('vac_upload_title')}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--dim)' }}>{t('vac_upload_desc')}</span>
                  <input type="file" style={{ display: 'none' }} id="cv-upload-input" />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '1rem', marginTop: '10px' }}>
                  🚀 {t('btn_send_cv')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
