import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Services() {
  const { t } = useTranslation();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('deniz');

  // Navbardan gələn #hash-ə əsasən müvafiq tabı açır
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const validTabs = ['deniz', 'hava', 'quru', 'demir'];
    if (validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  return (
    <main>
      <section className="section services-page" style={{ paddingTop: '150px' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="eyebrow">{t('nav_services')}</span>
            <h1 className="sec-title">{t('services_page_title')}</h1>
          </div>

          <div className="service-tab-container">
            <div className="srv-tabs-nav">
              <button id="deniz" className={`srv-tab-btn ${activeTab === 'deniz' ? 'active' : ''}`} onClick={() => setActiveTab('deniz')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l1.5 3.5h15L21 17"/><path d="M5 17V9h14v8"/><path d="M12 9V4M9 6h6"/></svg>
                {t('srv_tab_sea')}
              </button>
              <button id="hava" className={`srv-tab-btn ${activeTab === 'hava' ? 'active' : ''}`} onClick={() => setActiveTab('hava')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3 15 21l-3.5-7L4 10.5 22 3z"/></svg>
                {t('srv_tab_air')}
              </button>
              <button id="quru" className={`srv-tab-btn ${activeTab === 'quru' ? 'active' : ''}`} onClick={() => setActiveTab('quru')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="11" height="9" rx="1"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>
                {t('srv_tab_road')}
              </button>
              <button id="demir" className={`srv-tab-btn ${activeTab === 'demir' ? 'active' : ''}`} onClick={() => setActiveTab('demir')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="16" rx="2" ry="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l-2 3"/><path d="M16 19l2 3"/></svg>
                {t('srv_tab_rail')}
              </button>
            </div>

            {activeTab === 'deniz' && (
              <div className="srv-tab-content active">
                <h2>{t('srv_tab_sea')}</h2>
                <p>{t('srv_content_sea_desc')}</p>
                <img src="https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=900&q=80" alt={t('srv_tab_sea')} style={{ width: '100%', borderRadius: 'var(--radius)' }} />
              </div>
            )}

            {activeTab === 'hava' && (
              <div className="srv-tab-content active">
                <h2>{t('srv_tab_air')}</h2>
                <p>{t('srv_content_air_desc')}</p>
                <img src="https://images.unsplash.com/photo-1570710891163-6d2419076c5b?w=900&q=80" alt={t('srv_tab_air')} style={{ width: '100%', borderRadius: 'var(--radius)' }} />
              </div>
            )}

            {activeTab === 'quru' && (
              <div className="srv-tab-content active">
                <h2>{t('srv_tab_road')}</h2>
                <p>{t('srv_content_road_desc')}</p>
                <img src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900&q=80" alt={t('srv_tab_road')} style={{ width: '100%', borderRadius: 'var(--radius)' }} />
              </div>
            )}

            {activeTab === 'demir' && (
              <div className="srv-tab-content active">
                <h2>{t('srv_tab_rail')}</h2>
                <p>{t('srv_content_rail_desc')}</p>
                <img src="https://images.unsplash.com/photo-1496262967815-132206202600?w=900&q=80" alt={t('srv_tab_rail')} style={{ width: '100%', borderRadius: 'var(--radius)' }} />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
