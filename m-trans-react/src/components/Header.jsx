// =================================================================
// FAYL: src/components/Header.jsx
// TƏSVİR: RBAC Header — user/admin rol-a görə dinamik UI
//         Cart Badge + Anbardar Panel düyməsi (yalnız admin)
// =================================================================

import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, LayoutGroup } from 'framer-motion';
import { useInquiry } from '../context/InquiryContext';
import { useCart }    from '../context/CartContext';
import { useAuth }    from '../context/AuthContext';

const NAV_RING_SPRING = { type: 'spring', stiffness: 350, damping: 25 };

const CENTER_NAV = [
  { to: '/',            end: true,  key: 'nav_home' },
  { to: '/spare-parts', end: false, key: 'nav_catalog', aliases: ['/catalog'] },
  { to: '/partners',    end: false, key: 'nav_brands' },
  { to: '/about',       end: false, key: 'nav_about' },
  { to: '/vacancies',   end: false, key: 'nav_vacancies' },
];

function isCenterNavActive(pathname, item) {
  if (item.end) return pathname === item.to;
  const paths = [item.to, ...(item.aliases || [])];
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const location    = useLocation();
  const { totalItemsCount, setIsDrawerOpen } = useInquiry();
  const { totals: cartTotals, setIsCartOpen } = useCart();
  const { isAuthenticated, isAdmin, user, logout, openAuth } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const changeLanguage = lng => i18n.changeLanguage(lng);
  const closeMenu      = ()  => setMenuOpen(false);
  const cartCount      = cartTotals?.itemCount ?? 0;

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

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-lnk nav-lnk--active' : 'nav-lnk';

  const contactLinkClass = ({ isActive }) =>
    isActive ? 'nav-lnk nav-lnk--cta nav-lnk--active' : 'nav-lnk nav-lnk--cta';

  // ── Shared button base style ─────────────────────────────────
  const topBtn = (color, bg, border) => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 13px', height: '30px',
    background: bg, border: `1px solid ${border}`,
    borderRadius: '8px', color, fontSize: '0.75rem',
    fontWeight: '800', textDecoration: 'none',
    fontFamily: 'var(--f-mono)', letterSpacing: '0.3px',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  });

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          ÜST BAND
          ══════════════════════════════════════════════════════ */}
      <div className="hdr-topbar">
        <div className="hdr-topbar__inner wrap">

          {/* Sol — Əlaqə */}
          <div className="hdr-topbar__contact">
            <a href="tel:*0027" className="hdr-topbar__link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              *0027
            </a>
            <span className="hdr-topbar__sep">|</span>
            <a href="mailto:info@m-trans.az" className="hdr-topbar__link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              info@m-trans.az
            </a>
          </div>

          {/* Sağ — Dil + Auth + Cart + Sorğu */}
          <div className="hdr-topbar__right">

            {/* Dil */}
            <div className="hdr-lang">
              {['az', 'en', 'ru'].map(lng => (
                <button key={lng} onClick={() => changeLanguage(lng)}
                  className={`hdr-lang__btn ${i18n.language === lng ? 'hdr-lang__btn--on' : ''}`}>
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>

            {/* ── USER ZONE ─────────────────────────────────── */}
            {!isAuthenticated && (
              /* Giriş edilməyib */
              <button
                onClick={openAuth}
                style={topBtn('#ff8080', 'rgba(230,0,0,0.1)', 'rgba(230,0,0,0.25)')}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(230,0,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(230,0,0,0.1)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {t('auth_login_signup')}
              </button>
            )}

            {isAuthenticated && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>

                {/* İstifadəçi adı */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 11px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px' }}>
                  <span style={{ fontSize:'0.85rem' }}>{isAdmin ? '🔑' : '👤'}</span>
                  <span style={{ fontFamily:'var(--f-mono)', fontSize:'0.72rem', color: isAdmin ? '#fbbf24' : '#9aa8b6', fontWeight:'700', maxWidth:'100px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {user?.firstName || user?.displayName}
                  </span>
                  {isAdmin && (
                    <span style={{ fontSize:'0.6rem', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'4px', padding:'1px 5px', color:'#fbbf24', fontWeight:'900', letterSpacing:'0.5px', textTransform:'uppercase' }}>
                      {t('role_admin')}
                    </span>
                  )}
                </div>

                {/* Admin Panel — YALNIZ admin rolu üçün */}
                {isAdmin && (
                  <Link to="/dashboard"
                    style={topBtn('#4ade80', 'rgba(34,197,94,0.1)', 'rgba(34,197,94,0.25)')}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(34,197,94,0.22)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(34,197,94,0.1)'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    {t('nav_admin_panel')}
                  </Link>
                )}

                {/* Çıxış */}
                <button onClick={logout}
                  style={topBtn('#f87171', 'rgba(239,68,68,0.08)', 'rgba(239,68,68,0.2)')}
                  title={t('dash_logout')}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {t('dash_logout')}
                </button>
              </div>
            )}

            {/* ── 🛒 Səbət ──────────────────────────────────── */}
            <button onClick={() => setIsCartOpen(true)}
              className="hdr-inquiry-btn"
              aria-label={t('cart_title')}
              style={{ position:'relative' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className="hdr-inquiry-btn__label">{t('cart_title')}</span>
              {cartCount > 0 && (
                <span style={{
                  background:'#E60000', color:'#fff',
                  minWidth:'17px', height:'17px', borderRadius:'9px',
                  fontSize:'0.6rem', fontWeight:'900',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  padding:'0 4px', marginLeft:'2px',
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* ── Sorğu Siyahısı ────────────────────────────── */}
            <button onClick={() => setIsDrawerOpen(true)}
              className="hdr-inquiry-btn"
              aria-label={t('nav_inquiry_basket')}
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

      {/* ══════════════════════════════════════════════════════
          ƏSAS NAV
          ══════════════════════════════════════════════════════ */}
      <nav className={`hdr-nav ${scrolled ? 'hdr-nav--scrolled' : ''}`} id="nav">
        <div className="hdr-nav__inner wrap">
          <Link to="/" className="hdr-logo" aria-label="AUTRO PARTS Əsas Səhifə">
            <img src="/autro-logo.png" alt="AUTRO PARTS" className="hdr-logo__img" />
          </Link>

          <LayoutGroup id="header-center-nav">
            <motion.ul className="hdr-nav__links">
              {CENTER_NAV.map((item) => {
                const active = isCenterNavActive(location.pathname, item);
                return (
                  <li key={item.to} className="hdr-nav__item">
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={active ? 'nav-lnk nav-lnk--active' : 'nav-lnk'}
                    >
                      {active && (
                        <motion.span
                          className="nav-lnk__ring"
                          layoutId="activeNavRing"
                          transition={NAV_RING_SPRING}
                          initial={false}
                        />
                      )}
                      <span className="nav-lnk__label">{t(item.key)}</span>
                    </NavLink>
                  </li>
                );
              })}
              <li className="hdr-nav__item hdr-nav__item--cta">
                <NavLink to="/contact" className={contactLinkClass}>{t('nav_contact')}</NavLink>
              </li>
            </motion.ul>
          </LayoutGroup>

          <div className="hdr-nav__actions">
            <Link to="/contact?scroll=form" className="hdr-vin-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {t('nav_vin_search')}
            </Link>
            <button className={`hdr-burger ${menuOpen ? 'hdr-burger--open' : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menyu aç/bağla" aria-expanded={menuOpen}>
              <span/><span/><span/>
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          MOBİL MENYU
          ══════════════════════════════════════════════════════ */}
      <div className={`hdr-scrim ${menuOpen ? 'hdr-scrim--show' : ''}`} onClick={closeMenu} aria-hidden="true" />

      <aside className={`hdr-mobile-menu ${menuOpen ? 'hdr-mobile-menu--open' : ''}`} aria-hidden={!menuOpen}>
        <div className="hdr-mobile-menu__head">
          <Link to="/" onClick={closeMenu}>
            <img src="/autro-logo.png" alt="AUTRO PARTS" style={{ height:'42px', objectFit:'contain' }} />
          </Link>
          <button className="hdr-mobile-menu__close" onClick={closeMenu} aria-label="Bağla">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav className="hdr-mobile-menu__links">
          <NavLink to="/"            end className={navLinkClass} onClick={closeMenu}>{t('nav_home')}</NavLink>
          <NavLink to="/spare-parts"     className={navLinkClass} onClick={closeMenu}>{t('nav_catalog')}</NavLink>
          <NavLink to="/partners"        className={navLinkClass} onClick={closeMenu}>{t('nav_brands')}</NavLink>
          <NavLink to="/about"           className={navLinkClass} onClick={closeMenu}>{t('nav_about')}</NavLink>
          <NavLink to="/vacancies"       className={navLinkClass} onClick={closeMenu}>{t('nav_vacancies')}</NavLink>
          <NavLink to="/contact"         className={contactLinkClass} onClick={closeMenu}>{t('nav_contact')}</NavLink>
        </nav>

        <div className="hdr-mobile-menu__footer">
          <div className="hdr-lang hdr-lang--mobile">
            {['az', 'en', 'ru'].map(lng => (
              <button key={lng} onClick={() => changeLanguage(lng)}
                className={`hdr-lang__btn ${i18n.language === lng ? 'hdr-lang__btn--on' : ''}`}>
                {lng.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mobil Auth zone */}
          {!isAuthenticated && (
            <button onClick={() => { closeMenu(); openAuth(); }}
              className="hdr-mobile-menu__cta"
              style={{ background:'rgba(230,0,0,0.1)', borderColor:'rgba(230,0,0,0.25)', color:'#ff8080', marginBottom:'8px' }}>
              🔐 {t('auth_login_signup')}
            </button>
          )}

          {isAuthenticated && (
            <>
              {isAdmin && (
                <Link to="/dashboard" onClick={closeMenu}
                  style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'10px', color:'#4ade80', textDecoration:'none', fontWeight:'700', fontSize:'0.88rem', marginBottom:'8px', fontFamily:'var(--f-body)' }}>
                  📊 {t('nav_admin_panel')}
                </Link>
              )}
              <button onClick={() => { closeMenu(); logout(); }}
                className="hdr-mobile-menu__cta"
                style={{ background:'rgba(239,68,68,0.08)', borderColor:'rgba(239,68,68,0.2)', color:'#f87171', marginBottom:'8px' }}>
                ⏏ {t('dash_logout')} · {user?.firstName}
              </button>
            </>
          )}

          {/* Mobil Səbət */}
          <button onClick={() => { closeMenu(); setIsCartOpen(true); }}
            className="hdr-mobile-menu__cta"
            style={{ background:'rgba(230,0,0,0.08)', borderColor:'rgba(230,0,0,0.2)', color:'#ff8080', marginBottom:'8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {t('cart_title')} {cartCount > 0 && `(${cartCount})`}
          </button>

          {/* Mobil Sorğu */}
          <button onClick={() => { closeMenu(); setIsDrawerOpen(true); }} className="hdr-mobile-menu__cta">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
