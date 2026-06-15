import React from 'react';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <main style={{ paddingTop: '60px', paddingBottom: '96px', background: 'var(--white)' }}>
      <div className="wrap">
        <div className="about-page-top" style={{ marginTop: '40px' }}>
          <div className="about-text-block">
            <span className="eyebrow">{t('about_page_eyebrow')}</span>
            <h2 className="page-title" style={{ marginTop: '10px' }}>{t('about_page_title')}</h2>
            <p className="about-text-p">{t('about_p1')}</p>
            <p className="about-text-p">{t('about_page_p2')}</p>
          </div>
          
          <div className="about-video-decor">
            <video controls poster="/m-trans-main.jpeg">
              <source src="/m-trans-video.mp4" type="video/mp4" />
              {t('about_video_fallback')}
            </video>
          </div>
        </div>

        <div className="about-page-grid" style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--gray-2)' }}>
          <div>
            <h3 className="section-subtitle">{t('about_mission_title')}</h3>
            <p>{t('about_mission_desc')}</p>
          </div>
          <div>
            <h3 className="section-subtitle">{t('about_vision_title')}</h3>
            <p>{t('about_vision_desc')}</p>
          </div>
        </div>

        <div className="about-page-grid" style={{ marginTop: '60px' }}>
          <div>
            <h3 className="section-subtitle">{t('about_adv_title')}</h3>
            <ul className="custom-list">
              <li>{t('about_adv_li1')}</li>
              <li>{t('about_adv_li2')}</li>
              <li>{t('about_adv_li3')}</li>
              <li>{t('about_adv_li4')}</li>
              <li>{t('about_adv_li5')}</li>
              <li>{t('about_adv_li6')}</li>
              <li>{t('about_adv_li7')}</li>
              <li>{t('about_adv_li8')}</li>
            </ul>
          </div>
          <div>
            <h3 className="section-subtitle">{t('about_str_title')}</h3>
            <ul className="custom-list">
              <li>{t('about_str_li1')}</li>
              <li>{t('about_str_li2')}</li>
              <li>{t('about_str_li3')}</li>
              <li>{t('about_str_li4')}</li>
            </ul>
          </div>
        </div>

        <div className="about-certificates" style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--gray-2)' }}>
          <h3 className="section-subtitle" style={{ textAlign: 'left', marginBottom: '30px', color: '#002c5c' }}>{t('about_certs_title')}</h3>
          <div className="cert-grid">
            <a href="/pdf1.pdf" target="_blank" rel="noopener noreferrer" className="cert-card">
              <div className="cert-img"><img src="/sert-1.png" alt="ISO 9001:2015" /></div>
              <h4>ISO 9001:2015</h4>
              <p>{t('cert_qms')}</p>
            </a>
            <a href="/pdf2.pdf" target="_blank" rel="noopener noreferrer" className="cert-card">
              <div className="cert-img"><img src="/sert-2.png" alt="ISO 14001:2015" /></div>
              <h4>ISO 14001:2015</h4>
              <p>{t('cert_ems')}</p>
            </a>
            <a href="/pdf3.pdf" target="_blank" rel="noopener noreferrer" className="cert-card">
              <div className="cert-img"><img src="/sert-3.png" alt="ISO 45001:2018" /></div>
              <h4>ISO 45001:2018</h4>
              <p>{t('cert_ohs')}</p>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
