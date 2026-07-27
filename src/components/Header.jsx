// =================================================================
// FAYL: src/components/Header.jsx
// TƏSVİR: Premium Dark Industrial Header — NavLink aktiv state,
//         Glassmorphism, Tam Responsive
// =================================================================

import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInquiry } from '../context/InquiryContext';

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { totalItemsCount, setIsDrawerOpen } = useInquiry();

  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  const changeLanguage = (lng) => i18n.changeLanguage(lng);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // NavLink aktiv class — yalnız tam path uyğun gəldikdə
  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-lnk nav-lnk--active' : 'nav-lnk';

  return (
    <>
      {/* ═══════════════════════════════════════════════
          ÜST BAND — Email, Telefon, Dil, Sorğu
          ═══════════════════════════════════════════════ */}
      <div className="hdr-topbar">
        <div className="hdr-topbar__inner wrap">

          {/* Sol — Əlaqə məlumatları */}
          <div className="hdr-topbar__contact">
            <a href="tel:*0027" className="hdr-topbar__link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              *0027
            </a>
            <span className="hdr-topbar__sep">|</span>
            <a href="mailto:info@m-trans.az" className="hdr-topbar__link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              info@m-trans.az
            </a>
          </div>

          {/* Sağ — Dil + Sorğu Siyahısı */}
          <div className="hdr-topbar__right">
            {/* Dil seçimi */}
            <div className="hdr-lang">
              {['az', 'en', 'ru'].map((lng) => (
                <button
                  key={lng}
                  onClick={() => changeLanguage(lng)}
                  className={`hdr-lang__btn ${i18n.language === lng ? 'hdr-lang__btn--on' : ''}`}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Sorğu Siyahısı */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="hdr-inquiry-btn"
              aria-label="Sorğu Siyahısı"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span className="hdr-inquiry-btn__label">{t('nav_inquiry_basket')}</span>
              {totalItemsCount > 0 && (
                <span className="hdr-inquiry-btn__badge">{totalItemsCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          ƏSAS NAV BAR — Logo + Linklər + VIN CTA
          ═══════════════════════════════════════════════ */}
      <nav className={`hdr-nav ${scrolled ? 'hdr-nav--scrolled' : ''}`} id="nav">
        <div className="hdr-nav__inner wrap">

          {/* Logo */}
          <Link to="/" className="hdr-logo" aria-label="M-Trans Əsas Səhifə">
            <img
              src="/M-Trans_logo_dark_site.png"
              alt="M-Trans Spare Parts"
              className="hdr-logo__img"
            />
          </Link>

          {/* Desktop Nav Linklər */}
          <div className="hdr-nav__links" role="navigation">
            <NavLink to="/" end className={navLinkClass}>{t('nav_home')}</NavLink>
            <NavLink to="/spare-parts" className={navLinkClass}>{t('nav_catalog')}</NavLink>
            <NavLink to="/partners"    className={navLinkClass}>{t('nav_brands')}</NavLink>
            <NavLink to="/about"       className={navLinkClass}>{t('nav_about')}</NavLink>
            <NavLink to="/vacancies"   className={navLinkClass}>{t('nav_vacancies')}</NavLink>
            <NavLink to="/contact"     className={navLinkClass}>{t('nav_contact')}</NavLink>
          </div>

          {/* VIN CTA + Burger */}
          <div className="hdr-nav__actions">
            <Link to="/contact?scroll=form" className="hdr-vin-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {t('nav_vin_search')}
            </Link>

            <button
              className={`hdr-burger ${menuOpen ? 'hdr-burger--open' : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menyu aç/bağla"
              aria-expanded={menuOpen}
            >
              <span/><span/><span/>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          MOBİL MENYU
          ═══════════════════════════════════════════════ */}
      <div
        className={`hdr-scrim ${menuOpen ? 'hdr-scrim--show' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside className={`hdr-mobile-menu ${menuOpen ? 'hdr-mobile-menu--open' : ''}`} aria-hidden={!menuOpen}>
        <div className="hdr-mobile-menu__head">
          <Link to="/" onClick={closeMenu}>
            <img src="/M-Trans_logo_dark_site.png" alt="M-Trans" style={{ height: '34px' }} />
          </Link>
          <button className="hdr-mobile-menu__close" onClick={closeMenu} aria-label="Bağla">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav className="hdr-mobile-menu__links">
          <NavLink to="/"           end className={navLinkClass} onClick={closeMenu}>{t('nav_home')}</NavLink>
          <NavLink to="/spare-parts"    className={navLinkClass} onClick={closeMenu}>{t('nav_catalog')}</NavLink>
          <NavLink to="/partners"       className={navLinkClass} onClick={closeMenu}>{t('nav_brands')}</NavLink>
          <NavLink to="/about"          className={navLinkClass} onClick={closeMenu}>{t('nav_about')}</NavLink>
          <NavLink to="/vacancies"      className={navLinkClass} onClick={closeMenu}>{t('nav_vacancies')}</NavLink>
          <NavLink to="/contact"        className={navLinkClass} onClick={closeMenu}>{t('nav_contact')}</NavLink>
        </nav>

        <div className="hdr-mobile-menu__footer">
          {/* Dil */}
          <div className="hdr-lang hdr-lang--mobile">
            {['az', 'en', 'ru'].map((lng) => (
              <button
                key={lng}
                onClick={() => changeLanguage(lng)}
                className={`hdr-lang__btn ${i18n.language === lng ? 'hdr-lang__btn--on' : ''}`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Sorğu CTA */}
          <button
            onClick={() => { closeMenu(); setIsDrawerOpen(true); }}
            className="hdr-mobile-menu__cta"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {t('nav_inquiry_basket')} {totalItemsCount > 0 && `(${totalItemsCount})`}
          </button>
        </div>
      </aside>
    </>
  );
}
