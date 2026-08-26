// =================================================================
// FAYL: src/pages/Home.jsx
// TƏSVİR: Premium Dark Industrial Home — Mouse Parallax Hero,
//         Animated Stats, Glassmorphism Category Cards, 3D Parts Grid
// =================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PartCard from '../components/PartCard';
import { useInquiry } from '../context/InquiryContext';

// ─── Məhsul Nümunələri ───────────────────────────────────────────
const sampleProducts = [
  { id: 1, oemCode: 'K020345', brand: 'Knorr-Bremse', nameKey: 'part1_name', catKey: 'parts_category_brakes',      descKey: 'part1_desc', img: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=600&q=80', compatibility: 'Volvo FH, Actros MP4, Scania R' },
  { id: 2, oemCode: 'WB911504', brand: 'WABCO',        nameKey: 'part2_name', catKey: 'parts_category_pneumatics', descKey: 'part2_desc', img: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80', compatibility: 'MAN TGX, DAF XF, Actros' },
  { id: 3, oemCode: 'E500KP02', brand: 'Hengst',       nameKey: 'part3_name', catKey: 'parts_category_filters',    descKey: 'part3_desc', img: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80', compatibility: 'Volvo FH16, Scania Streamline' },
  { id: 4, oemCode: 'VL214589', brand: 'Volvo OEM',    nameKey: 'part4_name', catKey: 'parts_category_electronics',descKey: 'part4_desc', img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80', compatibility: 'Volvo FH4, Volvo FM' },
  { id: 5, oemCode: 'SA315480', brand: 'Sachs',        nameKey: 'part5_name', catKey: 'parts_category_suspension', descKey: 'part5_desc', img: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80', compatibility: 'Mercedes Actros, DAF 105' },
  { id: 6, oemCode: 'BS020147', brand: 'Bosch',        nameKey: 'part6_name', catKey: 'parts_category_transmission',descKey: 'part6_desc', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80', compatibility: 'MAN TGA, Scania P-series' }
];

// ─── Animated Counter Hook ───────────────────────────────────────
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ─── Stats Item ──────────────────────────────────────────────────
function StatItem({ value, suffix = '', label, color = '#E60000', started }) {
  const count = useCountUp(value, 1600, started);
  return (
    <div style={{ textAlign: 'center', padding: '0 10px' }}>
      <div style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '900', color, fontFamily: 'var(--f-display)', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '0.85rem', color: '#8a9bb0', marginTop: '6px', fontWeight: '500' }}>{label}</div>
    </div>
  );
}

// ─── Category Card ───────────────────────────────────────────────
const CATEGORIES = [
  { titleKey: 'parts_category_brakes',       icon: '🛑', count: '1,200+', color: '#E60000' },
  { titleKey: 'parts_category_pneumatics',   icon: '💨', count: '850+',   color: '#3B82F6' },
  { titleKey: 'parts_category_filters',      icon: '🌀', count: '3,400+', color: '#10B981' },
  { titleKey: 'parts_category_electronics',  icon: '⚡', count: '960+',   color: '#F59E0B' },
  { titleKey: 'parts_category_suspension',   icon: '🔩', count: '1,500+', color: '#8B5CF6' },
  { titleKey: 'parts_category_transmission', icon: '⚙️', count: '740+',   color: '#EC4899' },
  { titleKey: 'parts_category_engine',       icon: '🚜', count: '2,100+', color: '#14B8A6' },
  { titleKey: 'parts_category_body',         icon: '🚛', count: '630+',   color: '#6366F1' },
];

const BRANDS = ['Knorr-Bremse','WABCO','Hengst','Sachs','Bosch','Volvo','Mercedes','Scania','MAN','CAT'];

// ════════════════════════════════════════════════════════════════
export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setVinNumber } = useInquiry();

  const [heroSearch, setHeroSearch] = useState('');
  const [heroVin, setHeroVin]       = useState('');
  const [statsStarted, setStatsStarted] = useState(false);

  // Mouse parallax state
  const heroRef   = useRef(null);
  const layer1Ref = useRef(null);
  const layer2Ref = useRef(null);
  const rafRef    = useRef(null);

  // Stat counter trigger on scroll
  const statsRef = useRef(null);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStatsStarted(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Hero mouse parallax
  const handleHeroMouseMove = useCallback((e) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (e.clientX - rect.left - cx) / cx;
      const dy = (e.clientY - rect.top  - cy) / cy;
      if (layer1Ref.current) layer1Ref.current.style.transform = `translate(${dx * 18}px, ${dy * 12}px)`;
      if (layer2Ref.current) layer2Ref.current.style.transform = `translate(${dx * -10}px, ${dy * -7}px)`;
    });
  }, []);

  const handleHeroMouseLeave = useCallback(() => {
    if (layer1Ref.current) layer1Ref.current.style.transform = 'translate(0,0)';
    if (layer2Ref.current) layer2Ref.current.style.transform = 'translate(0,0)';
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) navigate(`/spare-parts?search=${encodeURIComponent(heroSearch.trim())}`);
  };

  const handleVinSubmit = (e) => {
    e.preventDefault();
    if (heroVin.trim()) {
      setVinNumber(heroVin.trim().toUpperCase());
      navigate(`/contact?vin=${encodeURIComponent(heroVin.trim().toUpperCase())}`);
    }
  };

  return (
    <main>

      {/* ════════════════════════════════════════════════
          1. HERO — Dark Industrial + Mouse Parallax
          ════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #05080f 0%, #0f1827 45%, #0b1020 100%)',
          color: '#fff',
        }}
      >
        {/* Parallax Layer 1 — dot grid */}
        <div
          ref={layer1Ref}
          className="hero-parallax-layer"
          style={{
            position: 'absolute', inset: '-10%',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            transition: 'transform 0.12s ease-out',
          }}
        />

        {/* Parallax Layer 2 — red glow orb */}
        <div
          ref={layer2Ref}
          className="hero-parallax-layer"
          style={{
            position: 'absolute',
            width: '600px', height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,0,0,0.12) 0%, transparent 70%)',
            top: '-80px', right: '-100px',
            transition: 'transform 0.18s ease-out',
          }}
        />

        {/* Accent lines */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--red), transparent)', opacity: 0.5 }} />

        {/* ── Modern autroparts cargo rig (LTR, professional) ── */}
        <div className="hero-logistics" aria-hidden="true">
          <div className="hero-logistics__haze" />
          <div className="hero-logistics__conveyor">
            <span className="hero-pkg hero-pkg--a" />
            <span className="hero-pkg hero-pkg--b" />
            <span className="hero-pkg hero-pkg--c" />
          </div>
          <div className="hero-logistics__road">
            <div className="hero-logistics__lane" />
          </div>
          <div className="hero-logistics__rig">
            <svg className="hero-logistics__svg" viewBox="0 0 540 168" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="apTrailer" x1="20" y1="30" x2="20" y2="128" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1c2a48"/>
                  <stop offset="100%" stopColor="#0d1528"/>
                </linearGradient>
                <linearGradient id="apCab" x1="338" y1="28" x2="338" y2="132" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#243656"/>
                  <stop offset="100%" stopColor="#121c32"/>
                </linearGradient>
                <linearGradient id="apGlass" x1="360" y1="42" x2="430" y2="88" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#9fd4f0" stopOpacity="0.55"/>
                  <stop offset="100%" stopColor="#3a6a88" stopOpacity="0.28"/>
                </linearGradient>
                <linearGradient id="apBeam" x1="508" y1="78" x2="538" y2="78" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fff3c4" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#fff3c4" stopOpacity="0"/>
                </linearGradient>
              </defs>

              <ellipse cx="262" cy="154" rx="210" ry="9" fill="#000" opacity="0.38"/>

              {/* Trailer */}
              <rect x="18" y="38" width="318" height="86" rx="10" fill="url(#apTrailer)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>
              <rect x="18" y="38" width="318" height="11" rx="5" fill="#FF6B1A"/>
              <rect x="18" y="108" width="318" height="5" fill="#FF6B1A" opacity="0.85"/>
              <rect x="34" y="58" width="286" height="42" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)"/>
              <rect x="22" y="78" width="8" height="18" rx="1" fill="#E60000" opacity="0.85"/>
              <rect x="22" y="78" width="8" height="7" rx="1" fill="#FFB020"/>

              {/* Cab */}
              <path d="M342 52 L342 124 L508 124 C512 124 516 120 516 116 L516 78 C516 54 496 40 470 40 L392 40 C368 40 342 44 342 52Z" fill="url(#apCab)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2"/>
              <path d="M368 48 L478 48 C494 48 506 58 506 74 L506 86 C506 90 502 92 498 92 L372 92 C364 92 360 88 360 82 L360 56 C360 50 364 48 368 48Z" fill="url(#apGlass)"/>
              <rect x="352" y="98" width="148" height="4" rx="2" fill="#FF6B1A" opacity="0.9"/>
              <rect x="508" y="72" width="8" height="14" rx="2" fill="#FFF4C2"/>
              <rect x="508" y="90" width="8" height="10" rx="2" fill="#FFF4C2" opacity="0.7"/>
              <polygon points="516,74 540,58 540,112 516,100" fill="url(#apBeam)"/>
              <rect x="478" y="54" width="6" height="28" rx="2" fill="rgba(8,12,22,0.45)"/>
              <path d="M516 58 L528 50 L528 62 L516 66Z" fill="#1a2438" stroke="rgba(255,255,255,0.15)"/>

              {/* Chassis */}
              <rect x="40" y="124" width="456" height="6" rx="2" fill="#0a101c"/>

              {/* Wheels */}
              <g className="ap-wheel">
                <circle cx="78" cy="136" r="16" fill="#121820" stroke="#3a4658" strokeWidth="3"/>
                <circle cx="78" cy="136" r="6" fill="#FF6B1A"/>
                <path d="M78 124 V132 M78 140 V148 M66 136 H74 M82 136 H90" stroke="#6b7788" strokeWidth="1.6"/>
              </g>
              <g className="ap-wheel">
                <circle cx="132" cy="136" r="16" fill="#121820" stroke="#3a4658" strokeWidth="3"/>
                <circle cx="132" cy="136" r="6" fill="#FF6B1A"/>
                <path d="M132 124 V132 M132 140 V148 M120 136 H128 M136 136 H144" stroke="#6b7788" strokeWidth="1.6"/>
              </g>
              <g className="ap-wheel">
                <circle cx="248" cy="136" r="16" fill="#121820" stroke="#3a4658" strokeWidth="3"/>
                <circle cx="248" cy="136" r="6" fill="#FF6B1A"/>
                <path d="M248 124 V132 M248 140 V148 M236 136 H244 M252 136 H260" stroke="#6b7788" strokeWidth="1.6"/>
              </g>
              <g className="ap-wheel">
                <circle cx="430" cy="136" r="16" fill="#121820" stroke="#3a4658" strokeWidth="3"/>
                <circle cx="430" cy="136" r="6" fill="#FF6B1A"/>
                <path d="M430 124 V132 M430 140 V148 M418 136 H426 M434 136 H442" stroke="#6b7788" strokeWidth="1.6"/>
              </g>
              <g className="ap-wheel">
                <circle cx="478" cy="136" r="16" fill="#121820" stroke="#3a4658" strokeWidth="3"/>
                <circle cx="478" cy="136" r="6" fill="#FF6B1A"/>
                <path d="M478 124 V132 M478 140 V148 M466 136 H474 M482 136 H490" stroke="#6b7788" strokeWidth="1.6"/>
              </g>
            </svg>
            <span className="hero-logistics__brand">autroparts</span>
          </div>
        </div>


        <div className="wrap" style={{ position: 'relative', zIndex: 2, paddingTop: '60px', paddingBottom: '150px' }}>
          <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>

            {/* Badge */}
            <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(230,0,0,0.1)', border: '1px solid rgba(230,0,0,0.25)', padding: '6px 18px', borderRadius: '30px', marginBottom: '28px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ color: 'var(--red)', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1.5px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase' }}>
                {t('home_hero_badge')}
              </span>
            </div>

            {/* Title */}
            <h1 className="hero-title" style={{
              fontSize: 'clamp(2.6rem, 7vw, 5rem)',
              fontWeight: '900',
              lineHeight: '1.05',
              fontFamily: 'var(--f-display)',
              margin: '0 0 24px',
              letterSpacing: '-0.03em',
            }}>
              {t('home_hero_t1') && <>{t('home_hero_t1')}{' '}</>}
              <span style={{
                background: 'linear-gradient(135deg, #FF5E1A 0%, #FF9500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
                position: 'relative',
              }}>
                {t('home_hero_t2')}
                <span style={{ position:'absolute', bottom:'-6px', left:0, right:0, height:'4px', background:'linear-gradient(90deg, #FF5E1A, #FF9500)', borderRadius:'2px', opacity:0.7 }} />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle" style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#7a8ea8', margin: '0 auto 40px', maxWidth: '680px', lineHeight: '1.65' }}>
              {t('home_hero_desc')}
            </p>

            {/* ── Search Box ──────────────────────────────── */}
            <div className="hero-searchbox" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              padding: '12px',
              marginBottom: '24px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flexGrow: 1, position: 'relative', minWidth: '240px' }}>
                  <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={e => setHeroSearch(e.target.value)}
                    placeholder={t('home_search_placeholder')}
                    style={{
                      width: '100%', height: '52px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                      color: '#fff', paddingLeft: '46px', paddingRight: '16px',
                      fontSize: '1rem', fontFamily: 'var(--f-body)', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '52px', padding: '0 30px', fontWeight: '800', fontSize: '0.9rem', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                  🔍 {t('btn_search_parts')}
                </button>
              </form>
            </div>

            {/* VIN Quick Check */}
            <form className="hero-vin-bar" onSubmit={handleVinSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '10px 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#7a8ea8' }}>🚘 {t('home_vin_quick_label')}:</span>
              <input
                type="text"
                placeholder="e.g. YV2A4CF…"
                value={heroVin}
                onChange={e => setHeroVin(e.target.value)}
                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(230,0,0,0.5)', color: '#fff', fontSize: '0.85rem', fontFamily: 'var(--f-mono)', padding: '2px 6px', textTransform: 'uppercase', outline: 'none', width: '160px' }}
              />
              <button type="submit" style={{ background: 'var(--red)', border: 'none', color: '#fff', padding: '5px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '800', fontFamily: 'var(--f-body)' }}>
                {t('btn_check')}
              </button>
            </form>

          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-indicator" style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: 0.45 }}>
          <span style={{ fontSize: '0.68rem', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--f-mono)' }}>scroll</span>
          <div style={{ width: '1px', height: '36px', background: 'linear-gradient(to bottom, #fff, transparent)' }} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          2. ANIMATED STATS BAR — Dark
          ════════════════════════════════════════════════ */}
      <section ref={statsRef} style={{ background: '#0b0e15', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '48px 0' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '30px', alignItems: 'center' }} className="stagger-children">
            <StatItem value={50000}  suffix="+"  label={t('stat_parts_in_stock')}   color="#E60000" started={statsStarted} />
            <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.07)', margin: '0 auto' }} />
            <StatItem value={100}    suffix="%"  label={t('stat_oem_guarantee')}    color="#fff" started={statsStarted} />
            <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.07)', margin: '0 auto' }} />
            <StatItem value={15}     suffix="+"  label={t('stat_e')}                color="#fff" started={statsStarted} />
            <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.07)', margin: '0 auto' }} />
            <StatItem value={24}     suffix="/7" label={t('stat_express_delivery')} color="#fff" started={statsStarted} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          3. CATEGORY GRID — Glassmorphism on Dark
          ════════════════════════════════════════════════ */}
      <section style={{ background: '#090d13', padding: '90px 0' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '55px' }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', fontWeight: '700', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t('parts_hero_eyebrow')}</span>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: '900', color: '#fff', margin: '12px 0 14px', letterSpacing: '-0.02em' }}>
              {t('home_categories_title')}
            </h2>
            <p style={{ color: '#5e748a', maxWidth: '540px', margin: '0 auto', fontSize: '1rem' }}>{t('home_categories_desc')}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }} className="stagger-children">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => navigate('/spare-parts')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '28px 22px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = `${cat.color}40`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 35px rgba(0,0,0,0.3), 0 0 0 1px ${cat.color}25`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>{cat.icon}</div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '6px' }}>
                  {t(cat.titleKey)}
                </h3>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', color: cat.color, fontWeight: '700' }}>
                  {cat.count} {t('home_parts_available')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          4. FEATURED PRODUCTS — 3D TiltCard Grid
          ════════════════════════════════════════════════ */}
      <section style={{ background: '#f4f6fa', padding: '90px 0' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', fontWeight: '700', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t('parts_hero_eyebrow')}</span>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: '900', color: 'var(--navy)', margin: '10px 0 0', letterSpacing: '-0.02em' }}>
                {t('home_popular_parts_title')}
              </h2>
            </div>
            <Link to="/spare-parts" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', border: '1.5px solid var(--navy)', borderRadius: '10px', color: 'var(--navy)', textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--navy)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--navy)'; }}
            >
              {t('btn_view_all_catalog')} →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px' }}>
            {sampleProducts.map((prod, idx) => (
              <PartCard key={prod.id} product={prod} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          5. BRANDS MARQUEE — Dark Industrial
          ════════════════════════════════════════════════ */}
      <section style={{ background: '#0a0d12', padding: '70px 0', overflow: 'hidden' }}>
        <div className="wrap" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', fontWeight: '700', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t('home_brands_eyebrow')}</span>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: '900', color: '#fff', margin: '12px 0 0', letterSpacing: '-0.02em' }}>
            {t('home_brands_title')}
          </h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '14px', padding: '0 20px' }}>
          {BRANDS.map((brand, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '12px 24px',
              fontFamily: 'var(--f-display)',
              fontWeight: '800',
              fontSize: '0.95rem',
              color: '#8a9bb0',
              letterSpacing: '0.3px',
              transition: 'all 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(230,0,0,0.3)'; e.currentTarget.style.background = 'rgba(230,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#8a9bb0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              {brand}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          6. VIN CTA BANNER — Premium
          ════════════════════════════════════════════════ */}
      <section style={{ background: '#f4f6fa', padding: '90px 0' }}>
        <div className="wrap">
          <div style={{
            background: 'linear-gradient(135deg, #0f1827 0%, #0b0f19 100%)',
            borderRadius: '28px',
            padding: 'clamp(40px, 6vw, 70px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '50px',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* BG accent */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,0,0,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', fontWeight: '700', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '2px' }}>VIN CODE INQUIRY</span>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: '900', color: '#fff', margin: '14px 0 16px', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                {t('home_vin_cta_title')}
              </h2>
              <p style={{ color: '#7a8ea8', fontSize: '0.97rem', lineHeight: '1.65', marginBottom: '28px' }}>
                {t('home_vin_cta_desc')}
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link to="/contact" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '0.9rem' }}>
                  🚘 {t('btn_submit_vin_request')}
                </Link>
                <a href="https://wa.me/994500000000" target="_blank" rel="noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 28px', borderRadius: '10px', border: '1px solid #22c55e',
                  color: '#22c55e', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#22c55e'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#22c55e'; }}
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '18px', padding: '32px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }}>
              <h4 style={{ fontFamily: 'var(--f-display)', fontSize: '1.05rem', fontWeight: '800', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛡️ {t('home_guarantee_title')}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[t('home_g1'), t('home_g2'), t('home_g3'), t('home_g4')].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#8a9bb0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    <span style={{ color: 'var(--red)', fontWeight: '900', flexShrink: 0, marginTop: '1px' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </main>
  );
}