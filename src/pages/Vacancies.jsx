import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Vacancies() {
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(t('vac_success_msg'));
    e.target.reset(); // Formu təmizləyir
  };

  return (
    <main>
      <section className="section vacancies-section" id="vakansiyalar">
        <div className="vac-bg" aria-hidden="true"></div>
        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
          
          <div className="sec-head fade-in-up" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="eyebrow">{t('nav_vacancies')}</span>
            <h2 className="sec-title standout-title">{t('vac_title')}</h2>
            <p className="sec-lead" style={{ margin: '15px auto', color: '#c4d1e0' }}>{t('vac_desc')}</p>
          </div>

          <div className="vac-card fade-in-up" style={{ animationDelay: '0.2s', textAlign: 'center', maxWidth: '600px', margin: '0 auto 24px' }}>
            <div className="vac-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
            <h3 className="vac-card-title">{t('vac_no_open_title')}</h3>
            <p className="vac-card-desc">{t('vac_no_open_desc')}</p>
          </div>

          <div className="vac-card fade-in-up" style={{ animationDelay: '0.4s', maxWidth: '720px', margin: '0 auto' }}>
            <div className="vac-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '26px', height: '26px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <h3 className="vac-card-title" style={{ margin: 0 }}>{t('vac_add_cv_title')}</h3>
            </div>
            <p className="vac-card-desc" style={{ marginLeft: '38px', marginTop: '4px', marginBottom: '26px', textAlign: 'left' }}>{t('vac_add_cv_desc')}</p>

            <form id="cvForm" className="vac-form" onSubmit={handleSubmit}>
              <div className="calc-grid">
                <div>
                  <label className="field-label">{t('input_name')}</label>
                  <input type="text" className="input" placeholder={t('vac_name_ph')} required />
                </div>
                <div>
                  <label className="field-label">{t('vac_email_label')}</label>
                  <input type="email" className="input" placeholder={t('vac_email_ph')} required />
                </div>
                <div>
                  <label className="field-label">{t('label_phone')}</label>
                  <input type="tel" className="input mono" placeholder={t('placeholder_phone')} required />
                </div>
                <div>
                  <label className="field-label">{t('vac_field_label')}</label>
                  <input type="text" className="input" placeholder={t('vac_field_placeholder')} required />
                </div>
              </div>

              <div className="vac-upload-area" id="dropZone">
                <input type="file" id="cvFile" accept=".pdf,.doc,.docx" required style={{ width: '100%', marginBottom: '10px' }} />
                <div className="vac-upload-title">{t('vac_upload_title')}</div>
                <div className="vac-upload-desc">{t('vac_upload_desc')}</div>
              </div>

              <div className="vac-form-footer">
                <span className="vac-privacy">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  {t('vac_privacy')}
                </span>
                <button type="submit" className="btn btn-primary">
                  <span>{t('btn_send_cv')}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </form>
          </div>

        </div>
      </section>
    </main>
  );
}
