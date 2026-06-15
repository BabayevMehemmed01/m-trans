import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [typewriterText, setTypewriterText] = useState('');

  // TƏRCÜMƏ OLUNMUŞ SÖZLƏR ÜÇÜN TYPEWRITER
  useEffect(() => {
    const words = [
      t('word_sea'),
      t('word_air'),
      t('word_rail'),
      t('word_road')
    ];
    let wordIndex = 0;
    let isDeleting = false;
    let text = words[0];
    setTypewriterText(text);
    let timer;

    const type = () => {
      const currentWord = words[wordIndex];
      if (isDeleting) {
        text = currentWord.substring(0, text.length - 1);
      } else {
        text = currentWord.substring(0, text.length + 1);
      }
      
      setTypewriterText(text);

      let typeSpeed = isDeleting ? 40 : 100;

      if (!isDeleting && text === currentWord) {
        typeSpeed = 2500;
        isDeleting = true;
      } else if (isDeleting && text === '') {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500;
      }
      
      timer = setTimeout(type, typeSpeed);
    };
    
    timer = setTimeout(type, 1500);
    return () => clearTimeout(timer);
  }, [i18n.language, t]);

  // RƏQƏMLƏRİN ANİMASİYASI
  useEffect(() => {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseFloat(counter.getAttribute('data-target'));
          const isDecimal = target % 1 !== 0;
          const startVal = target * 0.6; 
          
          let startTimestamp = null;
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / 2000, 1);
            const currentVal = startVal + (progress * (target - startVal));
            counter.innerText = (isDecimal ? currentVal.toFixed(1) : Math.floor(currentVal));
            
            if (progress < 1) { window.requestAnimationFrame(step); } 
            else { counter.innerText = target; }
          };
          window.requestAnimationFrame(step);
          obs.unobserve(counter);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.counter').forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <style>{`
        @keyframes blinkCursor { 0%, 100% { border-color: transparent; } 50% { border-color: var(--red); } }
        .typewriter-text { border-right: 2px solid var(--red); padding-right: 4px; animation: blinkCursor 0.8s infinite; }
      `}</style>

      {/* --- HERO BÖLMƏSİ --- */}
      <header className="hero">
        <div className="hero-map" aria-hidden="true">
          <div className="glow-orb orb-red"></div>
          <div className="glow-orb orb-dark"></div>
          <div className="hero-grid"></div>
          
          <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className="network-svg">
            <defs>
              <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(230,0,0,0)" />
                <stop offset="50%" stopColor="rgba(255,77,77,1)" />
                <stop offset="100%" stopColor="rgba(255,255,255,1)" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path className="net-line" d="M -100 450 C 200 350, 300 200, 500 150 C 700 100, 900 300, 1300 250" />
            <path className="net-line" d="M -100 200 C 150 250, 400 450, 700 400 C 900 350, 1000 200, 1300 150" />
            <path className="net-line" d="M 200 650 C 300 400, 600 200, 800 -50" />
            <path className="light-beam" d="M -100 450 C 200 350, 300 200, 500 150 C 700 100, 900 300, 1300 250" />
            <path className="light-beam delay-1" d="M -100 200 C 150 250, 400 450, 700 400 C 900 350, 1000 200, 1300 150" />
            <path className="light-beam delay-2" d="M 200 650 C 300 400, 600 200, 800 -50" />
            <g className="net-nodes">
              <circle cx="800" cy="180" r="4.5" />
              <circle cx="700" cy="400" r="4" />
              <circle cx="1050" cy="240" r="5" />
              <circle cx="600" cy="200" r="4.5" />
              <circle cx="400" cy="450" r="4" />
            </g>
          </svg>
        </div>

        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow fade-in-up" style={{ animationDelay: '0.1s' }}>{t('hero_badge')}</span>
            <h1 className="fade-in-up" style={{ animationDelay: '0.2s' }}>{t('hero_t1')}<br /><em>{t('hero_t2')}</em></h1>
            <p className="lead fade-in-up" style={{ animationDelay: '0.3s' }}>
              <span className="typewriter-text">{typewriterText}</span> 
              <span> {t('hero_desc')}</span>
            </p>
            
            <div className="hero-stats fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="hstat"><div className="n"><span className="counter" data-target="120">0</span>+</div><div className="l">{t('stat_c')}</div></div>
              <div className="hstat"><div className="n"><span className="counter" data-target="15">0</span>K+</div><div className="l">{t('stat_a')}</div></div>
              <div className="hstat"><div className="n"><span className="counter" data-target="98.6">0.0</span>%</div><div className="l">{t('stat_o')}</div></div>
              <div className="hstat"><div className="n"><span className="counter" data-target="12">0</span></div><div className="l">{t('stat_e')}</div></div>
            </div>
          </div>
        </div>
      </header>

      {/* --- HAQQIMIZDA --- */}
      <section className="section about" id="haqqimizda">
        <div className="wrap">
          <div className="about-grid">
            <div className="about-text">
              <span className="eyebrow">{t('about_eyebrow')}</span>
              <h2 className="sec-title">{t('about_title')}</h2>
              <p className="sec-lead" style={{ maxWidth: '100%', textAlign: 'justify', marginTop: '18px', marginBottom: '24px' }}>
                {t('about_desc')}
              </p>
              <Link to="/about" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '10px' }}>{t('about_btn')}</Link>
            </div>
            <div className="about-image">
              <img src="/m-trans-main.jpeg" alt="M-Trans Haqqında" style={{ width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 50px -15px rgba(17,17,17,0.3)', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      {/* --- NİYƏ BİZ --- */}
      <section className="section why" id="ustunlukler">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow reveal-up" style={{ transitionDelay: '0.1s' }}>{t('why_eyebrow')}</span>
            <h2 className="sec-title reveal-up" style={{ transitionDelay: '0.2s' }}>{t('why_title')}</h2>
          </div>
          <div className="why-grid">
            <div className="why-card reveal-up" style={{ transitionDelay: '0.3s' }}>
              <div className="why-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg></div>
              <h3>{t('why_c1_title')}</h3>
              <p>{t('why_c1_desc')}</p>
            </div>
            <div className="why-card reveal-up" style={{ transitionDelay: '0.4s' }}>
              <div className="why-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3L5 13h5l-1 8 8-11h-5l1-7z"/></svg></div>
              <h3>{t('why_c2_title')}</h3>
              <p>{t('why_c2_desc')}</p>
            </div>
            <div className="why-card reveal-up" style={{ transitionDelay: '0.5s' }}>
              <div className="why-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12a7 7 0 0 1 14 0"/><rect x="3.5" y="12" width="3.5" height="6" rx="1.6"/><rect x="17" y="12" width="3.5" height="6" rx="1.6"/><path d="M19 18v1a3 3 0 0 1-3 3h-3"/></svg></div>
              <h3>{t('why_c3_title')}</h3>
              <p>{t('why_c3_desc')}</p>
            </div>
            <div className="why-card reveal-up" style={{ transitionDelay: '0.6s' }}>
              <div className="why-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18" strokeLinecap="round"/><ellipse cx="12" cy="12" rx="4" ry="9"/></svg></div>
              <h3>{t('why_c4_title')}</h3>
              <p>{t('why_c4_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- XİDMƏTLƏRİMİZ --- */}
      <section className="section services" id="xidmetler">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">{t('srv_eyebrow')}</span>
            <h2 className="sec-title">{t('srv_title')}</h2>
            <p className="sec-lead">{t('srv_desc')}</p>
          </div>
          <div className="srv-grid">
            
            <HashLink smooth to="/services#deniz" className="srv-card reveal-up">
              <div className="srv-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l1.5 3.5h15L21 17"/><path d="M5 17V9h14v8"/><path d="M12 9V4M9 6h6"/></svg></div>
              <h3>{t('srv_sea')}</h3>
              <p>{t('srv_sea_desc')}</p>
              <span className="srv-link">{t('srv_more')} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
            </HashLink>

            <HashLink smooth to="/services#hava" className="srv-card reveal-up" style={{ transitionDelay: '0.1s' }}>
              <div className="srv-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3 15 21l-3.5-7L4 10.5 22 3z"/></svg></div>
              <h3>{t('srv_air')}</h3>
              <p>{t('srv_air_desc')}</p>
              <span className="srv-link">{t('srv_more')} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
            </HashLink>

            <HashLink smooth to="/services#quru" className="srv-card reveal-up" style={{ transitionDelay: '0.2s' }}>
              <div className="srv-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="11" height="9" rx="1"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg></div>
              <h3>{t('srv_road')}</h3>
              <p>{t('srv_road_desc')}</p>
              <span className="srv-link">{t('srv_more')} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
            </HashLink>

            <HashLink smooth to="/services#demir" className="srv-card reveal-up">
              <div className="srv-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="2" ry="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l-2 3"/><path d="M16 19l2 3"/></svg></div>
              <h3>{t('srv_rail')}</h3>
              <p>{t('srv_rail_desc')}</p>
              <span className="srv-link">{t('srv_more')} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
            </HashLink>

            <Link to="/repair" className="srv-card reveal-up" style={{ transitionDelay: '0.1s' }}>
              <div className="srv-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
              <h3>{t('srv_repair')}</h3>
              <p>{t('srv_rep_desc')}</p>
              <span className="srv-link">{t('srv_more')} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
            </Link>

            <Link to="/spare-parts" className="srv-card reveal-up" style={{ transitionDelay: '0.2s' }}>
              <div className="srv-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
              <h3>{t('srv_parts')}</h3>
              <p>{t('srv_parts_desc')}</p>
              <span className="srv-link">{t('srv_more')} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
            </Link>

          </div>
        </div>
      </section>
    </main>
  );
}