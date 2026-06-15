import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';

// Səhifələrin İmportu
import Home from './pages/Home';
import Tools from './pages/Tools';
import Services from './pages/Services';
import Repair from './pages/Repair';
import About from './pages/About';
import Partners from './pages/Partners';
import Vacancies from './pages/Vacancies';
import Contact from './pages/Contact';
import SpareParts from './pages/SpareParts';

// Animasiya və Preloader İdarəedicisi
function RouteChangeHandler({ children }) {
  const location = useLocation();

  useEffect(() => {
    // 1. QLOBAL ANİMASİYA MƏNTİQİ (Avtomatik tətbiq)
    // Saytdakı bütün bu elementləri tapıb avtomatik animasiya class-ı veririk
    const autoAnimateTags = document.querySelectorAll(
      '.mtrans-partner-card, .cert-card, .mtrans-contact-card, .vac-card, .about-text-p, .about-image img, .about-video-decor video, .process-step, h2, h3'
    );
    
    autoAnimateTags.forEach(el => {
      // Əgər elementin üstündə animasiya class-ı yoxdursa, əlavə edirik
      if (!el.classList.contains('reveal-up') && !el.classList.contains('fade-in-up')) {
        el.classList.add('reveal-up');
      }
    });

    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const scrollObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-up, .fade-in-up');
    revealElements.forEach(el => {
      el.classList.remove('active'); // Səhifə dəyişəndə animasiyanı sıfırlayır
      scrollObserver.observe(el);
    });

    // 2. PRELOADER YENİDƏN İŞƏ SALINIR VƏ SÜRƏTİ NİZAMLANIR
    const loader = document.getElementById('loader');
    const ldFill = document.getElementById('ldFill');
    const ldPct = document.getElementById('ldPct');
    const ldTruck = document.getElementById('ldTruck');

    if (loader) {
      loader.classList.remove('done');
      document.body.classList.add('locked');
      
      let progress = 0;
      // Əvvəl 50ms idi, indi 120ms edirik (Daha yavaş və stabil)
      const interval = setInterval(() => {
        // Artım sürətini də azaltdıq: hər addımda 2% ilə 10% arası artsın
        progress += Math.floor(Math.random() * 8) + 2; 
        if (progress >= 100) progress = 100;

        if (ldFill) ldFill.style.width = progress + '%';
        if (ldTruck) ldTruck.style.left = progress + '%';
        if (ldPct) ldPct.textContent = progress + '%';

        if (progress === 100) {
          clearInterval(interval);
          setTimeout(() => {
            loader.classList.add('done');
            document.body.classList.remove('locked');
          }, 500); // 100% olduqdan sonra yarım saniyə gözləyib ekranı açır
        }
      }, 120); 
    }
  }, [location.pathname]);

  return children;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Header />
      
      <RouteChangeHandler>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/services" element={<Services />} />
          <Route path="/repair" element={<Repair />} />
          <Route path="/about" element={<About />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/vacancies" element={<Vacancies />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/spare-parts" element={<SpareParts />} />
        </Routes>
      </RouteChangeHandler>

      <Footer />
    </Router>
  );
}

export default App;