// =================================================================
// FAYL: src/pages/Dashboard.jsx
// TƏSVİR: Anbardar İdarəetmə Paneli — Məhsul CRUD, Sürətli
//         Stok/Qiymət Yeniləməsi, Promokod İdarəetməsi
// =================================================================

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';

// ── Design tokens ────────────────────────────────────────────────
const R    = '#FF6B1A';   // AUTRO PARTS narıncı
const NAV  = '#060B19';   // tünd navy
const CARD  = 'rgba(255,255,255,0.035)';
const CARD2 = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.08)';
const GREEN  = '#22C55E';
const BLUE   = '#3B82F6';
const AMBER  = '#F59E0B';

// ── Reusable Field ───────────────────────────────────────────────
function Field({ label, name, value, onChange, type='text', placeholder='', required=false, as='input', options=[], min, max }) {
  const base = {
    width:'100%', boxSizing:'border-box',
    background:'rgba(255,255,255,0.05)',
    border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:'10px', color:'#e2e8f0',
    padding:'0 14px', fontSize:'0.87rem',
    fontFamily:'var(--f-body)', outline:'none',
    transition:'border-color 0.2s, box-shadow 0.2s',
    height: as==='textarea' ? 'auto' : '42px',
  };
  const focus = e => { e.target.style.borderColor=`${R}50`; e.target.style.boxShadow=`0 0 0 3px ${R}10`; };
  const blur  = e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; };
  return (
    <div>
      <label style={{ display:'block', fontSize:'0.7rem', fontWeight:'800', color:'#5e748a', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'7px', fontFamily:'var(--f-mono)' }}>
        {label}{required && <span style={{ color: R }}> *</span>}
      </label>
      {as==='textarea'
        ? <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3}
            style={{...base, padding:'10px 14px', resize:'vertical'}} onFocus={focus} onBlur={blur} />
        : as==='select'
        ? <select name={name} value={value} onChange={onChange}
            style={{...base, appearance:'none', cursor:'pointer', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a8d' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center'}} onFocus={focus} onBlur={blur}>
            {options.map(o => <option key={o.value} value={o.value} style={{ background:'#1a2333' }}>{o.label}</option>)}
          </select>
        : <input type={type} name={name} value={value} onChange={onChange}
            placeholder={placeholder} required={required} min={min} max={max}
            style={base} onFocus={focus} onBlur={blur} />
      }
    </div>
  );
}

