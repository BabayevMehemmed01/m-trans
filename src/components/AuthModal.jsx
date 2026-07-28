// =================================================================
// FAYL: src/components/AuthModal.jsx
// TƏSVİR: Giriş / Qeydiyyat Modal — Login + SignUp tabları
//         Premium Glassmorphism, i18n, RBAC
//         ⚠️  Admin credentials heç vaxt ekranda göstərilmir
// =================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const R      = '#E60000';
const GREEN  = '#22C55E';
const BORDER = 'rgba(255,255,255,0.1)';

// ── Reusable input ───────────────────────────────────────────────
function AuthInput({ label, name, type='text', value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display:'block', fontSize:'0.68rem', fontWeight:'800', color:'#5e748a', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px', fontFamily:'var(--f-mono)' }}>
        {label}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:'100%', boxSizing:'border-box',
          height:'46px', padding:'0 14px',
          background:'rgba(255,255,255,0.05)',
          border:`1px solid ${error ? 'rgba(239,68,68,0.5)' : focused ? `${R}50` : BORDER}`,
          borderRadius:'12px', color:'#e2e8f0',
          fontSize:'0.9rem', fontFamily:'var(--f-body)',
          outline:'none', transition:'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.1)' : `${R}15`}` : 'none',
        }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
export default function AuthModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    isAuthOpen, closeAuth,
    login, signUp,
    authError, clearError, isLoading,
  } = useAuth();

  const [tab, setTab]     = useState('login'); // 'login' | 'signup'
  const [shake, setShake] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email:'', password:'' });

  // Signup form
  const [signupForm, setSignupForm] = useState({ firstName:'', lastName:'', email:'', password:'', confirm:'' });
  const [signupErrors, setSignupErrors] = useState({});

  // Shake on error
  useEffect(() => {
    if (authError) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [authError]);

  // ESC key
  useEffect(() => {
    if (!isAuthOpen) return;
    const handler = e => { if (e.key === 'Escape') closeAuth(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAuthOpen, closeAuth]);

  // Body lock
  useEffect(() => {
    document.body.style.overflow = isAuthOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isAuthOpen]);

  if (!isAuthOpen) return null;

  // ── Tab switch ───────────────────────────────────────────────
  const switchTab = (t) => {
    setTab(t); clearError();
    setSignupErrors({});
    setShowPass(false);
  };

  // ── Login submit ─────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault();
    clearError();
    await login(loginForm.email, loginForm.password);
  };

  // ── Signup submit ────────────────────────────────────────────
  const handleSignup = async e => {
    e.preventDefault();
    clearError();
    const errs = {};
    if (!signupForm.firstName.trim()) errs.firstName = true;
    if (!signupForm.lastName.trim())  errs.lastName  = true;
    if (!signupForm.email.trim())     errs.email     = true;
    if (signupForm.password.length < 6) errs.password = true;
    if (signupForm.password !== signupForm.confirm) errs.confirm = true;
    if (Object.keys(errs).length) { setSignupErrors(errs); return; }
    setSignupErrors({});
    await signUp(signupForm);
  };

  const lf = (k) => e => setLoginForm(p => ({ ...p, [k]: e.target.value }));
  const sf = (k) => e => setSignupForm(p => ({ ...p, [k]: e.target.value }));

  const tabStyle = (key) => ({
    flex:1, padding:'10px', border:'none', cursor:'pointer',
    fontWeight:'800', fontSize:'0.88rem', fontFamily:'var(--f-display)',
    background: tab===key ? (key==='login' ? R : GREEN) : 'rgba(255,255,255,0.04)',
    color: tab===key ? '#fff' : '#5e748a',
    borderRadius: key==='login' ? '10px 0 0 10px' : '0 10px 10px 0',
    transition:'all 0.2s',
    boxShadow: tab===key ? `0 4px 14px ${(key==='login'?R:GREEN)}40` : 'none',
  });

  return (
    <>
      <style>{`
        @keyframes authFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes authSlideUp { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes authShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
        .auth-modal-card { animation: authSlideUp 0.36s cubic-bezier(0.22,1,0.36,1); }
        .auth-modal-card--shake { animation: authShake 0.5s ease; }
        .auth-overlay { animation: authFadeIn 0.2s ease; }
      `}</style>

      {/* Overlay */}
      <div
        className="auth-overlay"
        onClick={closeAuth}
        style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)' }}
      />

      {/* Modal */}
      <div style={{ position:'fixed', inset:0, zIndex:2001, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div
          className={`auth-modal-card${shake?' auth-modal-card--shake':''}`}
          style={{
            width:'100%', maxWidth:'440px',
            background:'rgba(13,17,23,0.97)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'24px',
            padding:'32px',
            boxShadow:'0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            backdropFilter:'blur(20px)',
            position:'relative',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={closeAuth}
            style={{ position:'absolute', top:'18px', right:'18px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'#6b7a8d', width:'32px', height:'32px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', transition:'all 0.2s' }}
          >✕</button>

          {/* Logo / Brand */}
          <div style={{ textAlign:'center', marginBottom:'24px' }}>
            <img src="/M-Trans_logo_dark_site.png" alt="M-Trans" style={{ height:'40px', marginBottom:'14px', filter:'drop-shadow(0 4px 14px rgba(230,0,0,0.3))' }} onError={e=>e.target.style.display='none'} />
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(230,0,0,0.08)', border:'1px solid rgba(230,0,0,0.18)', borderRadius:'16px', padding:'4px 12px', marginBottom:'10px' }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:R, display:'inline-block', boxShadow:`0 0 6px ${R}` }} />
              <span style={{ fontFamily:'var(--f-mono)', fontSize:'0.62rem', color:'#ff8080', fontWeight:'800', letterSpacing:'2px', textTransform:'uppercase' }}>M-TRANS</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', marginBottom:'24px', borderRadius:'12px', overflow:'hidden', border:`1px solid ${BORDER}` }}>
            <button style={tabStyle('login')}  onClick={() => switchTab('login')}>
              🔐 {t('auth_tab_login')}
            </button>
            <button style={tabStyle('signup')} onClick={() => switchTab('signup')}>
              ✨ {t('auth_tab_signup')}
            </button>
          </div>

          {/* ── LOGIN FORM ──────────────────────────────── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <AuthInput
                label={t('auth_email_label')}
                name="email" type="email"
                value={loginForm.email}
                onChange={e => { clearError(); lf('email')(e); }}
                placeholder="email@example.com"
                error={!!authError}
              />
              <div style={{ position:'relative' }}>
                <AuthInput
                  label={t('auth_password_label')}
                  name="password" type={showPass?'text':'password'}
                  value={loginForm.password}
                  onChange={e => { clearError(); lf('password')(e); }}
                  placeholder="••••••••"
                  error={!!authError}
                />
                <button
                  type="button" onClick={() => setShowPass(s=>!s)}
                  style={{ position:'absolute', right:'12px', bottom:'10px', background:'none', border:'none', color:'#5e748a', cursor:'pointer', fontSize:'1rem', padding:'4px' }}
                >{showPass?'🙈':'👁️'}</button>
              </div>

              {authError && (
                <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'10px', padding:'9px 14px', display:'flex', alignItems:'center', gap:'7px' }}>
                  <span>⚠️</span>
                  <span style={{ color:'#f87171', fontSize:'0.82rem', fontFamily:'var(--f-body)' }}>{t(authError)}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading} style={{
                width:'100%', height:'48px', background:isLoading?'rgba(230,0,0,0.5)':R,
                color:'#fff', border:'none', borderRadius:'12px', fontWeight:'900',
                fontSize:'0.95rem', cursor:isLoading?'not-allowed':'pointer',
                fontFamily:'var(--f-display)',
                boxShadow:`0 6px 20px ${R}35`,
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                transition:'all 0.2s',
              }}>
                {isLoading
                  ? <><span style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/> {t('auth_loading')}</>
                  : <>{t('auth_login_btn')} →</>
                }
              </button>

              {/* Sistem xəbərdarlığı — admin məlumatları göstərilmir */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'10px 14px' }}>
                <p style={{ color:'#3d4f62', fontSize:'0.7rem', fontFamily:'var(--f-mono)', margin:0, lineHeight:1.6 }}>
                  🔒 {t('auth_secure_note')}
                </p>
              </div>

              <p style={{ textAlign:'center', color:'#4e6074', fontSize:'0.82rem', margin:0 }}>
                {t('auth_no_account')}{' '}
                <button type="button" onClick={() => switchTab('signup')} style={{ background:'none', border:'none', color:'#60a5fa', fontWeight:'800', cursor:'pointer', fontSize:'0.82rem', fontFamily:'var(--f-body)', textDecoration:'underline' }}>
                  {t('auth_go_signup')}
                </button>
              </p>
            </form>
          )}

          {/* ── SIGNUP FORM ─────────────────────────────── */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <AuthInput
                  label={t('auth_firstname')} name="firstName"
                  value={signupForm.firstName} onChange={e => { clearError(); sf('firstName')(e); }}
                  placeholder={t('auth_firstname_ph')} error={signupErrors.firstName}
                />
                <AuthInput
                  label={t('auth_lastname')} name="lastName"
                  value={signupForm.lastName} onChange={e => { clearError(); sf('lastName')(e); }}
                  placeholder={t('auth_lastname_ph')} error={signupErrors.lastName}
                />
              </div>
              <AuthInput
                label={t('auth_email_label')} name="email" type="email"
                value={signupForm.email} onChange={e => { clearError(); sf('email')(e); }}
                placeholder="email@example.com" error={signupErrors.email || !!authError}
              />
              <div style={{ position:'relative' }}>
                <AuthInput
                  label={t('auth_password_label')} name="password" type={showPass?'text':'password'}
                  value={signupForm.password} onChange={e => { clearError(); sf('password')(e); }}
                  placeholder={t('auth_pass_min')} error={signupErrors.password}
                />
                <button type="button" onClick={() => setShowPass(s=>!s)}
                  style={{ position:'absolute', right:'12px', bottom:'10px', background:'none', border:'none', color:'#5e748a', cursor:'pointer', fontSize:'1rem', padding:'4px' }}>
                  {showPass?'🙈':'👁️'}
                </button>
              </div>
              <AuthInput
                label={t('auth_confirm_pass')} name="confirm" type={showPass?'text':'password'}
                value={signupForm.confirm} onChange={sf('confirm')}
                placeholder="••••••••" error={signupErrors.confirm}
              />

              {/* Field errors */}
              {Object.keys(signupErrors).length > 0 && (
                <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', padding:'9px 14px' }}>
                  <span style={{ color:'#f87171', fontSize:'0.8rem' }}>
                    {signupErrors.confirm ? '⚠️ '+t('auth_pass_mismatch') :
                     signupErrors.password ? '⚠️ '+t('auth_pass_short') :
                     '⚠️ '+t('auth_fill_required')}
                  </span>
                </div>
              )}
              {authError && (
                <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', padding:'9px 14px', color:'#f87171', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:'7px' }}>
                  ⚠️ {t(authError)}
                </div>
              )}

              {/* Role info */}
              <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.18)', borderRadius:'10px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'1rem' }}>👤</span>
                <span style={{ color:'#60a5fa', fontSize:'0.78rem', fontFamily:'var(--f-body)', lineHeight:1.5 }}>
                  {t('auth_signup_role_info')}
                </span>
              </div>

              <button type="submit" disabled={isLoading} style={{
                width:'100%', height:'48px', background:isLoading?'rgba(34,197,94,0.5)':GREEN,
                color:'#fff', border:'none', borderRadius:'12px', fontWeight:'900',
                fontSize:'0.95rem', cursor:isLoading?'not-allowed':'pointer',
                fontFamily:'var(--f-display)',
                boxShadow:`0 6px 20px ${GREEN}35`,
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                transition:'all 0.2s',
              }}>
                {isLoading
                  ? <><span style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/> {t('auth_loading')}</>
                  : <>{t('auth_signup_btn')} →</>
                }
              </button>

              <p style={{ textAlign:'center', color:'#4e6074', fontSize:'0.82rem', margin:0 }}>
                {t('auth_have_account')}{' '}
                <button type="button" onClick={() => switchTab('login')} style={{ background:'none', border:'none', color:'#f87171', fontWeight:'800', cursor:'pointer', fontSize:'0.82rem', fontFamily:'var(--f-body)', textDecoration:'underline' }}>
                  {t('auth_go_login')}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
