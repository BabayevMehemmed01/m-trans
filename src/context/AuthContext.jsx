// =================================================================
// FAYL: src/context/AuthContext.jsx
// TƏSVİR: Email-based Auth + RBAC (user / admin)
//         localStorage mock DB — prod-da backend API ilə əvəz edilər
// =================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// ── localStorage açarları ────────────────────────────────────────
const KEY_USERS   = 'mtrans_users_db';
const KEY_SESSION = 'mtrans_auth_token';

// ── Default istifadəçilər (mock DB seed) ────────────────────────
const SEED_USERS = [
  {
    id: 'u_admin_001',
    email: 'birlik1020@gmail.com',
    password: '123456',                  // Real appda hash edilər
    role: 'admin',
    firstName: 'Baş',
    lastName: 'Anbardar',
    displayName: 'Baş Anbardar',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  // Korporativ domenli nümunə — real istifadəçi üçün yox, şablon
  // { email: 'manager@m-trans.az', password: '...', role: 'admin', ... }
];

// ── Helpers ──────────────────────────────────────────────────────
function loadUsers() {
  try {
    const raw = localStorage.getItem(KEY_USERS);
    if (raw) return JSON.parse(raw);
    // İlk yükləmədə seed data-nı yaz
    localStorage.setItem(KEY_USERS, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  } catch { return SEED_USERS; }
}

function saveUsers(users) {
  try { localStorage.setItem(KEY_USERS, JSON.stringify(users)); } catch {}
}

function generateToken(user) {
  const payload = {
    id:    user.id,
    email: user.email,
    role:  user.role,
    exp:   Date.now() + 24 * 60 * 60 * 1000, // 24 saat
  };
  return `mtrans.${btoa(JSON.stringify(payload))}.v2`;
}

function parseToken(token) {
  try {
    if (!token || !token.startsWith('mtrans.')) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) return null;   // Vaxtı keçib
    return payload;
  } catch { return null; }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function loadSession() {
  try {
    const token   = localStorage.getItem(KEY_SESSION);
    const payload = parseToken(token);
    if (!payload) return { user: null, token: null };

    const users = loadUsers();
    const found = users.find(u => u.id === payload.id && u.email === payload.email);
    if (!found) return { user: null, token: null };

    return {
      token,
      user: {
        id: found.id, email: found.email,
        role: found.role, displayName: found.displayName,
        firstName: found.firstName, lastName: found.lastName,
      },
    };
  } catch { return { user: null, token: null }; }
}

// ════════════════════════════════════════════════════════════════
export function AuthProvider({ children }) {
  const initial = loadSession();
  const [user,       setUser]       = useState(initial.user);
  const [token,      setToken]      = useState(initial.token);
  const [authError,  setAuthError]  = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);  // Modal açıq/bağlı

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';

  // ── OPEN / CLOSE Modal ───────────────────────────────────────
  const openAuth  = useCallback(() => { setIsAuthOpen(true);  setAuthError(''); }, []);
  const closeAuth = useCallback(() => { setIsAuthOpen(false); setAuthError(''); }, []);
  const clearError = useCallback(() => setAuthError(''), []);

  // ── LOGIN ────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError('');
    await new Promise(r => setTimeout(r, 500)); // UI feedback

    const users = loadUsers();
    const found = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
        && u.password === password
    );

    if (!found) {
      setAuthError('auth_invalid_credentials');
      setIsLoading(false);
      return false;
    }

    const newToken = generateToken(found);
    const userData = {
      id: found.id, email: found.email,
      role: found.role, displayName: found.displayName,
      firstName: found.firstName, lastName: found.lastName,
    };

    localStorage.setItem(KEY_SESSION, newToken);
    setToken(newToken);
    setUser(userData);
    setIsLoading(false);
    setIsAuthOpen(false);
    return true;
  }, []);

  // ── SIGN UP ──────────────────────────────────────────────────
  const signUp = useCallback(async ({ firstName, lastName, email, password }) => {
    setIsLoading(true);
    setAuthError('');
    await new Promise(r => setTimeout(r, 500));

    if (!validateEmail(email)) {
      setAuthError('auth_invalid_email');
      setIsLoading(false);
      return false;
    }

    const users = loadUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      setAuthError('auth_email_exists');
      setIsLoading(false);
      return false;
    }

    const newUser = {
      id: `u_${Date.now()}`,
      email: email.trim().toLowerCase(),
      password,
      role: 'user',                          // Yeni qeydiyyat → hər zaman 'user'
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      displayName: `${firstName.trim()} ${lastName.trim()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    const newToken = generateToken(newUser);
    const userData = {
      id: newUser.id, email: newUser.email,
      role: newUser.role, displayName: newUser.displayName,
      firstName: newUser.firstName, lastName: newUser.lastName,
    };

    localStorage.setItem(KEY_SESSION, newToken);
    setToken(newToken);
    setUser(userData);
    setIsLoading(false);
    setIsAuthOpen(false);
    return true;
  }, []);

  // ── LOGOUT ───────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(KEY_SESSION);
    setToken(null);
    setUser(null);
    setAuthError('');
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated, isAdmin,
      login, signUp, logout,
      authError, clearError, isLoading,
      isAuthOpen, openAuth, closeAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
