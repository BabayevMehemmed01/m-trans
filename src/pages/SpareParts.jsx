// =================================================================
// FAYL: src/pages/SpareParts.jsx
// TƏSVİR: Premium Dark Industrial Kataloq — Glassmorphism Filtrlər,
//         3D TiltCard Məhsul Grid, Animated Empty State
// =================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PartCard from '../components/PartCard';

// ─── Tam Məhsul Bazası (12 məhsul) ──────────────────────────────
const fullProducts = [
  { id: 1,  oemCode: 'K020345',  brand: 'Knorr-Bremse', nameKey: 'part1_name', catKey: 'parts_category_brakes',       descKey: 'part1_desc', img: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=600&q=80', compatibility: 'Volvo FH, Actros MP4, Scania R' },
  { id: 2,  oemCode: 'WB911504', brand: 'WABCO',         nameKey: 'part2_name', catKey: 'parts_category_pneumatics',  descKey: 'part2_desc', img: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80', compatibility: 'MAN TGX, DAF XF, Actros' },
  { id: 3,  oemCode: 'E500KP02', brand: 'Hengst',        nameKey: 'part3_name', catKey: 'parts_category_filters',     descKey: 'part3_desc', img: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80', compatibility: 'Volvo FH16, Scania Streamline' },
  { id: 4,  oemCode: 'VL214589', brand: 'Volvo OEM',     nameKey: 'part4_name', catKey: 'parts_category_electronics', descKey: 'part4_desc', img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80', compatibility: 'Volvo FH4, Volvo FM' },
  { id: 5,  oemCode: 'SA315480', brand: 'Sachs',         nameKey: 'part5_name', catKey: 'parts_category_suspension',  descKey: 'part5_desc', img: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80', compatibility: 'Mercedes Actros, DAF 105' },
  { id: 6,  oemCode: 'BS020147', brand: 'Bosch',         nameKey: 'part6_name', catKey: 'parts_category_transmission',descKey: 'part6_desc', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80', compatibility: 'MAN TGA, Scania P-series' },
  { id: 7,  oemCode: 'H300W01',  brand: 'Hengst',        nameKey: 'part7_name', catKey: 'parts_category_filters',     descKey: 'part7_desc', img: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80', compatibility: 'Mercedes Actros MP5, DAF XF' },
  { id: 8,  oemCode: 'MB004541', brand: 'Mercedes OEM',  nameKey: 'part8_name', catKey: 'parts_category_electronics', descKey: 'part8_desc', img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80', compatibility: 'Mercedes Actros MP4' },
  { id: 9,  oemCode: 'K048122',  brand: 'Knorr-Bremse', nameKey: 'part1_name', catKey: 'parts_category_brakes',       descKey: 'part1_desc', img: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=600&q=80', compatibility: 'MAN TGX, Volvo FM' },
  { id: 10, oemCode: 'WB472195', brand: 'WABCO',         nameKey: 'part2_name', catKey: 'parts_category_pneumatics',  descKey: 'part2_desc', img: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80', compatibility: 'Scania R450, DAF XF106' },
  { id: 11, oemCode: 'SA290123', brand: 'Sachs',         nameKey: 'part5_name', catKey: 'parts_category_suspension',  descKey: 'part5_desc', img: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80', compatibility: 'Volvo FH13, Renault T-Range' },
  { id: 12, oemCode: 'CAT09845', brand: 'CAT OEM',       nameKey: 'part6_name', catKey: 'parts_category_engine',      descKey: 'part6_desc', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80', compatibility: 'Caterpillar Heavy Machinery' },
];

const categoryKeys = ['parts_all', ...new Set(fullProducts.map(p => p.catKey))];
const brandList    = ['all_brands', ...new Set(fullProducts.map(p => p.brand))];

// ─── Styled Select ───────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px', fontFamily: 'var(--f-mono)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: '100%', height: '44px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px', color: '#e2e8f0',
          padding: '0 14px', fontSize: '0.88rem',
          fontFamily: 'var(--f-body)', cursor: 'pointer',
          outline: 'none', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a8d' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
        }}
      >
        {options}
      </select>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
export default function SpareParts() {
  const { t } = useTranslation();
  const location = useLocation();

  const [searchTerm,       setSearchTerm]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState('parts_all');
  const [selectedBrand,    setSelectedBrand]    = useState('all_brands');
  const searchRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sp = params.get('search');
    const cp = params.get('cat');
    if (sp) setSearchTerm(sp);
    if (cp) setSelectedCategory(cp);
    if (sp && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, [location.search]);

  const filteredProducts = fullProducts.filter(product => {
    const name   = t(product.nameKey).toLowerCase();
    const oem    = (product.oemCode || '').toLowerCase();
    const term   = searchTerm.toLowerCase();
    const matchS = !term || name.includes(term) || oem.includes(term);
    const matchC = selectedCategory === 'parts_all' || product.catKey === selectedCategory;
    const matchB = selectedBrand    === 'all_brands' || product.brand === selectedBrand;
    return matchS && matchC && matchB;
  });

  const hasFilters = searchTerm || selectedCategory !== 'parts_all' || selectedBrand !== 'all_brands';
  const resetFilters = () => { setSearchTerm(''); setSelectedCategory('parts_all'); setSelectedBrand('all_brands'); };

  return (
    <main>

      {/* ════════════════════════════════════════════════
          HERO — Dark Industrial
          ════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #05080f 0%, #0f1827 60%, #070a12 100%)',
        color: '#fff', textAlign: 'center', padding: '70px 0 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* dot bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.6 }} />
        {/* red glow */}
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(230,0,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', fontWeight: '800', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '2.5px' }}>
            {t('parts_hero_eyebrow')}
          </span>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: '900', margin: '14px 0 18px', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
            {t('parts_hero_title')}
          </h1>
          <p style={{ color: '#7a8ea8', maxWidth: '680px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
            {t('parts_hero_desc')}
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FILTER + GRID
          ════════════════════════════════════════════════ */}
      <section style={{ background: '#0d1117', minHeight: '60vh', padding: '40px 0 100px' }}>
        <div className="wrap">

          {/* ── Glassmorphism Filter Panel ───────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '30px',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '18px',
            alignItems: 'end',
          }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px', fontFamily: 'var(--f-mono)' }}>
                🔍 {t('catalog_search_label')}
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={t('parts_search_placeholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', height: '44px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', color: '#fff',
                    paddingLeft: '42px', paddingRight: '14px',
                    fontSize: '0.9rem', fontFamily: 'var(--f-body)',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e  => { e.target.style.borderColor = 'rgba(230,0,0,0.5)'; }}
                  onBlur={e   => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
              </div>
            </div>

            {/* Category */}
            <FilterSelect
              label={`📁 ${t('catalog_filter_category')}`}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              options={categoryKeys.map(k => (
                <option key={k} value={k} style={{ background: '#111' }}>
                  {k === 'parts_all' ? t('parts_all_categories') : t(k)}
                </option>
              ))}
            />

            {/* Brand */}
            <FilterSelect
              label={`🏷️ ${t('catalog_filter_brand')}`}
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              options={brandList.map(b => (
                <option key={b} value={b} style={{ background: '#111' }}>
                  {b === 'all_brands' ? t('parts_all_brands') : b}
                </option>
              ))}
            />
          </div>

          {/* ── Results bar ──────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.85rem', color: '#4e6074' }}>
              {t('catalog_found_count')}:&nbsp;
              <strong style={{ color: '#e2e8f0' }}>{filteredProducts.length}</strong>
            </span>
            {hasFilters && (
              <button
                onClick={resetFilters}
                style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'background 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                ✕ {t('parts_reset')}
              </button>
            )}
          </div>

          {/* ── Products Grid ─────────────────────────────── */}
          {filteredProducts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '26px' }}>
              {filteredProducts.map((product, index) => (
                <PartCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div style={{ textAlign: 'center', padding: '90px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px', opacity: 0.4 }}>🔍</div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', color: '#e2e8f0', marginBottom: '10px', fontWeight: '700' }}>
                {t('parts_not_found')}
              </h3>
              <p style={{ color: '#4e6074', maxWidth: '480px', margin: '0 auto 28px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {t('parts_not_found_desc')}
              </p>
              <button
                onClick={resetFilters}
                style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--f-body)' }}
              >
                {t('parts_reset')}
              </button>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
