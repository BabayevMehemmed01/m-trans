// =================================================================
// FAYL: src/pages/AdminLogin.jsx
// TƏSVİR: Anbardar Giriş Səhifəsi — Premium Dark Glassmorphism
// =================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, isAuthenticated, loginError, clearError, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  // Artıq daxil olubsa dashboarda yönləndir
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Xəta olduqda shake animasiyası
  useEffect(() => {
    if (loginError) {
      setShakeForm(true);
      const t = setTimeout(() => setShakeForm(false), 600);
      return () => clearTimeout(t);
    }
  }, [loginError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await login(username, password);
    if (!ok) { /* loginError set by AuthContext */ }
  };

  return (
    <>
      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-10px); }
          40%     { transform: translateX(10px); }
          60%     { transform: translateX(-8px); }
          80%     { transform: translateX(8px); }
        }
        @keyframes loginPulse {
          0%,100% { opacity: 0.4; }
          50%     { opacity: 0.8; }
        }
        .login-card { animation: loginFadeIn 0.5s cubic-bezier(0.22,1,0.36,1); }
        .login-card--shake { animation: loginShake 0.5s ease; }
        .login-input { transition: border-color 0.2s, box-shadow 0.2s; }
        .login-input:focus { 
          border-color: rgba(230,0,0,0.5) !important; 
          box-shadow: 0 0 0 3px rgba(230,0,0,0.1) !important;
          outline: none;
        }
        .login-btn { transition: all 0.2s; }
        .login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(230,0,0,0.4) !important; }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-bg-orb { animation: loginPulse 4s ease-in-out infinite; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(230,0,0,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.04) 0%, transparent 60%), #0a0d12',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', position: 'relative', overflow: 'hidden',
      }}>

        {/* Background orbs */}
        <div className="login-bg-orb" style={{ position: 'absolute', top: '15%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(230,0,0,0.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div className="login-bg-orb" style={{ position: 'absolute', bottom: '15%', right: '10%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(59,130,246,0.04)', filter: 'blur(80px)', pointerEvents: 'none', animationDelay: '2s' }} />

        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

          {/* Logo & Brand */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img src="/M-Trans_logo_dark_site.png" alt="M-Trans"
              style={{ height: '52px', marginBottom: '20px', filter: 'drop-shadow(0 4px 16px rgba(230,0,0,0.3))' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(230,0,0,0.1)', border: '1px solid rgba(230,0,0,0.2)', borderRadius: '20px', padding: '5px 14px', marginBottom: '14px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E60000', display: 'inline-block', boxShadow: '0 0 8px #E60000' }} />
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', color: '#ff6060', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {t('auth_badge')}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.9rem', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              {t('auth_title')}
            </h1>
            <p style={{ color: '#4a5e72', fontSize: '0.88rem', marginTop: '8px', fontFamily: 'var(--f-body)' }}>
              {t('auth_subtitle')}
            </p>
          </div>

          {/* Login Card */}
          <div
            className={`login-card${shakeForm ? ' login-card--shake' : ''}`}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '36px',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Username */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'var(--f-mono)' }}>
                  {t('auth_username_label')}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4a5e72', fontSize: '0.9rem' }}>👤</span>
                  <input
                    className="login-input"
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); clearError(); }}
                    placeholder={t('auth_username_ph')}
                    autoComplete="username"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      height: '48px', paddingLeft: '42px', paddingRight: '14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${loginError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '12px', color: '#e2e8f0',
                      fontSize: '0.92rem', fontFamily: 'var(--f-body)',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'var(--f-mono)' }}>
                  {t('auth_password_label')}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4a5e72', fontSize: '0.9rem' }}>🔒</span>
                  <input
                    className="login-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearError(); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      height: '48px', paddingLeft: '42px', paddingRight: '48px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${loginError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '12px', color: '#e2e8f0',
                      fontSize: '0.92rem', fontFamily: 'var(--f-body)',
                    }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4a5e72', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {loginError && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.9rem' }}>⚠️</span>
                  <span style={{ color: '#f87171', fontSize: '0.83rem', fontFamily: 'var(--f-body)' }}>
                    {t(loginError) || t('auth_invalid_credentials')}
                  </span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="login-btn"
                style={{
                  width: '100%', height: '50px',
                  background: isLoading ? 'rgba(230,0,0,0.5)' : '#E60000',
                  color: '#fff', border: 'none', borderRadius: '14px',
                  fontWeight: '900', fontSize: '0.95rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--f-display)',
                  boxShadow: '0 6px 20px rgba(230,0,0,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  letterSpacing: '0.3px',
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    {t('auth_loading')}
                  </>
                ) : (
                  <>{t('auth_login_btn')} →</>
                )}
              </button>
            </form>

            {/* Hint */}
            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
              <p style={{ color: '#3a4d5e', fontSize: '0.72rem', fontFamily: 'var(--f-mono)', margin: 0, lineHeight: 1.6 }}>
                🔑 <strong style={{ color: '#4a5e72' }}>Demo:</strong> admin / admin1234
                <br />
                🔑 anbardar / mtrans2024
              </p>
            </div>
          </div>

          {/* Back to site */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/" style={{ color: '#4a5e72', fontSize: '0.82rem', textDecoration: 'none', fontFamily: 'var(--f-mono)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#9aa8b6'}
              onMouseLeave={e => e.target.style.color = '#4a5e72'}
            >
              ← {t('auth_back_to_site')}
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
