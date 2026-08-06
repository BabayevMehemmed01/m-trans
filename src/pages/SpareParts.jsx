// =================================================================
// FAYL: src/pages/SpareParts.jsx
// TƏSVİR: Premium Dark Industrial Kataloq — Glassmorphism Filtrlər,
//         3D TiltCard Məhsul Grid, Animated Empty State
//         allParts → AdminContext-dən (default + admin məhsullar)
// =================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PartCard from '../components/PartCard';
import { useAdmin } from '../context/AdminContext';
import { useCart } from '../context/CartContext';

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
  const { allParts } = useAdmin();   // ← AdminContext: default + admin məhsullar
  const { addToCart } = useCart();

  const categoryKeys = useMemo(() => [
    'parts_all',
    ...new Set(allParts.map(p => p.catKey).filter(Boolean)),
  ], [allParts]);

  const brandList = useMemo(() => [
    'all_brands',
    ...new Set(allParts.map(p => p.brand).filter(Boolean)),
  ], [allParts]);


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

  const filteredProducts = useMemo(() => {
    return allParts.filter(p => {
      const catMatch = selectedCategory === 'parts_all' || p.catKey === selectedCategory;
      const brandMatch = selectedBrand === 'all_brands' || p.brand === selectedBrand;
      const q = searchTerm.toLowerCase();
      const nameText = p.name || t(p.nameKey) || '';
      const searchMatch = !q || nameText.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.oemCode.toLowerCase().includes(q);
      return catMatch && brandMatch && searchMatch;
    });
  }, [allParts, selectedCategory, selectedBrand, searchTerm, t]);

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
                <PartCard
                  key={product.id}
                  product={product}
                  index={index}
                  onAddToCart={() => addToCart({
                    id: product.id,
                    name: product.name || t(product.nameKey),
                    brand: product.brand,
                    sku: product.oemCode,
                    img: product.img,
                    price: product.price || '',
                    currency: product.currency || 'USD',
                  })}
                />
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
