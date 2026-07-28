// =================================================================
// FAYL: src/App.jsx
// TƏSVİR: App Router — AuthProvider → AdminProvider → CartProvider
//         → InquiryProvider → Router (düzgün sıra)
//         AuthModal global — hər səhifədən açılır
// =================================================================

import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import ScrollToTop     from './components/ScrollToTop';
import Header          from './components/Header';
import Footer          from './components/Footer';
import InquiryDrawer   from './components/InquiryDrawer';
import PartDetailModal from './components/PartDetailModal';
import CartDrawer      from './components/CartDrawer';
import AuthModal       from './components/AuthModal';
import ProtectedRoute  from './components/ProtectedRoute';

import { AuthProvider }    from './context/AuthContext';
import { AdminProvider }   from './context/AdminContext';
import { CartProvider }    from './context/CartContext';
import { InquiryProvider } from './context/InquiryContext';

import Home       from './pages/Home';
import SpareParts from './pages/SpareParts';
import About      from './pages/About';
import Partners   from './pages/Partners';
import Vacancies  from './pages/Vacancies';
import Contact    from './pages/Contact';
import Dashboard  from './pages/Dashboard';

// ── Scroll Reveal (Router içərisində — useLocation üçün) ─────────
function ScrollRevealObserver() {
  const location    = useLocation();
  const observerRef = useRef(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('active'); observer.unobserve(entry.target); }
      }),
      { rootMargin: '0px 0px -40px 0px', threshold: 0.08 }
    );
    observerRef.current = observer;
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal-up:not(.active), .fade-in-up:not(.active)')
        .forEach(el => observer.observe(el));
    }, 120);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [location.pathname]);

  return null;
}

// ── Bütün route + layout ─────────────────────────────────────────
function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <ScrollRevealObserver />
      <Header />

      <Routes>
        {/* Public */}
        <Route path="/"            element={<Home />} />
        <Route path="/spare-parts" element={<SpareParts />} />
        <Route path="/catalog"     element={<SpareParts />} />
        <Route path="/about"       element={<About />} />
        <Route path="/partners"    element={<Partners />} />
        <Route path="/vacancies"   element={<Vacancies />} />
        <Route path="/contact"     element={<Contact />} />

        {/* Protected — yalnız admin rolu */}
        <Route path="/dashboard"   element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/inventory"   element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/admin"       element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*"            element={<Home />} />
      </Routes>

      {/* Global Drawers & Modals */}
      <InquiryDrawer />
      <PartDetailModal />
      <CartDrawer />
      <AuthModal />   {/* 🔐 Global — hər səhifədən openAuth() ilə açılır */}

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <CartProvider>
          <InquiryProvider>
            <Router>
              <AppRoutes />
            </Router>
          </InquiryProvider>
        </CartProvider>
      </AdminProvider>
    </AuthProvider>
  );
}