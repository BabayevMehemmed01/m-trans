import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const closeMenu = () => setMenuOpen(false);

  // (B) Səhifə aşağı sürüşdürüldükdə nav-a "scrolled" class-ı verilir
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // (C) Mobil menyu açıq ikən səhifənin scroll-unu kilitləyirik
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  // Səhifə dəyişəndə mobil menyu avtomatik bağlanır
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <>
      <div className="top-bar">
        <div className="wrap top-bar-inner">
          <div className="contact-info">
            <a href="mailto:birlik1020@gmail.com">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              birlik1020@gmail.com
            </a>
            <a href="tel:*0027">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              *0027
            </a>
          </div>
          <div className="top-right">
            <div className="lang">
              <button className={`lang-btn ${i18n.language === 'az' ? 'on' : ''}`} onClick={() => changeLanguage('az')}>AZ</button>
              <button className={`lang-btn ${i18n.language === 'en' ? 'on' : ''}`} onClick={() => changeLanguage('en')}>EN</button>
              <button className={`lang-btn ${i18n.language === 'ru' ? 'on' : ''}`} onClick={() => changeLanguage('ru')}>RU</button>
            </div>
            <HashLink smooth to="/#elaqe" className="btn btn-ghost btn-pill">{t('nav_price')}</HashLink>
          </div>
        </div>
      </div>

      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
        <div className="wrap nav-inner">
          <div className="logo-wrapper" style={{ flexShrink: 0, minWidth: '160px' }}>
            <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/M-Trans_logo_dark_site.png" alt="M Trans" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
            </Link>
          </div>

          <div className="nav-links">
            <Link to="/">{t('nav_home')}</Link>
            <Link to="/about">{t('nav_about')}</Link>
            <Link to="/partners">{t('nav_partners')}</Link>
            <Link to="/vacancies">{t('nav_vacancies')}</Link>

            <div className="nav-drop">
              <Link to="/tools">
                {t('nav_tools')}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </Link>
              <div className="nav-drop-menu">
                <HashLink smooth to="/tools#track">{t('tool_track')}</HashLink>
                <HashLink smooth to="/tools#calc">{t('tool_calc')}</HashLink>
                <HashLink smooth to="/tools#cbm">{t('tool_cbm')}</HashLink>
                <HashLink smooth to="/tools#currency">{t('tool_curr')}</HashLink>
                <HashLink smooth to="/tools#transit">{t('tool_transit')}</HashLink>
                <HashLink smooth to="/tools#hs">{t('tool_hs')}</HashLink>
              </div>
            </div>

            <div className="nav-drop">
              <Link to="#">
                {t('nav_services')}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </Link>
              <div className="nav-drop-menu">
                <HashLink smooth to="/services#deniz">{t('srv_sea')}</HashLink>
                <HashLink smooth to="/services#hava">{t('srv_air')}</HashLink>
                <HashLink smooth to="/services#demir">{t('srv_rail')}</HashLink>
                <HashLink smooth to="/services#quru">{t('srv_road')}</HashLink>
                <Link to="/repair">{t('srv_repair')}</Link>
                <Link to="/spare-parts">{t('srv_parts')}</Link>
              </div>
            </div>

            <Link to="/contact">{t('nav_contact')}</Link>
          </div>

          <button className="burger" id="burger" aria-label="Menyu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </nav>

      {/* (C) MOBİL MENYU */}
      <div className={`scrim ${menuOpen ? 'show' : ''}`} onClick={closeMenu} aria-hidden="true"></div>

      <aside className={`mobile-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <button className="m-close" aria-label="Bağla" onClick={closeMenu}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        <Link to="/" onClick={closeMenu}>{t('nav_home')}</Link>
        <Link to="/about" onClick={closeMenu}>{t('nav_about')}</Link>
        <Link to="/partners" onClick={closeMenu}>{t('nav_partners')}</Link>
        <Link to="/vacancies" onClick={closeMenu}>{t('nav_vacancies')}</Link>
        <Link to="/tools" onClick={closeMenu}>{t('nav_tools')}</Link>

        <div className="mm-group-label">{t('nav_services')}</div>
        <HashLink smooth to="/services#deniz" onClick={closeMenu}>{t('srv_sea')}</HashLink>
        <HashLink smooth to="/services#hava" onClick={closeMenu}>{t('srv_air')}</HashLink>
        <HashLink smooth to="/services#demir" onClick={closeMenu}>{t('srv_rail')}</HashLink>
        <HashLink smooth to="/services#quru" onClick={closeMenu}>{t('srv_road')}</HashLink>
        <Link to="/repair" onClick={closeMenu}>{t('srv_repair')}</Link>
        <Link to="/spare-parts" onClick={closeMenu}>{t('srv_parts')}</Link>

        <Link to="/contact" onClick={closeMenu}>{t('nav_contact')}</Link>

        <div className="mm-lang">
          <button className={`${i18n.language === 'az' ? 'on' : ''}`} onClick={() => changeLanguage('az')}>AZ</button>
          <button className={`${i18n.language === 'en' ? 'on' : ''}`} onClick={() => changeLanguage('en')}>EN</button>
          <button className={`${i18n.language === 'ru' ? 'on' : ''}`} onClick={() => changeLanguage('ru')}>RU</button>
        </div>

        <div className="mm-cta">
          <HashLink smooth to="/#elaqe" className="btn btn-primary btn-block" onClick={closeMenu}>{t('nav_price')}</HashLink>
        </div>
      </aside>
    </>
  );
}
