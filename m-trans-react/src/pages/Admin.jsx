// =================================================================
// FAYL: src/pages/Admin.jsx
// TƏSVİR: Anbardar Paneli — Giriş, Detal İdarəetməsi, Promokod
// =================================================================

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../context/AdminContext';

// ── Rəng sabitləri ───────────────────────────────────────────────
const R = '#E60000';
const NAV = '#0d1117';
const CARD = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.08)';

// ── Yardımçı: Input komponenti ───────────────────────────────────
function Field({ label, name, value, onChange, type = 'text', placeholder = '', required = false, as = 'input', options = [] }) {
  const base = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: '#e2e8f0',
    padding: '10px 14px', fontSize: '0.88rem',
    fontFamily: 'var(--f-body)', outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '7px', fontFamily: 'var(--f-mono)' }}>
        {label}{required && ' *'}
      </label>
      {as === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3}
          style={{ ...base, resize: 'vertical' }}
          onFocus={e => e.target.style.borderColor = `${R}60`}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      ) : as === 'select' ? (
        <select name={name} value={value} onChange={onChange}
          style={{ ...base, height: '42px', appearance: 'none', cursor: 'pointer' }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          style={{ ...base, height: '42px' }}
          onFocus={e => e.target.style.borderColor = `${R}60`}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      )}
    </div>
  );
}

// ── Default form state ───────────────────────────────────────────
const EMPTY_PART = {
  name: '', category: 'Əyləclər', brand: '', sku: '',
  price: '', currency: 'USD', stock: 'in_stock', stockQty: '',
  img: '', description: '', specs: '', compatibility: '',
};

const EMPTY_PROMO = { code: '', discount: '', type: 'percent', active: true };

const CATS = ['Əyləclər', 'Pnevmatika', 'Filtrlər', 'Elektronika', 'Asma sistemi', 'Transmissiya', 'Mühərrik', 'Digər'];

