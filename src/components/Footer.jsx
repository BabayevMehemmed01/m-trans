// =================================================================
// FAYL: src/components/Footer.jsx
// TƏSVİR: Yenidən yazılmış Ehtiyyat Hissələri Footer komponenti
// =================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer" style={{ background: 'var(--navy)', color: '#fff', paddingTop: '70px', paddingBottom: '30px', borderTop: '3px solid var(--red)' }}>
      <div className="wrap">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '40px', marginBottom: '50px' }}>

          {/* Şirkət Haqqında */}
          <div>
            <Link to="/" style={{ display: 'inline-block', marginBottom: '20px' }}>
              <img src="/M-Trans_logo_dark_site.png" alt="M-Trans Logistics" style={{ height: '42px', width: 'auto' }} />
            </Link>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
              {t('ft_brand_desc_parts')}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                ISO 9001:2015
              </span>
              <span style={{ backgroundColor: '#1e293b', color: '#4ade80', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                ISO 14001
              </span>
              <span style={{ backgroundColor: '#1e293b', color: '#facc15', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                ISO 45001
              </span>
            </div>
          </div>

          {/* Kateqoriyalar */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', marginBottom: '20px', letterSpacing: '0.5px' }}>
              {t('ft_heading_categories')}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><Link to="/spare-parts" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>{t('parts_category_brakes')}</Link></li>
              <li><Link to="/spare-parts" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>{t('parts_category_pneumatics')}</Link></li>
              <li><Link to="/spare-parts" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>{t('parts_category_filters')}</Link></li>
              <li><Link to="/spare-parts" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>{t('parts_category_electronics')}</Link></li>
              <li><Link to="/spare-parts" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>{t('parts_category_suspension')}</Link></li>
              <li><Link to="/spare-parts" style={{ color: '#94a3b8', transition: 'color 0.2s' }}>{t('parts_category_transmission')}</Link></li>
            </ul>
          </div>

          {/* İstehsalçı Brendlər */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', marginBottom: '20px', letterSpacing: '0.5px' }}>
              {t('ft_heading_brands')}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><Link to="/partners" style={{ color: '#94a3b8' }}>Knorr-Bremse OEM</Link></li>
              <li><Link to="/partners" style={{ color: '#94a3b8' }}>WABCO Systems</Link></li>
              <li><Link to="/partners" style={{ color: '#94a3b8' }}>Hengst Filtration</Link></li>
              <li><Link to="/partners" style={{ color: '#94a3b8' }}>Sachs Shock Absorbers</Link></li>
              <li><Link to="/partners" style={{ color: '#94a3b8' }}>Bosch Commercial</Link></li>
              <li><Link to="/partners" style={{ color: '#94a3b8' }}>Volvo & Mercedes Parts</Link></li>
            </ul>
          </div>

          {/* Əlaqə & Mərkəzi Ofis */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', marginBottom: '20px', letterSpacing: '0.5px' }}>
              {t('contact_heading')}
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>
              📍 {t('hq_address')}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px' }}>
              📞 <a href="tel:*0027" style={{ color: '#fff' }}>*0027</a> / (+994 12) 345-6789
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              ✉️ <a href="mailto:info@m-trans.az" style={{ color: '#fff' }}>info@m-trans.az</a>
            </p>
            <Link to="/contact" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
              🚘 {t('btn_vin_quote_request')}
            </Link>
          </div>

        </div>

        <div style={{ borderTop: '1px solid #334155', paddingTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', color: '#64748b', fontSize: '0.85rem' }}>
          <div>{t('ft_copyright')}</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/about" style={{ color: '#64748b' }}>{t('nav_about')}</Link>
            <Link to="/spare-parts" style={{ color: '#64748b' }}>{t('nav_catalog')}</Link>
            <Link to="/contact" style={{ color: '#64748b' }}>{t('nav_contact')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}