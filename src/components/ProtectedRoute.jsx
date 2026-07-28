// =================================================================
// FAYL: src/components/ProtectedRoute.jsx
// TƏSVİR: Role-based access control
//   - isAuthenticated deyilsə → openAuth() modal açır + / redirect
//   - Admin deyilsə → / redirect (access denied)
// =================================================================

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = true }) {
  const { isAuthenticated, isAdmin, openAuth } = useAuth();
  const location = useLocation();

  // Giriş edilməyibsə modal aç
  useEffect(() => {
    if (!isAuthenticated) {
      openAuth();
    }
  }, [isAuthenticated, openAuth]);

  // Giriş edilməyibsə ana səhifəyə yönləndir (modal açıq olacaq)
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Admin deyilsə (user rolu) — ana səhifəyə yönləndir
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
