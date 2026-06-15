import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Partners() {
  const { t } = useTranslation();

  return (
    <main>
      <section className="mtrans-partners-section">
        <div className="mtrans-container">
          <div className="mtrans-section-header">
            <h1 className="mtrans-main-title">{t('partners_title')}</h1>
            <p className="mtrans-subtitle">{t('partners_subtitle')}</p>
          </div>

          <div className="mtrans-category-group">
            <h2 className="mtrans-category-title">{t('partners_ship_lines')}</h2>
            <div className="mtrans-partners-grid">
              {/* Maersk */}
              <div className="mtrans-partner-card">
                <input type="checkbox" id="partner-maersk" className="mtrans-toggle-input" />
                <div className="mtrans-card-body">
                  <div className="mtrans-logo-wrapper"><img src="/maersk.png" alt="Maersk Line" className="mtrans-logo" /></div>
                  <h3 className="mtrans-partner-name">Maersk Line</h3>
                  <p className="mtrans-short-desc">{t('partners_maersk_desc')}</p>
                  <div className="mtrans-detailed-content">
                    <ul className="mtrans-details-list">
                      <li>{t('partners_maersk_li1')}</li>
                      <li>{t('partners_maersk_li2')}</li>
                      <li>{t('partners_maersk_li3')}</li>
                      <li>{t('partners_maersk_li4')}</li>
                    </ul>
                  </div>
                  <label htmlFor="partner-maersk" className="mtrans-expand-label">
                    <span className="mtrans-text-more">{t('btn_read_more')}</span>
                    <span className="mtrans-text-less">{t('btn_hide')}</span>
                    <span className="mtrans-arrow-icon">▼</span>
                  </label>
                </div>
              </div>

              {/* MSC */}
              <div className="mtrans-partner-card">
                <input type="checkbox" id="partner-msc" className="mtrans-toggle-input" />
                <div className="mtrans-card-body">
                  <div className="mtrans-logo-wrapper"><img src="/msc.png" alt="MSC" className="mtrans-logo" /></div>
                  <h3 className="mtrans-partner-name">Mediterranean Shipping Company</h3>
                  <p className="mtrans-short-desc">{t('partners_msc_desc')}</p>
                  <div className="mtrans-detailed-content">
                    <ul className="mtrans-details-list">
                      <li>{t('partners_msc_li1')}</li>
                      <li>{t('partners_msc_li2')}</li>
                      <li>{t('partners_msc_li3')}</li>
                      <li>{t('partners_msc_li4')}</li>
                    </ul>
                  </div>
                  <label htmlFor="partner-msc" className="mtrans-expand-label">
                    <span className="mtrans-text-more">{t('btn_read_more')}</span>
                    <span className="mtrans-text-less">{t('btn_hide')}</span>
                    <span className="mtrans-arrow-icon">▼</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mtrans-category-group">
            <h2 className="mtrans-category-title">{t('partners_cat_industry')}</h2>
            <div className="mtrans-partners-grid">
              {/* WABCO */}
              <div className="mtrans-partner-card">
                <input type="checkbox" id="partner-wabco" className="mtrans-toggle-input" />
                <div className="mtrans-card-body">
                  <div className="mtrans-logo-wrapper"><img src="/wabco.png" alt="WABCO" className="mtrans-logo" /></div>
                  <h3 className="mtrans-partner-name">WABCO</h3>
                  <p className="mtrans-short-desc">{t('partners_wabco_desc')}</p>
                  <div className="mtrans-detailed-content">
                    <ul className="mtrans-details-list">
                      <li>{t('partners_wabco_li1')}</li>
                      <li>{t('partners_wabco_li2')}</li>
                      <li>{t('partners_wabco_li3')}</li>
                    </ul>
                  </div>
                  <label htmlFor="partner-wabco" className="mtrans-expand-label">
                    <span className="mtrans-text-more">{t('btn_read_more')}</span>
                    <span className="mtrans-text-less">{t('btn_hide')}</span>
                    <span className="mtrans-arrow-icon">▼</span>
                  </label>
                </div>
              </div>

              {/* SOCAR */}
              <div className="mtrans-partner-card">
                <input type="checkbox" id="partner-socar" className="mtrans-toggle-input" />
                <div className="mtrans-card-body">
                  <div className="mtrans-logo-wrapper"><img src="/socar polymre.png" alt="SOCAR Polymer" className="mtrans-logo" /></div>
                  <h3 className="mtrans-partner-name">SOCAR Polymer</h3>
                  <p className="mtrans-short-desc">{t('partners_socar_desc')}</p>
                  <div className="mtrans-detailed-content">
                    <ul className="mtrans-details-list">
                      <li>{t('partners_socar_li1')}</li>
                      <li>{t('partners_socar_li2')}</li>
                      <li>{t('partners_socar_li3')}</li>
                    </ul>
                  </div>
                  <label htmlFor="partner-socar" className="mtrans-expand-label">
                    <span className="mtrans-text-more">{t('btn_read_more')}</span>
                    <span className="mtrans-text-less">{t('btn_hide')}</span>
                    <span className="mtrans-arrow-icon">▼</span>
                  </label>
                </div>
              </div>

              {/* Knorr-Bremse */}
              <div className="mtrans-partner-card">
                <input type="checkbox" id="partner-knorr" className="mtrans-toggle-input" />
                <div className="mtrans-card-body">
                  <div className="mtrans-logo-wrapper"><img src="/knorr bremse.png" alt="Knorr-Bremse" className="mtrans-logo" /></div>
                  <h3 className="mtrans-partner-name">Knorr-Bremse</h3>
                  <p className="mtrans-short-desc">{t('partners_knorr_desc')}</p>
                  <div className="mtrans-detailed-content">
                    <ul className="mtrans-details-list">
                      <li>{t('partners_knorr_li1')}</li>
                      <li>{t('partners_knorr_li2')}</li>
                      <li>{t('partners_knorr_li3')}</li>
                    </ul>
                  </div>
                  <label htmlFor="partner-knorr" className="mtrans-expand-label">
                    <span className="mtrans-text-more">{t('btn_read_more')}</span>
                    <span className="mtrans-text-less">{t('btn_hide')}</span>
                    <span className="mtrans-arrow-icon">▼</span>
                  </label>
                </div>
              </div>

              {/* Hengst */}
              <div className="mtrans-partner-card">
                <input type="checkbox" id="partner-hengst" className="mtrans-toggle-input" />
                <div className="mtrans-card-body">
                  <div className="mtrans-logo-wrapper"><img src="/hengst.png" alt="Hengst Automotive" className="mtrans-logo" /></div>
                  <h3 className="mtrans-partner-name">Hengst Automotive</h3>
                  <p className="mtrans-short-desc">{t('partners_hengst_desc')}</p>
                  <div className="mtrans-detailed-content">
                    <ul className="mtrans-details-list">
                      <li>{t('partners_hengst_li1')}</li>
                      <li>{t('partners_hengst_li2')}</li>
                      <li>{t('partners_hengst_li3')}</li>
                    </ul>
                  </div>
                  <label htmlFor="partner-hengst" className="mtrans-expand-label">
                    <span className="mtrans-text-more">{t('btn_read_more')}</span>
                    <span className="mtrans-text-less">{t('btn_hide')}</span>
                    <span className="mtrans-arrow-icon">▼</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