// ── Toast notification ───────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  const color = type==='error' ? '#f87171' : '#4ade80';
  const bg    = type==='error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)';
  const bdr   = type==='error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)';
  return (
    <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:'10px', padding:'10px 16px', color, fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', animation:'pageFadeIn 0.3s ease' }}>
      {type==='error' ? '⚠️' : '✅'} {msg}
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────
const CATS = ['Əyləclər','Pnevmatika','Filtrlər','Elektronika','Asma sistemi','Transmissiya','Mühərrik','Yağlama','Digər'];
const CURRENCIES = [{ value:'USD', label:'USD $' }, { value:'EUR', label:'EUR €' }, { value:'AZN', label:'AZN ₼' }];

const EMPTY_PART = { name:'', category:'Əyləclər', brand:'', sku:'', price:'', currency:'USD', stock:'in_stock', stockQty:'1', img:'', imgUrl:'', description:'', specs:'', compatibility:'' };
const EMPTY_PROMO = { code:'', discount:'', type:'percent', active:true };

// ════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { adminParts, allParts, addPart, updatePart, deletePart, promos, addPromo, updatePromo, deletePromo } = useAdmin();

  const [tab, setTab]  = useState('overview');  // overview | parts | quickupdate | promos
  const [toast, setToast] = useState({ msg:'', type:'success' });

  // Parts form
  const [partForm, setPartForm]         = useState(EMPTY_PART);
  const [editingPartId, setEditingPartId] = useState(null);
  const [partImg, setPartImg]           = useState('');
  const [showPartForm, setShowPartForm] = useState(false);
  const fileRef = useRef(null);

  // Promo form
  const [promoForm, setPromoForm]         = useState(EMPTY_PROMO);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [showPromoForm, setShowPromoForm] = useState(false);

  // Quick update (inline stock/price editing)
  const [quickEdits, setQuickEdits] = useState({});

  // ── Toast helper ─────────────────────────────────────────────
  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 3500);
  };

  // ── PART CRUD ────────────────────────────────────────────────
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
    const data = { ...partForm, img: partImg || partForm.imgUrl || partForm.img };
    if (editingPartId) {
      updatePart(editingPartId, data);
      showToast(t('dash_part_updated'));
    } else {
      addPart(data);
      showToast(t('dash_part_added'));
    }
    setPartForm(EMPTY_PART); setPartImg(''); setEditingPartId(null); setShowPartForm(false);
  };

  const startEditPart = part => {
    // Default məhsullarda catKey var, admin məhsullarda category var
    const cat = part.category || part.catKey || 'Əyləclər';
    const sku  = part.sku || part.oemCode || '';
    const name = part.name || '';
    setPartForm({
      name, category: cat, brand: part.brand||'', sku,
      price: part.price||'', currency: part.currency||'AZN',
      stock: part.stock||'in_stock', stockQty: part.stockQty||'1',
      img: part.img||'', imgUrl: part.img||'',
      description: part.description||part.descKey||'',
      specs: part.specs||'', compatibility: part.compatibility||'',
    });
    setPartImg(part.img||'');
    setEditingPartId(part.id);
    setShowPartForm(true);
    setTab('parts');
    window.scrollTo({ top: 0, behavior:'smooth' });
  };

  const handleDeletePart = id => {
    if (!confirm(t('dash_confirm_delete'))) return;
    deletePart(id);
    showToast(t('dash_part_deleted'), 'error');
  };

  // ── QUICK UPDATE ─────────────────────────────────────────────
  const getQuickEdit = (id, field, fallback) => quickEdits[id]?.[field] ?? fallback;
  const setQuickEdit = (id, field, value) => {
    setQuickEdits(prev => ({ ...prev, [id]: { ...(prev[id]||{}), [field]: value } }));
  };
  const saveQuickEdit = (part) => {
    const edits = quickEdits[part.id] || {};
    if (Object.keys(edits).length === 0) return;
    updatePart(part.id, edits);
    setQuickEdits(prev => { const n={...prev}; delete n[part.id]; return n; });
    showToast(t('dash_quick_saved'));
  };

  // ── PROMO CRUD ───────────────────────────────────────────────
  const handlePromoChange = e => {
    const { name, value, type: t2, checked } = e.target;
    setPromoForm(prev => ({ ...prev, [name]: t2==='checkbox' ? checked : value }));
  };

  const submitPromo = e => {
    e.preventDefault();
    const data = { ...promoForm, code: promoForm.code.toUpperCase().trim(), discount: parseFloat(promoForm.discount)||0 };
    if (editingPromoId) {
      updatePromo(editingPromoId, data);
      showToast(t('dash_promo_updated'));
    } else {
      addPromo(data);
      showToast(t('dash_promo_added'));
    }
    setPromoForm(EMPTY_PROMO); setEditingPromoId(null); setShowPromoForm(false);
  };

  const startEditPromo = promo => {
    setPromoForm({ code:promo.code, discount:promo.discount, type:promo.type, active:promo.active });
    setEditingPromoId(promo.id);
    setShowPromoForm(true);
  };

  // ── NAV ──────────────────────────────────────────────────────
  const tabs = [
    { key:'overview',    icon:'📊', label: t('dash_tab_overview') },
    { key:'parts',       icon:'📦', label: t('dash_tab_parts') },
    { key:'quickupdate', icon:'⚡', label: t('dash_tab_quick') },
    { key:'promos',      icon:'🎟️', label: t('dash_tab_promos') },
  ];

  const handleLogout = () => { logout(); navigate('/admin-login'); };

  // ── STYLES ───────────────────────────────────────────────────
  const tabStyle = key => ({
    display:'flex', alignItems:'center', gap:'8px',
    padding:'10px 18px', border:'none', borderRadius:'12px',
    cursor:'pointer', fontWeight:'700', fontSize:'0.85rem',
    fontFamily:'var(--f-body)', transition:'all 0.2s',
    background: tab===key ? (key==='overview'?BLUE : key==='quickupdate'?AMBER : key==='promos'?GREEN : R) : CARD,
    color: tab===key ? '#fff' : '#5e748a',
    boxShadow: tab===key ? `0 4px 14px ${tab===key?(key==='overview'?BLUE:key==='quickupdate'?AMBER:key==='promos'?GREEN:R):'transparent'}40` : 'none',
    border: tab!==key ? `1px solid ${BORDER}` : 'none',
  });

  const statCard = (icon, value, label, color, sub) => (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'16px', padding:'22px', backdropFilter:'blur(10px)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:'0.72rem', fontFamily:'var(--f-mono)', color:'#5e748a', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>{label}</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize:'2rem', fontWeight:'900', color }}>{value}</div>
          {sub && <div style={{ fontSize:'0.76rem', color:'#3d4f62', marginTop:'4px' }}>{sub}</div>}
        </div>
        <div style={{ fontSize:'1.6rem', background:`${color}15`, padding:'10px', borderRadius:'12px' }}>{icon}</div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  return (
    <main style={{ paddingTop:'130px', minHeight:'100vh', background: NAV, color:'#e2e8f0' }}>
      <style>{`
        .qbtn { transition: all 0.15s; }
        .qbtn:hover { opacity:0.85; transform: scale(1.02); }
        .partrow { transition: background 0.2s; }
        .partrow:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>
      <div className="wrap" style={{ paddingBottom:'80px' }}>

        {/* ── Top Header ──────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'14px' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'20px', padding:'4px 12px', marginBottom:'10px' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:GREEN, display:'inline-block', boxShadow:`0 0 8px ${GREEN}` }} />
              <span style={{ fontFamily:'var(--f-mono)', fontSize:'0.65rem', color:'#4ade80', fontWeight:'700', letterSpacing:'2px', textTransform:'uppercase' }}>
                {t('dash_live_badge')}
              </span>
            </div>
            <h1 style={{ fontFamily:'var(--f-display)', fontSize:'1.8rem', fontWeight:'900', color:'#fff', margin:'0 0 4px', letterSpacing:'-0.02em' }}>
              {t('dash_title')}
            </h1>
            <p style={{ color:'#3d4f62', fontSize:'0.85rem', margin:0, fontFamily:'var(--f-mono)' }}>
              👤 {user?.displayName} · {user?.role === 'superadmin' ? t('dash_role_super') : t('dash_role_warehouse')}
            </p>
          </div>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            <a href="/spare-parts" target="_blank" style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 16px', background:CARD, border:`1px solid ${BORDER}`, borderRadius:'10px', color:'#9aa8b6', textDecoration:'none', fontSize:'0.82rem', fontWeight:'700' }}>
              🌐 {t('dash_view_catalog')}
            </a>
            <button onClick={handleLogout} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', color:'#f87171', cursor:'pointer', fontSize:'0.82rem', fontWeight:'700', fontFamily:'var(--f-body)' }}>
              🚪 {t('dash_logout')}
            </button>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'28px', flexWrap:'wrap' }}>
          {tabs.map(tb => (
            <button key={tb.key} style={tabStyle(tb.key)} onClick={() => setTab(tb.key)}>
              {tb.icon} {tb.label}
              {tb.key==='parts' && allParts.length > 0 && (
                <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:'8px', padding:'1px 7px', fontSize:'0.7rem' }}>{allParts.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Toast */}
        <Toast msg={toast.msg} type={toast.type} />

        {/* ════════════════════════════════════════════════
            TAB: OVERVIEW
            ════════════════════════════════════════════════ */}
        {tab==='overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
            {/* Stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'16px' }}>
              {statCard('📦', allParts.length, t('dash_stat_total_parts'), BLUE)}
              {statCard('✅', allParts.filter(p=>p.stock==='in_stock').length, t('dash_stat_in_stock'), GREEN, `${allParts.filter(p=>p.stock!=='in_stock').length} ${t('dash_stat_out')}`)}
              {statCard('🎟️', promos.filter(p=>p.active).length, t('dash_stat_active_promos'), AMBER, `${promos.length} ${t('dash_stat_total')}`)}
              {statCard('🏷️', allParts.filter(p=>p.price).length, t('dash_stat_priced'), '#A78BFA')}
            </div>

            {/* Recent parts */}
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'20px', padding:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
                <h3 style={{ fontFamily:'var(--f-display)', fontSize:'1rem', fontWeight:'900', color:'#fff', margin:0 }}>
                  📦 {t('dash_recent_parts')}
                </h3>
                <button onClick={() => setTab('parts')} style={{ background:'none', border:`1px solid ${BORDER}`, borderRadius:'8px', color:'#5e748a', padding:'5px 12px', cursor:'pointer', fontSize:'0.78rem', fontFamily:'var(--f-body)' }}>
                  {t('dash_see_all')} →
                </button>
              </div>
              {allParts.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px', color:'#3d4f62', fontFamily:'var(--f-mono)', fontSize:'0.85rem' }}>
                  📭 {t('dash_no_parts_yet')}
                </div>
              ) : allParts.slice(0,5).map(p => (
                <div key={p.id} className="partrow" style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 8px', borderRadius:'10px', marginBottom:'4px' }}>
                  {p.img && <img src={p.img} alt={p.name} style={{ width:'40px', height:'40px', borderRadius:'8px', objectFit:'cover', flexShrink:0 }} onError={e=>e.target.style.display='none'} />}
                  {!p.img && <div style={{ width:'40px', height:'40px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>⚙️</div>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:'800', color:'#e2e8f0', fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ color:'#5e748a', fontSize:'0.72rem', fontFamily:'var(--f-mono)' }}>{p.sku} · {p.brand}</div>
                  </div>
                  <span style={{ background:p.stock==='in_stock'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', color:p.stock==='in_stock'?'#4ade80':'#f87171', borderRadius:'6px', padding:'2px 8px', fontSize:'0.7rem', fontWeight:'700', fontFamily:'var(--f-mono)', whiteSpace:'nowrap' }}>
                    {p.stock==='in_stock' ? t('stock_in') : t('stock_out')}
                  </span>
                  {p.price && <span style={{ color:R, fontSize:'0.8rem', fontWeight:'800', whiteSpace:'nowrap' }}>{p.price} {p.currency}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: PARTS (Add / List)
            ════════════════════════════════════════════════ */}
        {tab==='parts' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

            {/* Add button */}
            {!showPartForm && (
              <button onClick={() => { setShowPartForm(true); setEditingPartId(null); setPartForm(EMPTY_PART); setPartImg(''); }}
                style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:'8px', padding:'12px 22px', background:R, border:'none', borderRadius:'12px', color:'#fff', fontWeight:'800', fontSize:'0.9rem', cursor:'pointer', fontFamily:'var(--f-body)', boxShadow:`0 4px 16px ${R}35` }}>
                ➕ {t('dash_add_new_part')}
              </button>
            )}

            {/* Add/Edit Form */}
            {showPartForm && (
              <div style={{ background:CARD2, border:`1px solid ${BORDER}`, borderRadius:'20px', padding:'28px', backdropFilter:'blur(16px)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'22px' }}>
                  <h2 style={{ fontFamily:'var(--f-display)', fontSize:'1.1rem', fontWeight:'900', color:'#fff', margin:0 }}>
                    {editingPartId ? `✏️ ${t('dash_edit_part')}` : `➕ ${t('dash_add_part')}`}
                  </h2>
                  <button onClick={() => { setShowPartForm(false); setEditingPartId(null); setPartForm(EMPTY_PART); setPartImg(''); }}
                    style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:'8px', color:'#5e748a', padding:'6px 12px', cursor:'pointer', fontFamily:'var(--f-body)', fontSize:'0.82rem' }}>
                    ✕ {t('dash_cancel')}
                  </button>
                </div>

                <form onSubmit={submitPart}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'14px', marginBottom:'14px' }}>
                    <Field label={t('dash_field_name')}  name="name"  value={partForm.name}  onChange={handlePartChange} placeholder="Əyləc kaliperi" required />
                    <Field label={t('dash_field_sku')}   name="sku"   value={partForm.sku}   onChange={handlePartChange} placeholder="K020345" required />
                    <Field label={t('dash_field_brand')} name="brand" value={partForm.brand} onChange={handlePartChange} placeholder="Knorr-Bremse" required />
                    <Field label={t('dash_field_category')} name="category" value={partForm.category} onChange={handlePartChange} as="select"
                      options={CATS.map(c=>({value:c,label:c}))} />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:'14px', marginBottom:'14px' }}>
                    <Field label={t('dash_field_price')}    name="price"    type="number" value={partForm.price}    onChange={handlePartChange} placeholder="0.00" min="0" />
                    <Field label={t('dash_field_currency')} name="currency" value={partForm.currency} onChange={handlePartChange} as="select" options={CURRENCIES} />
                    <Field label={t('dash_field_stock')}    name="stock"    value={partForm.stock}    onChange={handlePartChange} as="select"
                      options={[{value:'in_stock',label:t('stock_in')},{value:'out',label:t('stock_out')}]} />
                    <Field label={t('dash_field_qty')}      name="stockQty" type="number" value={partForm.stockQty} onChange={handlePartChange} placeholder="1" min="0" />
                  </div>

                  {/* Image */}
                  <div style={{ marginBottom:'14px' }}>
                    <label style={{ display:'block', fontSize:'0.7rem', fontWeight:'800', color:'#5e748a', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'7px', fontFamily:'var(--f-mono)' }}>{t('dash_field_image')}</label>
                    <div style={{ display:'flex', gap:'8px', marginBottom: partImg?'10px':0 }}>
                      <input type="text" name="imgUrl" value={partForm.imgUrl} placeholder="https://... (URL)"
                        onChange={e => { handlePartChange({target:{name:'imgUrl',value:e.target.value}}); setPartImg(e.target.value); }}
                        style={{ flex:1, height:'42px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'#e2e8f0', padding:'0 12px', fontSize:'0.87rem', outline:'none', fontFamily:'var(--f-body)' }}
                      />
                      <button type="button" onClick={()=>fileRef.current?.click()}
                        style={{ padding:'0 16px', background:'rgba(255,255,255,0.06)', border:`1px solid ${BORDER}`, borderRadius:'10px', color:'#9aa8b6', cursor:'pointer', fontSize:'0.82rem', whiteSpace:'nowrap', fontFamily:'var(--f-body)' }}>
                        📁 {t('dash_upload')}
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
                    </div>
                    {partImg && <img src={partImg} alt="preview" style={{ height:'80px', borderRadius:'8px', objectFit:'cover', border:`1px solid ${BORDER}` }} />}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                    <Field label={t('dash_field_compat')} name="compatibility" value={partForm.compatibility} onChange={handlePartChange} placeholder="Volvo FH, Scania R..." />
                    <Field label={t('dash_field_specs')}  name="specs"         value={partForm.specs}         onChange={handlePartChange} placeholder="Material: Steel | Weight: 2kg" />
                  </div>
                  <div style={{ marginBottom:'18px' }}>
                    <Field label={t('dash_field_desc')} name="description" value={partForm.description} onChange={handlePartChange} as="textarea" placeholder={t('dash_field_desc_ph')} />
                  </div>

                  <button type="submit" style={{ width:'100%', background:editingPartId?BLUE:R, color:'#fff', border:'none', borderRadius:'12px', padding:'13px', fontWeight:'900', fontSize:'0.92rem', cursor:'pointer', fontFamily:'var(--f-display)', boxShadow:`0 4px 16px ${(editingPartId?BLUE:R)}35` }}>
                    {editingPartId ? `💾 ${t('dash_save_changes')}` : `➕ ${t('dash_add_part')}`}
                  </button>
                </form>
              </div>
            )}

            {/* Parts table */}
            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ padding:'18px 22px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <h3 style={{ fontFamily:'var(--f-display)', fontSize:'1rem', fontWeight:'900', color:'#fff', margin:0 }}>
                  📦 {t('dash_parts_list')} <span style={{ color:R }}>({allParts.length})</span>
                </h3>
              </div>
              {allParts.length === 0 ? (
                <div style={{ padding:'50px', textAlign:'center', color:'#3d4f62', fontFamily:'var(--f-mono)', fontSize:'0.88rem' }}>
                  📭 {t('dash_no_parts')}
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'700px' }}>
                    <thead>
                      <tr style={{ borderBottom:`1px solid ${BORDER}` }}>
                        {[t('dash_col_part'), 'SKU', t('dash_col_brand'), t('dash_col_price'), t('dash_col_stock'), t('dash_col_actions')].map((h,i) => (
                          <th key={i} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.68rem', fontFamily:'var(--f-mono)', color:'#3d4f62', textTransform:'uppercase', letterSpacing:'1px', fontWeight:'800', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allParts.map(p => (
                        <tr key={p.id} className="partrow" style={{ borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                          <td style={{ padding:'12px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                              {p.img ? <img src={p.img} alt="" style={{ width:'36px', height:'36px', borderRadius:'8px', objectFit:'cover', flexShrink:0 }} onError={e=>e.target.style.display='none'} /> : <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>⚙️</div>}
                              <div style={{ fontWeight:'700', color:'#e2e8f0', fontSize:'0.87rem', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                            </div>
                          </td>
                          <td style={{ padding:'12px 16px' }}><code style={{ fontFamily:'var(--f-mono)', fontSize:'0.78rem', color:'#6b7a8d' }}>{p.sku}</code></td>
                          <td style={{ padding:'12px 16px', color:'#9aa8b6', fontSize:'0.85rem' }}>{p.brand}</td>
                          <td style={{ padding:'12px 16px', color:R, fontWeight:'800', fontSize:'0.85rem', whiteSpace:'nowrap' }}>{p.price ? `${p.price} ${p.currency}` : '—'}</td>
                          <td style={{ padding:'12px 16px' }}>
                            <span style={{ background:p.stock==='in_stock'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', color:p.stock==='in_stock'?'#4ade80':'#f87171', borderRadius:'6px', padding:'3px 9px', fontSize:'0.7rem', fontWeight:'700', fontFamily:'var(--f-mono)', whiteSpace:'nowrap' }}>
                              {p.stock==='in_stock' ? '✅ '+t('stock_in') : '❌ '+t('stock_out')}
                            </span>
                          </td>
                          <td style={{ padding:'12px 16px' }}>
                            <div style={{ display:'flex', gap:'6px' }}>
                              <button className="qbtn" onClick={()=>startEditPart(p)} style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'8px', color:'#60a5fa', padding:'6px 10px', cursor:'pointer', fontSize:'0.8rem' }}>✏️</button>
                              <button className="qbtn" onClick={()=>handleDeletePart(p.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', color:'#f87171', padding:'6px 10px', cursor:'pointer', fontSize:'0.8rem' }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: QUICK UPDATE (Stok & Qiymət)
            ════════════════════════════════════════════════ */}
        {tab==='quickupdate' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'14px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'1.2rem' }}>⚡</span>
              <p style={{ margin:0, color:'#fbbf24', fontSize:'0.85rem', fontFamily:'var(--f-body)' }}>{t('dash_quick_info')}</p>
            </div>

            {allParts.length === 0 ? (
              <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'16px', padding:'50px', textAlign:'center', color:'#3d4f62', fontFamily:'var(--f-mono)' }}>
                📭 {t('dash_no_parts')}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {allParts.map(p => {
                  const hasChanges = Object.keys(quickEdits[p.id]||{}).length > 0;
                  return (
                    <div key={p.id} style={{ background:CARD, border:`1px solid ${hasChanges?`${AMBER}40`:BORDER}`, borderRadius:'14px', padding:'16px 20px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:'14px', alignItems:'center', backdropFilter:'blur(10px)' }}>
                      {/* Name */}
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:'800', color:'#e2e8f0', fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                        <div style={{ color:'#5e748a', fontSize:'0.72rem', fontFamily:'var(--f-mono)' }}>{p.sku}</div>
                      </div>
                      {/* Price */}
                      <div>
                        <div style={{ fontSize:'0.65rem', color:'#5e748a', fontFamily:'var(--f-mono)', textTransform:'uppercase', marginBottom:'4px' }}>{t('dash_field_price')}</div>
                        <input type="number" min="0" value={getQuickEdit(p.id,'price',p.price||'')}
                          onChange={e=>setQuickEdit(p.id,'price',e.target.value)}
                          style={{ width:'100%', height:'36px', background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:'8px', color:'#e2e8f0', padding:'0 10px', fontSize:'0.85rem', outline:'none', fontFamily:'var(--f-body)' }}
                        />
                      </div>
                      {/* Qty */}
                      <div>
                        <div style={{ fontSize:'0.65rem', color:'#5e748a', fontFamily:'var(--f-mono)', textTransform:'uppercase', marginBottom:'4px' }}>{t('dash_field_qty')}</div>
                        <input type="number" min="0" value={getQuickEdit(p.id,'stockQty',p.stockQty||'')}
                          onChange={e=>setQuickEdit(p.id,'stockQty',e.target.value)}
                          style={{ width:'100%', height:'36px', background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:'8px', color:'#e2e8f0', padding:'0 10px', fontSize:'0.85rem', outline:'none', fontFamily:'var(--f-body)' }}
                        />
                      </div>
                      {/* Stock status */}
                      <div>
                        <div style={{ fontSize:'0.65rem', color:'#5e748a', fontFamily:'var(--f-mono)', textTransform:'uppercase', marginBottom:'4px' }}>{t('dash_col_stock')}</div>
                        <select value={getQuickEdit(p.id,'stock',p.stock||'in_stock')}
                          onChange={e=>setQuickEdit(p.id,'stock',e.target.value)}
                          style={{ width:'100%', height:'36px', background:'#1a2333', border:`1px solid ${BORDER}`, borderRadius:'8px', color:getQuickEdit(p.id,'stock',p.stock)==='in_stock'?'#4ade80':'#f87171', padding:'0 10px', fontSize:'0.82rem', outline:'none', cursor:'pointer' }}>
                          <option value="in_stock" style={{ color:'#4ade80' }}>{t('stock_in')}</option>
                          <option value="out"      style={{ color:'#f87171' }}>{t('stock_out')}</option>
                        </select>
                      </div>
                      {/* Save */}
                      <button className="qbtn" onClick={()=>saveQuickEdit(p)} disabled={!hasChanges}
                        style={{ padding:'0 14px', height:'36px', background:hasChanges?GREEN:'rgba(255,255,255,0.04)', border:`1px solid ${hasChanges?GREEN+40:BORDER}`, borderRadius:'8px', color:hasChanges?'#fff':'#3d4f62', cursor:hasChanges?'pointer':'default', fontWeight:'800', fontSize:'0.82rem', whiteSpace:'nowrap', fontFamily:'var(--f-body)', transition:'all 0.2s' }}>
                        {hasChanges ? `💾 ${t('dash_save')}` : '—'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: PROMOS
            ════════════════════════════════════════════════ */}
        {tab==='promos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
            {!showPromoForm && (
              <button onClick={()=>{ setShowPromoForm(true); setEditingPromoId(null); setPromoForm(EMPTY_PROMO); }}
                style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:'8px', padding:'12px 22px', background:GREEN, border:'none', borderRadius:'12px', color:'#fff', fontWeight:'800', fontSize:'0.9rem', cursor:'pointer', fontFamily:'var(--f-body)', boxShadow:`0 4px 16px ${GREEN}35` }}>
                ➕ {t('dash_add_promo')}
              </button>
            )}

            {showPromoForm && (
              <div style={{ background:CARD2, border:`1px solid ${BORDER}`, borderRadius:'20px', padding:'28px', backdropFilter:'blur(16px)', maxWidth:'520px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'22px' }}>
                  <h2 style={{ fontFamily:'var(--f-display)', fontSize:'1.1rem', fontWeight:'900', color:'#fff', margin:0 }}>
                    {editingPromoId ? `✏️ ${t('dash_edit_promo')}` : `➕ ${t('dash_add_promo')}`}
                  </h2>
                  <button onClick={()=>{ setShowPromoForm(false); setEditingPromoId(null); setPromoForm(EMPTY_PROMO); }}
                    style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${BORDER}`, borderRadius:'8px', color:'#5e748a', padding:'6px 12px', cursor:'pointer', fontFamily:'var(--f-body)', fontSize:'0.82rem' }}>
                    ✕ {t('dash_cancel')}
                  </button>
                </div>
                <form onSubmit={submitPromo} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  <Field label={t('dash_promo_code')} name="code" value={promoForm.code} onChange={handlePromoChange} placeholder="MTRANS10" required />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                    <Field label={t('dash_promo_discount')} name="discount" type="number" value={promoForm.discount} onChange={handlePromoChange} placeholder="10" min="0" required />
                    <Field label={t('dash_promo_type')} name="type" value={promoForm.type} onChange={handlePromoChange} as="select"
                      options={[{value:'percent',label:`% ${t('dash_promo_percent')}`},{value:'fixed',label:`AZN ${t('dash_promo_fixed')}`}]} />
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}>
                    <input type="checkbox" name="active" checked={promoForm.active} onChange={handlePromoChange} style={{ width:'16px', height:'16px', cursor:'pointer', accentColor:GREEN }} />
                    <span style={{ color:'#9aa8b6', fontSize:'0.88rem', fontFamily:'var(--f-body)' }}>{t('dash_promo_active')}</span>
                  </label>
                  <button type="submit" style={{ background:GREEN, color:'#fff', border:'none', borderRadius:'12px', padding:'12px', fontWeight:'900', fontSize:'0.92rem', cursor:'pointer', fontFamily:'var(--f-display)' }}>
                    {editingPromoId ? `💾 ${t('dash_save_changes')}` : `➕ ${t('dash_add_promo')}`}
                  </button>
                </form>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'14px' }}>
              {promos.map(promo => (
                <div key={promo.id} style={{ background:CARD, border:`1px solid ${promo.active?`${GREEN}25`:BORDER}`, borderRadius:'16px', padding:'18px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                    <code style={{ fontFamily:'var(--f-mono)', fontWeight:'900', fontSize:'1.1rem', color:promo.active?GREEN:'#5e748a', letterSpacing:'1px' }}>{promo.code}</code>
                    <span style={{ background:promo.active?'rgba(34,197,94,0.1)':'rgba(100,100,100,0.1)', color:promo.active?'#4ade80':'#5e748a', borderRadius:'6px', padding:'3px 9px', fontSize:'0.68rem', fontWeight:'700', fontFamily:'var(--f-mono)' }}>
                      {promo.active ? t('dash_promo_active') : t('dash_promo_inactive')}
                    </span>
                  </div>
                  <div style={{ color:'#9aa8b6', fontSize:'0.85rem', marginBottom:'14px' }}>
                    <strong style={{ color:promo.active?GREEN:'#6b7a8d' }}>{promo.discount}{promo.type==='percent'?'%':' AZN'}</strong> {t('dash_promo_discount_label')}
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={()=>startEditPromo(promo)} style={{ flex:1, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'8px', color:'#60a5fa', padding:'7px', cursor:'pointer', fontSize:'0.82rem', fontFamily:'var(--f-body)', fontWeight:'700' }}>✏️ {t('dash_edit')}</button>
                    <button onClick={()=>{ updatePromo(promo.id,{active:!promo.active}); showToast(t(promo.active?'dash_promo_deactivated':'dash_promo_activated')); }}
                      style={{ flex:1, background:promo.active?'rgba(239,68,68,0.08)':'rgba(34,197,94,0.08)', border:`1px solid ${promo.active?'rgba(239,68,68,0.2)':'rgba(34,197,94,0.2)'}`, borderRadius:'8px', color:promo.active?'#f87171':'#4ade80', padding:'7px', cursor:'pointer', fontSize:'0.82rem', fontFamily:'var(--f-body)', fontWeight:'700' }}>
                      {promo.active ? `🔴 ${t('dash_deactivate')}` : `🟢 ${t('dash_activate')}`}
                    </button>
                    <button onClick={()=>{ if(!confirm(t('dash_confirm_delete')))return; deletePromo(promo.id); showToast(t('dash_promo_deleted'),'error'); }}
                      style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', color:'#f87171', padding:'7px 10px', cursor:'pointer', fontSize:'0.85rem' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
