// =================================================================
// FAYL: src/components/AnimatedNavbar.jsx
// TƏSVİR: Aşağıda dayanan glassmorphism naviqasiya paneli.
//         Aktiv tabın qırmızı fonu layoutId + spring ilə sürüşür.
// =================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bookmark, Home, Inbox, Plus, Search } from 'lucide-react';
import { useInquiry } from '../context/InquiryContext';
import './AnimatedNavbar.css';

const ADMIN_PREFIXES = ['/dashboard', '/inventory', '/admin', '/admin-login'];

const TABS = [
  { id: 'home',   icon: Home,     path: '/',            labelKey: 'anav_home' },
  { id: 'search', icon: Search,   path: '/spare-parts', labelKey: 'anav_search' },
  { id: 'create', icon: Plus,     path: '/contact',     labelKey: 'anav_create' },
  { id: 'inbox',  icon: Inbox,    action: 'inbox',      labelKey: 'anav_inbox' },
  { id: 'saved',  icon: Bookmark, action: 'saved',      labelKey: 'anav_saved' },
];

const spring = { type: 'spring', stiffness: 420, damping: 28, mass: 0.72 };

function tabFromPath(pathname) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/spare-parts') || pathname.startsWith('/catalog')) return 'search';
  if (pathname.startsWith('/contact')) return 'create';
  return null;
}

export default function AnimatedNavbar({ onInbox, onSaved }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItemsCount, setIsDrawerOpen } = useInquiry();

  const routeTab = useMemo(() => tabFromPath(location.pathname), [location.pathname]);
  const [overlayTab, setOverlayTab] = useState(null);

  const isAdminUi = ADMIN_PREFIXES.some((p) => location.pathname.startsWith(p));
  const activeId = overlayTab ?? routeTab;

  useEffect(() => {
    setOverlayTab(null);
  }, [location.pathname]);

  useEffect(() => {
    if (isAdminUi) return undefined;
    document.body.classList.add('has-animated-nav');
    document.documentElement.style.setProperty('--anav-offset', '96px');
    return () => {
      document.body.classList.remove('has-animated-nav');
      document.documentElement.style.removeProperty('--anav-offset');
    };
  }, [isAdminUi]);

  if (isAdminUi) return null;

  const handleTab = (tab) => {
    if (tab.action === 'inbox') {
      setOverlayTab('inbox');
      if (onInbox) onInbox();
      else window.dispatchEvent(new CustomEvent('mtrans-open-chat'));
      return;
    }
    if (tab.action === 'saved') {
      setOverlayTab('saved');
      if (onSaved) onSaved();
      else setIsDrawerOpen(true);
      return;
    }
    setOverlayTab(null);
    navigate(tab.path);
  };

  return (
    <nav className="anav-root" aria-label={t('anav_aria', 'Əsas naviqasiya')}>
      <ul className="anav-list">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeId === tab.id;
          const badge = tab.id === 'saved' && totalItemsCount > 0 ? totalItemsCount : null;

          return (
            <li key={tab.id} style={{ flex: 1, display: 'flex' }}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                aria-label={t(tab.labelKey)}
                className={`anav-tab${isActive ? ' is-active' : ''}`}
                onClick={() => handleTab(tab)}
              >
                {isActive && (
                  <motion.span
                    layoutId="anav-active-pill"
                    className="anav-pill"
                    transition={spring}
                  />
                )}

                <motion.span
                  className="anav-body"
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    y: isActive ? -1 : 0,
                    opacity: isActive ? 1 : 0.72,
                  }}
                  transition={spring}
                >
                  <span className="anav-icon-wrap">
                    <Icon
                      size={isActive ? 22 : 20}
                      strokeWidth={isActive ? 2.4 : 1.8}
                      absoluteStrokeWidth
                    />
                    {badge != null && (
                      <span className="anav-badge">{badge > 9 ? '9+' : badge}</span>
                    )}
                  </span>
                  <span className="anav-label">{t(tab.labelKey)}</span>
                </motion.span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
