import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, ValidationError } from '@formspree/react';

export default function Contact() {
  const { t } = useTranslation();
  const [showVideo, setShowVideo] = useState(false);
  
  // FORMSPREE İNTEQRASİYASI BURADADIR
  const [state, handleSubmit] = useForm("mjgdlorp");

  return (
    <main>
      <section className="mtrans-contact-section">
        <div className="mtrans-contact-container">
          <div className="mtrans-contact-header">
            <div className="mtrans-heading-wrapper">
              <span className="mtrans-sub-heading">{t('contact_heading')}</span>
              <h2 className="mtrans-main-heading">{t('contact_title')}</h2>
              <div className="mtrans-heading-line"></div>
            </div>
            
            <button className="mtrans-video-btn" onClick={() => setShowVideo(!showVideo)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <span className="btn-icon">
                <svg className="mtrans-play-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 8L16 12L10 16V8Z" fill="currentColor"/>
                </svg>
              </span>
              <span>{showVideo ? t('map_btn_map') : t('map_btn_video')}</span>
            </button>
          </div> 

          <div className="mtrans-map-wrapper">
            {!showVideo ? (
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3035.85549060325!2d49.703081999999995!3d40.4563353!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40308566f6267987%3A0x4c268b91d716a473!2sM-Trans%20MMC!5e0!3m2!1sen!2saz!4v1781370630379!5m2!1sen!2saz"
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map">
              </iframe>
            ) : (
              <video src="/konum_video.mp4" width="100%" height="100%" style={{ objectFit: 'cover' }} controls autoPlay></video>
            )}
          </div>

          <div className="mtrans-cards-grid">
            <div className="mtrans-contact-card">
              <div className="mtrans-card-badge">{t('hq_badge')}</div>
              <h3 className="mtrans-card-title">{t('hq_title')}</h3>
              <ul className="mtrans-contact-list">
                <li><div className="mtrans-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div><span className="mtrans-info-text">{t('hq_address')}</span></li>
                <li><div className="mtrans-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div><span className="mtrans-info-text">info@m-trans.az</span></li>
                <li><div className="mtrans-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div><span className="mtrans-info-text"><b>*0027</b></span></li>
              </ul>
            </div>
            <div className="mtrans-contact-card">
              <h3 className="mtrans-card-title">{t('poti_title')}</h3>
              <ul className="mtrans-contact-list">
                <li><div className="mtrans-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div><span className="mtrans-info-text">{t('poti_address')}</span></li>
                <li><div className="mtrans-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div><span className="mtrans-info-text">info@m-trans.az</span></li>
                <li><div className="mtrans-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div><span className="mtrans-info-text"><b>+995 555 00 27</b></span></li>
              </ul>
            </div>
            <div className="mtrans-contact-card">
              <h3 className="mtrans-card-title">{t('service_title')}</h3>
              <ul className="mtrans-contact-list">
                <li><div className="mtrans-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div><span className="mtrans-info-text">{t('hq_address')}</span></li>
                <li><div className="mtrans-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div><span className="mtrans-info-text">info@m-trans.az</span></li>
                <li><div className="mtrans-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div><span className="mtrans-info-text"><b>*0027</b></span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section contact" id="elaqe">
        <div className="wrap">
          <div className="contact-card">
            <div className="c-left">
              <span className="eyebrow">{t('form_eyebrow')}</span>
              <h3>{t('form_title')}</h3>
              <p>{t('form_desc')}</p>
              <div className="c-line"><div className="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div><div><div className="k">{t('label_address')}</div><div className="v">{t('val_address')}</div></div></div>
              <div className="c-line"><div className="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></div><div><div className="k">{t('label_phone')}</div><div className="v">*0027</div></div></div>
              <div className="c-line"><div className="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></div><div><div className="k">{t('label_email')}</div><div className="v">info@m-trans.az</div></div></div>
              <div className="c-line"><div className="ci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><div><div className="k">{t('label_hours')}</div><div className="v">{t('val_hours')}</div></div></div>
              <div className="c-deco"></div>
            </div>
            <div className="c-right">
              {!state.succeeded ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div>
                      <label className="field-label" htmlFor="name">{t('input_name')}</label>
                      <input id="name" name="name" className="input" placeholder={t('placeholder_name')} required />
                      <ValidationError prefix="Name" field="name" errors={state.errors} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="phone">{t('label_phone')}</label>
                      <input id="phone" name="phone" className="input mono" placeholder={t('placeholder_phone')} required />
                      <ValidationError prefix="Phone" field="phone" errors={state.errors} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="email">{t('label_email')}</label>
                      <input id="email" type="email" name="email" className="input" placeholder={t('placeholder_email')} required />
                      <ValidationError prefix="Email" field="email" errors={state.errors} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="type">{t('input_type')}</label>
                      <select id="type" name="type" className="select">
                        <option value="Sea">{t('opt_sea')}</option>
                        <option value="Air">{t('opt_air')}</option>
                        <option value="Road">{t('opt_road')}</option>
                        <option value="Rail">{t('opt_rail')}</option>
                        <option value="Warehouse">{t('opt_warehouse')}</option>
                      </select>
                      <ValidationError prefix="Type" field="type" errors={state.errors} />
                    </div>
                    <div className="full">
                      <label className="field-label" htmlFor="message">{t('input_msg')}</label>
                      <textarea id="message" name="message" className="input" placeholder={t('placeholder_msg')} required></textarea>
                      <ValidationError prefix="Message" field="message" errors={state.errors} />
                    </div>
                    <div className="full">
                      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={state.submitting}>
                        {state.submitting ? t('btn_sending') : t('btn_submit')}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="form-ok show" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div className="ok-ico" style={{ color: 'var(--green)', marginBottom: '15px' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px' }}><path d="M5 12l4 4 10-10"/></svg></div>
                  <h4>{t('success_title')}</h4>
                  <p style={{ color: 'var(--dim)', marginTop: '8px' }}>{t('success_desc')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}