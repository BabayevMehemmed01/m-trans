import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Repair() {
  const { t } = useTranslation();

  return (
    <main>
      <section className="section repair-hero">
        <div className="vac-bg" aria-hidden="true"></div>
        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
          <div className="sec-head fade-in-up">
            <span className="eyebrow">{t('repair_eyebrow')}</span>
            <h1 className="sec-title standout-title">{t('repair_title')}</h1>
            <p className="sec-lead" style={{ color: '#c4d1e0', maxWidth: '600px', marginTop: '14px' }}>
              {t('repair_hero_desc')}
            </p>
            <a href="#elaqe" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-flex' }}>
              <span>{t('repair_apply_btn')}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>

          <div className="hero-stats fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="hstat"><div className="n">12+</div><div className="l">{t('repair_stat1_label')}</div></div>
            <div className="hstat"><div className="n">7/24</div><div className="l">{t('repair_stat2_label')}</div></div>
            <div className="hstat"><div className="n">100%</div><div className="l">{t('repair_stat3_label')}</div></div>
            <div className="hstat"><div className="n">100%</div><div className="l">{t('repair_stat4_label')}</div></div>
          </div>
        </div>
      </section>

      <section className="section repair-services">
        <div className="wrap">
          <h2 className="sec-title" style={{ marginBottom: '40px', fontSize: '2rem' }}>{t('repair_services_title')}</h2>
          <div className="repair-grid">
            <div className="repair-card reveal-up">
              <div className="repair-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div>
              <h3>{t('repair_c1_title')}</h3>
              <p>{t('repair_c1_desc')}</p>
            </div>

            <div className="repair-card reveal-up" style={{ animationDelay: '0.1s' }}>
              <div className="repair-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
              <h3>{t('repair_c2_title')}</h3>
              <p>{t('repair_c2_desc')}</p>
            </div>

            <div className="repair-card reveal-up" style={{ animationDelay: '0.2s' }}>
              <div className="repair-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
              <h3>{t('repair_c3_title')}</h3>
              <p>{t('repair_c3_desc')}</p>
            </div>

            <div className="repair-card reveal-up" style={{ animationDelay: '0.3s' }}>
              <div className="repair-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>
              <h3>{t('repair_c4_title')}</h3>
              <p>{t('repair_c4_desc')}</p>
            </div>

            <div className="repair-card reveal-up" style={{ animationDelay: '0.4s' }}>
              <div className="repair-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
              <h3>{t('repair_c5_title')}</h3>
              <p>{t('repair_c5_desc')}</p>
            </div>

            <div className="repair-card reveal-up" style={{ animationDelay: '0.5s' }}>
              <div className="repair-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="M2 12h20"/><path d="m4.93 19.07 14.14-14.14"/></svg></div>
              <h3>{t('repair_c6_title')}</h3>
              <p>{t('repair_c6_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section repair-process" style={{ background: '#fff' }}>
        <div className="wrap">
          <div className="sec-head fade-in-up" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="eyebrow">{t('repair_steps_eyebrow')}</span>
            <h2 className="sec-title">{t('repair_process_title')}</h2>
          </div>
          
          <div className="process-grid">
            <div className="process-step reveal-up">
              <div className="step-num">1</div>
              <h4>{t('repair_proc1_title')}</h4>
              <p>{t('repair_proc1_desc')}</p>
            </div>
            <div className="process-step reveal-up" style={{ animationDelay: '0.15s' }}>
              <div className="step-num">2</div>
              <h4>{t('repair_proc2_title')}</h4>
              <p>{t('repair_proc2_desc')}</p>
            </div>
            <div className="process-step reveal-up" style={{ animationDelay: '0.3s' }}>
              <div className="step-num">3</div>
              <h4>{t('repair_proc3_title')}</h4>
              <p>{t('repair_proc3_desc')}</p>
            </div>
            <div className="process-step reveal-up" style={{ animationDelay: '0.45s' }}>
              <div className="step-num">4</div>
              <h4>{t('repair_proc4_title')}</h4>
              <p>{t('repair_proc4_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="urgent-cta reveal-up">
            <div className="cta-text">
              <h3>{t('repair_urgent_title')}</h3>
              <p>{t('repair_urgent_desc')}</p>
            </div>
            <a href="tel:*0027" className="btn btn-primary btn-lg cta-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {t('repair_call_btn')}: *0027
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