// ════════════════════════════════════════════════════════════════
//  ADMIN PAGE
// ════════════════════════════════════════════════════════════════
export default function Admin() {
  const { t } = useTranslation();
  const {
    isAdminLoggedIn, adminLogin, adminLogout,
    adminParts, addPart, updatePart, deletePart,
    promos, addPromo, updatePromo, deletePromo,
  } = useAdmin();

  // ── Login state ───────────────────────────────────────────────
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // ── Tab ───────────────────────────────────────────────────────
  const [tab, setTab] = useState('parts'); // 'parts' | 'promos'

  // ── Parts form ────────────────────────────────────────────────
  const [partForm, setPartForm] = useState(EMPTY_PART);
  const [editingPartId, setEditingPartId] = useState(null);
  const [partImg, setPartImg] = useState(''); // preview URL
  const [partSuccess, setPartSuccess] = useState('');
  const fileRef = useRef(null);

  // ── Promo form ───────────────────────────────────────────────
  const [promoForm, setPromoForm] = useState(EMPTY_PROMO);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [promoSuccess, setPromoSuccess] = useState('');

  // ─────────────────────────────────────────────────────────────
  //  LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────
  if (!isAdminLoggedIn) {
    return (
      <main style={{ minHeight: '100vh', background: NAV, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '130px', padding: '130px 20px 40px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <img src="/M-Trans_logo_dark_site.png" alt="M-Trans" style={{ height: '48px', marginBottom: '20px' }} />
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', color: R, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
              {t('admin_panel_badge')}
            </div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: 0 }}>
              {t('admin_login_title')}
            </h1>
          </div>

          {/* Login Card */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '36px', backdropFilter: 'blur(20px)' }}>
            <form onSubmit={e => {
              e.preventDefault();
              const ok = adminLogin(password);
              if (!ok) { setLoginError(t('admin_login_error')); }
            }}>
              <Field label={t('admin_password_label')} name="password" type="password"
                value={password} onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                placeholder="••••••••" required
              />
              {loginError && (
                <div style={{ marginTop: '10px', background: 'rgba(230,0,0,0.1)', border: '1px solid rgba(230,0,0,0.3)', borderRadius: '8px', padding: '8px 14px', color: '#ff8080', fontSize: '0.82rem' }}>
                  ⚠️ {loginError}
                </div>
              )}
              <button type="submit" style={{ width: '100%', marginTop: '18px', background: R, color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', fontFamily: 'var(--f-body)', boxShadow: `0 6px 20px ${R}40` }}>
                🔐 {t('admin_login_btn')}
              </button>
            </form>
            <p style={{ color: '#3d4f62', fontSize: '0.75rem', textAlign: 'center', marginTop: '16px', fontFamily: 'var(--f-mono)' }}>
              {t('admin_demo_hint')}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  //  ADMIN PANEL
  // ─────────────────────────────────────────────────────────────

  // Part form helpers
  const handlePartChange = e => {
    const { name, value } = e.target;
    setPartForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPartImg(url);
    setPartForm(prev => ({ ...prev, img: url }));
  };

  const submitPart = e => {
    e.preventDefault();
    const data = { ...partForm, img: partImg || partForm.img };
    if (editingPartId) {
      updatePart(editingPartId, data);
      setPartSuccess(t('admin_part_updated'));
    } else {
      addPart(data);
      setPartSuccess(t('admin_part_added'));
    }
    setPartForm(EMPTY_PART);
    setPartImg('');
    setEditingPartId(null);
    setTimeout(() => setPartSuccess(''), 3000);
  };

  const startEditPart = (part) => {
    setPartForm({ name: part.name || '', category: part.category || 'Əyləclər', brand: part.brand || '', sku: part.sku || '', price: part.price || '', currency: part.currency || 'USD', stock: part.stock || 'in_stock', stockQty: part.stockQty || '', img: part.img || '', description: part.description || '', specs: part.specs || '', compatibility: part.compatibility || '' });
    setPartImg(part.img || '');
    setEditingPartId(part.id);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Promo form helpers
  const handlePromoChange = e => {
    const { name, value, type: t2, checked } = e.target;
    setPromoForm(prev => ({ ...prev, [name]: t2 === 'checkbox' ? checked : value }));
  };

  const submitPromo = e => {
    e.preventDefault();
    const data = { ...promoForm, discount: parseFloat(promoForm.discount) || 0, code: promoForm.code.toUpperCase() };
    if (editingPromoId) {
      updatePromo(editingPromoId, data);
      setPromoSuccess(t('admin_promo_updated'));
    } else {
      addPromo(data);
      setPromoSuccess(t('admin_promo_added'));
    }
    setPromoForm(EMPTY_PROMO);
    setEditingPromoId(null);
    setTimeout(() => setPromoSuccess(''), 3000);
  };

  const startEditPromo = (promo) => {
    setPromoForm({ code: promo.code, discount: promo.discount, type: promo.type, active: promo.active });
    setEditingPromoId(promo.id);
  };

  // ── Shared styles ─────────────────────────────────────────────
  const tabBtn = (key) => ({
    padding: '10px 24px', border: 'none', borderRadius: '10px',
    cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem',
    fontFamily: 'var(--f-body)', transition: 'all 0.2s',
    background: tab === key ? R : CARD,
    color: tab === key ? '#fff' : '#6b7a8d',
    boxShadow: tab === key ? `0 4px 14px ${R}40` : 'none',
    border: tab !== key ? `1px solid ${BORDER}` : 'none',
  });

  return (
    <main style={{ paddingTop: '130px', minHeight: '100vh', background: NAV, color: '#e2e8f0' }}>
      <div className="wrap" style={{ paddingBottom: '80px' }}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', color: R, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
              {t('admin_panel_badge')}
            </div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '2rem', fontWeight: '900', color: '#fff', margin: 0 }}>
              {t('admin_dashboard_title')}
            </h1>
          </div>
          <button onClick={adminLogout} style={{ background: 'rgba(230,0,0,0.1)', border: '1px solid rgba(230,0,0,0.25)', borderRadius: '10px', color: '#ff8080', padding: '10px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', fontFamily: 'var(--f-body)' }}>
            🚪 {t('admin_logout')}
          </button>
        </div>

        {/* ── Stats cards ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: t('admin_stat_parts'), value: adminParts.length, icon: '📦', color: '#3B82F6' },
            { label: t('admin_stat_promos'), value: promos.filter(p => p.active).length, icon: '🎟️', color: '#22C55E' },
            { label: t('admin_stat_total_promos'), value: promos.length, icon: '📊', color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.8rem', fontWeight: '900', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#5e748a', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <button style={tabBtn('parts')}  onClick={() => setTab('parts')}>📦 {t('admin_tab_parts')}</button>
          <button style={tabBtn('promos')} onClick={() => setTab('promos')}>🎟️ {t('admin_tab_promos')}</button>
        </div>

        {/* ════════════════════════════════════════════════════
            TAB: PARTS
            ════════════════════════════════════════════════════ */}
        {tab === 'parts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }}>

            {/* ── Add/Edit Form ───────────────────────────── */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '28px', backdropFilter: 'blur(16px)' }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', fontWeight: '900', color: '#fff', marginBottom: '22px' }}>
                {editingPartId ? `✏️ ${t('admin_edit_part')}` : `➕ ${t('admin_add_part')}`}
              </h2>

              {partSuccess && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#4ade80', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ✅ {partSuccess}
                </div>
              )}

              <form onSubmit={submitPart} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <Field label={t('admin_field_name')}  name="name"  value={partForm.name}  onChange={handlePartChange} placeholder="e.g. Brake Caliper" required />
                  <Field label={t('admin_field_sku')}   name="sku"   value={partForm.sku}   onChange={handlePartChange} placeholder="e.g. K020345" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <Field label={t('admin_field_brand')} name="brand" value={partForm.brand} onChange={handlePartChange} placeholder="e.g. Knorr-Bremse" required />
                  <Field label={t('admin_field_category')} name="category" value={partForm.category} onChange={handlePartChange} as="select"
                    options={CATS.map(c => ({ value: c, label: c }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                  <Field label={t('admin_field_price')} name="price" type="number" value={partForm.price} onChange={handlePartChange} placeholder="0.00" />
                  <Field label={t('admin_field_currency')} name="currency" value={partForm.currency} onChange={handlePartChange} as="select"
                    options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'AZN', label: 'AZN' }]}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <Field label={t('admin_field_stock')} name="stock" value={partForm.stock} onChange={handlePartChange} as="select"
                    options={[{ value: 'in_stock', label: t('stock_in') }, { value: 'out', label: t('stock_out') }]}
                  />
                  <Field label={t('admin_field_stock_qty')} name="stockQty" type="number" value={partForm.stockQty} onChange={handlePartChange} placeholder="0" />
                </div>

                {/* Image upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '7px', fontFamily: 'var(--f-mono)' }}>
                    {t('admin_field_image')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" name="img" value={partForm.img} onChange={e => { handlePartChange(e); setPartImg(e.target.value); }}
                      placeholder="https://... (URL)"
                      style={{ flex: 1, height: '42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', padding: '0 14px', fontSize: '0.85rem', outline: 'none', fontFamily: 'var(--f-body)' }}
                    />
                    <button type="button" onClick={() => fileRef.current?.click()}
                      style={{ padding: '0 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#9aa8b6', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', fontFamily: 'var(--f-body)' }}>
                      📁 {t('admin_upload')}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                  </div>
                  {partImg && (
                    <img src={partImg} alt="preview" style={{ marginTop: '10px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                  )}
                </div>

                <Field label={t('admin_field_compat')} name="compatibility" value={partForm.compatibility} onChange={handlePartChange} placeholder="e.g. Volvo FH, Scania R" />
                <Field label={t('admin_field_desc')} name="description" value={partForm.description} onChange={handlePartChange} as="textarea" placeholder={t('admin_field_desc_ph')} />
                <Field label={t('admin_field_specs')} name="specs" value={partForm.specs} onChange={handlePartChange} as="textarea" placeholder="Material: Steel | Weight: 2.4kg..." />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ flex: 1, background: R, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--f-body)' }}>
                    {editingPartId ? `✏️ ${t('admin_save_changes')}` : `➕ ${t('admin_add_part')}`}
                  </button>
                  {editingPartId && (
                    <button type="button" onClick={() => { setPartForm(EMPTY_PART); setPartImg(''); setEditingPartId(null); }}
                      style={{ padding: '12px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#9aa8b6', cursor: 'pointer', fontFamily: 'var(--f-body)', fontWeight: '700' }}>
                      ✕ {t('admin_cancel')}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* ── Parts List ──────────────────────────────── */}
            <div>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', fontWeight: '900', color: '#fff', marginBottom: '18px' }}>
                📦 {t('admin_parts_list')} <span style={{ color: R }}>({adminParts.length})</span>
              </h2>

              {adminParts.length === 0 ? (
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#3d4f62' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
                  <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.85rem' }}>{t('admin_no_parts')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                  {adminParts.map(part => (
                    <div key={part.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                      {part.img && (
                        <img src={part.img} alt={part.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{part.name}</div>
                        <div style={{ color: '#5e748a', fontSize: '0.78rem', fontFamily: 'var(--f-mono)', marginTop: '2px' }}>{part.sku} · {part.brand}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{ background: part.stock === 'in_stock' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: part.stock === 'in_stock' ? '#4ade80' : '#f87171', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: '700', fontFamily: 'var(--f-mono)' }}>
                            {part.stock === 'in_stock' ? t('stock_in') : t('stock_out')}
                          </span>
                          {part.price && <span style={{ color: R, fontSize: '0.8rem', fontWeight: '800' }}>{part.price} {part.currency}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => startEditPart(part)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', color: '#60a5fa', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--f-body)' }}>✏️</button>
                        <button onClick={() => deletePart(part.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--f-body)' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: PROMOS
            ════════════════════════════════════════════════════ */}
        {tab === 'promos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }}>

            {/* ── Add/Edit Promo Form ─────────────────────── */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '28px', backdropFilter: 'blur(16px)' }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', fontWeight: '900', color: '#fff', marginBottom: '22px' }}>
                {editingPromoId ? `✏️ ${t('admin_edit_promo')}` : `➕ ${t('admin_add_promo')}`}
              </h2>

              {promoSuccess && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#4ade80', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ✅ {promoSuccess}
                </div>
              )}

              <form onSubmit={submitPromo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Field label={t('admin_promo_code')} name="code" value={promoForm.code} onChange={handlePromoChange}
                  placeholder="e.g. MTRANS10" required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <Field label={t('admin_promo_discount')} name="discount" type="number" value={promoForm.discount} onChange={handlePromoChange} placeholder="10" required />
                  <Field label={t('admin_promo_type')} name="type" value={promoForm.type} onChange={handlePromoChange} as="select"
                    options={[{ value: 'percent', label: `% ${t('admin_promo_percent')}` }, { value: 'fixed', label: `AZN ${t('admin_promo_fixed')}` }]}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#9aa8b6', fontSize: '0.88rem' }}>
                  <input type="checkbox" name="active" checked={promoForm.active} onChange={handlePromoChange}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  {t('admin_promo_active')}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ flex: 1, background: '#22C55E', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--f-body)' }}>
                    {editingPromoId ? `✏️ ${t('admin_save_changes')}` : `➕ ${t('admin_add_promo')}`}
                  </button>
                  {editingPromoId && (
                    <button type="button" onClick={() => { setPromoForm(EMPTY_PROMO); setEditingPromoId(null); }}
                      style={{ padding: '12px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#9aa8b6', cursor: 'pointer', fontFamily: 'var(--f-body)', fontWeight: '700' }}>
                      ✕ {t('admin_cancel')}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* ── Promos List ─────────────────────────────── */}
            <div>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', fontWeight: '900', color: '#fff', marginBottom: '18px' }}>
                🎟️ {t('admin_promos_list')} <span style={{ color: '#22C55E' }}>({promos.length})</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {promos.map(promo => (
                  <div key={promo.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <code style={{ fontFamily: 'var(--f-mono)', fontWeight: '900', fontSize: '1rem', color: '#22C55E', letterSpacing: '1px' }}>{promo.code}</code>
                        <span style={{ background: promo.active ? 'rgba(34,197,94,0.12)' : 'rgba(100,100,100,0.15)', color: promo.active ? '#4ade80' : '#6b7a8d', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: '700', fontFamily: 'var(--f-mono)' }}>
                          {promo.active ? t('admin_promo_active') : t('admin_promo_inactive')}
                        </span>
                      </div>
                      <div style={{ color: '#5e748a', fontSize: '0.8rem', marginTop: '4px' }}>
                        {promo.discount}{promo.type === 'percent' ? '%' : ' AZN'} {t('admin_promo_discount')}
                        {' · '}{promo.uses || 0} {t('admin_promo_uses')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => startEditPromo(promo)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', color: '#60a5fa', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>✏️</button>
                      <button onClick={() => deletePromo(promo.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
