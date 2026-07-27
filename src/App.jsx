// =================================================================
// FAYL: src/App.jsx
// TƏSVİR: Sadələşdirilmiş App Router — Preloader index.html-dədir
// =================================================================

import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import InquiryDrawer from './components/InquiryDrawer';
import PartDetailModal from './components/PartDetailModal';
import { InquiryProvider } from './context/InquiryContext';

// Səhifələrin İmportu
import Home from './pages/Home';
import SpareParts from './pages/SpareParts';
import About from './pages/About';
import Partners from './pages/Partners';
import Vacancies from './pages/Vacancies';
import Contact from './pages/Contact';

// ============================================================
// SCROLL REVEAL OBSERVER
// Route dəyişdikdə yeni render olan elementlər üçün animasiya
// ============================================================
function ScrollRevealObserver() {
  const location = useLocation();
  const observerRef = useRef(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -40px 0px', threshold: 0.08 }
    );

    observerRef.current = observer;

    const timer = setTimeout(() => {
      const revealEls = document.querySelectorAll('.reveal-up:not(.active), .fade-in-up:not(.active)');
      revealEls.forEach((el) => observer.observe(el));
    }, 120);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <InquiryProvider>
      <Router>
        <ScrollToTop />
        <ScrollRevealObserver />
        <Header />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/spare-parts" element={<SpareParts />} />
          <Route path="/catalog" element={<SpareParts />} />
          <Route path="/about" element={<About />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/vacancies" element={<Vacancies />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Routes>

        <InquiryDrawer />
        <PartDetailModal />

        <Footer />
      </Router>
    </InquiryProvider>
  );
}

export default App;