import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Genişləndirilmiş məhsul bazası (tərcümə açarları ilə)
const products = [
  { id: 1, nameKey: "part1_name", catKey: "parts_category_brakes", descKey: "part1_desc", img: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=600&q=80" },
  { id: 2, nameKey: "part2_name", catKey: "parts_category_pneumatics", descKey: "part2_desc", img: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80" },
  { id: 3, nameKey: "part3_name", catKey: "parts_category_filters", descKey: "part3_desc", img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80" },
  { id: 4, nameKey: "part4_name", catKey: "parts_category_electronics", descKey: "part4_desc", img: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80" },
  { id: 5, nameKey: "part5_name", catKey: "parts_category_suspension", descKey: "part5_desc", img: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80" },
  { id: 6, nameKey: "part6_name", catKey: "parts_category_transmission", descKey: "part6_desc", img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80" },
  { id: 7, nameKey: "part7_name", catKey: "parts_category_filters", descKey: "part7_desc", img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80" },
  { id: 8, nameKey: "part8_name", catKey: "parts_category_electronics", descKey: "part8_desc", img: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80" }
];

// Kateqoriya açarları (filtrlər üçün stabil dəyərlər)
const categoryKeys = ["parts_all", ...new Set(products.map(item => item.catKey))];

export default function SpareParts() {
  const { t } = useTranslation();

  // Axtarış və Filtr üçün React State-ləri (kateqoriya stabil açarla saxlanılır)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("parts_all");

  // Mailə yönləndirmə funksiyası
  const handleOrder = (productName) => {
    const subject = encodeURIComponent(t('parts_mail_subject', { name: productName }));
    const body = encodeURIComponent(t('parts_mail_body', { name: productName }));
    window.location.href = `mailto:info@m-trans.az?subject=${subject}&body=${body}`;
  };

  // Məhsulları axtarış sözünə və kateqoriyaya görə süzürük
  const filteredProducts = products.filter(product => {
    const productName = t(product.nameKey);
    const matchSearch = productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === "parts_all" || product.catKey === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <main>
      {/* EHS HERO */}
      <section className="section" style={{ paddingTop: '140px', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}>
        <div className="wrap">
          <span className="eyebrow">{t('parts_hero_eyebrow')}</span>
          <h1 className="sec-title standout-title" style={{ marginTop: '10px' }}>{t('parts_hero_title')}</h1>
          <p className="sec-lead" style={{ margin: '15px auto', color: '#c4d1e0' }}>{t('parts_hero_desc')}</p>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--gray)' }}>
        <div className="wrap">
          
          {/* AXTARIŞ VƏ FİLTR PANELİ */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '50px', flexWrap: 'wrap', backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <input 
                type="text" 
                className="input" 
                placeholder={t('parts_search_placeholder')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '45px' }}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '15px', top: '12px', width: '20px', height: '20px' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            
            <div style={{ minWidth: '250px' }}>
              <select 
                className="select" 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categoryKeys.map(catKey => (
                  <option key={catKey} value={catKey}>{catKey === 'parts_all' ? t('parts_all_categories') : t(catKey)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MƏHSULLARIN QRET (GRID) FORMASINDA GÖSTƏRİLMƏSİ */}
          {filteredProducts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              {filteredProducts.map((product, index) => (
                <div key={product.id} className="repair-card reveal-up active" style={{ padding: '0', display: 'flex', flexDirection: 'column', animationDelay: `${(index % 4) * 0.1}s` }}>
                  <div style={{ height: '220px', overflow: 'hidden' }}>
                    <img src={product.img} alt={t(product.nameKey)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--dim)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>{t(product.catKey)}</span>
                    <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', fontWeight: '700', color: 'var(--navy)', margin: '0 0 10px 0' }}>{t(product.nameKey)}</h3>
                    <p style={{ color: 'var(--ink-2)', fontSize: '0.95rem', marginBottom: '25px', flexGrow: 1 }}>{t(product.descKey)}</p>
                    
                    <button onClick={() => handleOrder(t(product.nameKey))} className="btn btn-primary btn-block" style={{ marginTop: 'auto' }}>
                      {t('btn_order')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // AXTARIŞ NƏTİCƏ VERMƏDİKDƏ ÇIXAN EKRAN
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--gray-2)" strokeWidth="1.5" style={{ width: '64px', height: '64px', margin: '0 auto 15px' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--navy)', marginBottom: '8px' }}>{t('parts_not_found')}</h3>
              <p style={{ color: 'var(--dim)' }}>{t('parts_not_found_desc')}</p>
              <button onClick={() => {setSearchTerm(""); setSelectedCategory("parts_all");}} className="btn btn-ghost" style={{ marginTop: '15px' }}>{t('parts_reset')}</button>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
