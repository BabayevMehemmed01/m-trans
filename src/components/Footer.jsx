import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          
          <div className="foot-brand">
            <Link to="/" style={{ display: 'block', marginBottom: '20px' }}>
              <img 
                src="/M-Trans_logo_dark_site.png" 
                alt="M-Trans" 
                style={{ height: '48px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} 
              />
            </Link>
            <p>{t('ft_brand_desc')}</p>
            <div className="socials">
              <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2 0-3 1-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9.5c0-.4.2-.5.6-.5z"/></svg></a>
              <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 8A1.5 1.5 0 1 0 6.5 5a1.5 1.5 0 0 0 0 3zM5 10h3v9H5zM11 10h3v1.3c.5-.8 1.6-1.5 3-1.5 2.3 0 3 1.5 3 4v5h-3v-4.5c0-1.2-.5-1.8-1.5-1.8s-1.5.7-1.5 1.8V19h-3z"/></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
            </div>
          </div>

          <div className="foot-col">
            <h4>{t('nav_home') || 'Səhifələr'}</h4>
            <Link to="/">{t('nav_home')}</Link>
            <Link to="/about">{t('nav_about')}</Link>
            <Link to="/partners">{t('nav_partners')}</Link>
            <Link to="/vacancies">{t('nav_vacancies')}</Link>
            <Link to="/tools">{t('nav_tools')}</Link>
            <Link to="/contact">{t('nav_contact')}</Link>
          </div>

          <div className="foot-col">
            <h4>{t('nav_services')}</h4>
            <HashLink smooth to="/services#deniz">{t('srv_sea')}</HashLink>
            <HashLink smooth to="/services#hava">{t('srv_air')}</HashLink>
            <HashLink smooth to="/services#demir">{t('srv_rail')}</HashLink>
            <HashLink smooth to="/services#quru">{t('srv_road')}</HashLink>
            <Link to="/repair">{t('srv_repair')}</Link>
            <Link to="/spare-parts">{t('srv_parts')}</Link>
          </div>

          <div className="foot-col">
            <h4>{t('nav_contact')}</h4>
            <p><span>{t('label_address')}</span>: <span>{t('val_address')}</span></p>
            <p>{t('label_phone')}: *0027</p>
            <p>{t('label_email')}: birlik1020@gmail.com</p>
          </div>

        </div>
      </div>
      
      <div className="foot-bottom-wrapper">
        <div className="wrap foot-bottom">
          <p>{t('ft_copyright')}</p>
        </div>
        <button className="scroll-top" aria-label="Yuxarı qalx" onClick={scrollToTop}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      </div>
    </footer>
  );
}