import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Tools() {
  const location = useLocation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('track');

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const validTabs = ['track', 'calc', 'cbm', 'currency', 'transit', 'hs'];
    if (validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  // --- 1. İZLƏMƏ (TRACKING) ---
  const [trackCode, setTrackCode] = useState('MT-2891-4730-21');
  const [isTracking, setIsTracking] = useState(false);

  const handleTrack = () => {
    setIsTracking(true);
    setTimeout(() => {
      document.getElementById('izleme')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // --- 2. QİYMƏT KALKULYATORU ---
  const [calcForm, setCalcForm] = useState({ from: 'Bakı, AZ', to: 'İstanbul, TR', weight: 250, mode: 'road' });
  const [calcResult, setCalcResult] = useState(null);

  const handleCalcChange = (e) => setCalcForm({ ...calcForm, [e.target.name]: e.target.value });
  const handleCalcSubmit = () => {
    const rates = { road: 1.2, sea: 0.55, air: 3.6, rail: 0.85 };
    const days = { road: '5–7 gün', sea: '18–25 gün', air: '2–4 gün', rail: '12–16 gün' };
    const base = 35;
    const price = Math.round((base + calcForm.weight * rates[calcForm.mode]) / 5) * 5;
    setCalcResult({ low: price, high: Math.round(price * 1.25 / 5) * 5, time: days[calcForm.mode] });
  };

  // --- 3. CBM KALKULYATORU ---
  const [cbmForm, setCbmForm] = useState({ l: '', w: '', h: '', q: 1 });
  const [cbmResult, setCbmResult] = useState(null);

  const handleCbmChange = (e) => setCbmForm({ ...cbmForm, [e.target.name]: e.target.value });
  const handleCbmSubmit = () => {
    const { l, w, h, q } = cbmForm;
    const cbm = ((parseFloat(l || 0) * parseFloat(w || 0) * parseFloat(h || 0)) / 1000000) * parseFloat(q || 1);
    setCbmResult(cbm.toFixed(3));
  };

  // --- 4. VALYUTA ÇEVİRİCİ ---
  const [currForm, setCurrForm] = useState({ amt: '', from: 'USD', to: 'AZN' });
  const [currResult, setCurrResult] = useState(null);
  const mockRates = { USD: 1, EUR: 1.08, AZN: 0.59 }; 

  const handleCurrChange = (e) => setCurrForm({ ...currForm, [e.target.name]: e.target.value });
  const handleCurrSubmit = () => {
    const amt = parseFloat(currForm.amt || 0);
    const usdAmt = amt / mockRates[currForm.from];
    const finalAmt = usdAmt * mockRates[currForm.to];
    setCurrResult(finalAmt.toFixed(2));
  };

  // --- 5. TRANZİT VAXTI ---
  const [transForm, setTransForm] = useState({ from: '', to: '' });
  const [transResult, setTransResult] = useState(null);

  const handleTransChange = (e) => setTransForm({ ...transForm, [e.target.name]: e.target.value });
  const handleTransSubmit = () => {
    if (transForm.from && transForm.to) {
      const days = Math.floor(Math.random() * (45 - 12 + 1)) + 12; 
      setTransResult(days);
    }
  };

  // --- 6. GÖMRÜK KODLARI (HS) ---
  const [hsInput, setHsInput] = useState('');
  const [hsResult, setHsResult] = useState(null);

  const handleHsSubmit = () => {
    if (hsInput) {
      const sampleCodes = ['8517.12.00', '6109.10.00', '8708.99.97', '3926.90.97', '8471.30.00'];
      const code = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];
      setHsResult(code);
    }
  };

  return (
    <main>
      <header className="hero" style={{ minHeight: '80vh', paddingBottom: '60px' }}>
        <div className="hero-map" aria-hidden="true">
          <div className="glow-orb orb-red"></div>
          <div className="glow-orb orb-dark"></div>
          <div className="hero-grid"></div>
        </div>
        
        <div className="hero-inner">
          <div className="sec-head fade-in-up" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="eyebrow">{t('nav_tools')}</span>
            <h1 className="sec-title standout-title">Logistika Alətləri</h1>
            <p className="sec-lead" style={{ margin: '15px auto', color: '#c4d1e0' }}>Daşımalarınızı daha asan planlaşdırmaq üçün onlayn alətlərimizdən istifadə edin.</p>
          </div>

          <div className="tool-card fade-in-up">
            <div className="tabs scrollable-tabs">
              <button id="track" className={`tab ${activeTab === 'track' ? 'active' : ''}`} onClick={() => setActiveTab('track')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{t('tool_track')}</span>
              </button>
              <button id="calc" className={`tab ${activeTab === 'calc' ? 'active' : ''}`} onClick={() => setActiveTab('calc')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2"/></svg>
                <span>{t('tool_calc')}</span>
              </button>
              <button id="cbm" className={`tab ${activeTab === 'cbm' ? 'active' : ''}`} onClick={() => setActiveTab('cbm')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <span>{t('tool_cbm')}</span>
              </button>
              <button id="currency" className={`tab ${activeTab === 'currency' ? 'active' : ''}`} onClick={() => setActiveTab('currency')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span>{t('tool_curr')}</span>
              </button>
              <button id="transit" className={`tab ${activeTab === 'transit' ? 'active' : ''}`} onClick={() => setActiveTab('transit')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{t('tool_transit')}</span>
              </button>
              <button id="hs" className={`tab ${activeTab === 'hs' ? 'active' : ''}`} onClick={() => setActiveTab('hs')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <span>{t('tool_hs')}</span>
              </button>
            </div>
            
            {/* 1. YÜKÜ İZLƏ */}
            {activeTab === 'track' && (
              <div className="panel active">
                <label className="field-label">{t('tool_track_label')}</label>
                <div className="track-row">
                  <div className="grow">
                    <input className="input mono" value={trackCode} onChange={(e) => setTrackCode(e.target.value)} placeholder="MT-0000-0000-00" />
                  </div>
                  <button className="btn btn-primary btn-lg" onClick={handleTrack}>
                    <span>İzlə</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </div>
                <p style={{ fontFamily: 'var(--f-mono)', fontSize: '.74rem', color: 'var(--ink-2)', marginTop: '12px' }}>12 rəqəmli kodu daxil edin.</p>
              </div>
            )}

            {/* 2. QİYMƏT KALKULYATORU */}
            {activeTab === 'calc' && (
              <div className="panel active">
                <div className="calc-grid">
                  <div><label className="field-label">Haradan</label><input className="input" name="from" value={calcForm.from} onChange={handleCalcChange} /></div>
                  <div><label className="field-label">Haraya</label><input className="input" name="to" value={calcForm.to} onChange={handleCalcChange} /></div>
                  <div><label className="field-label">Çəki (kq)</label><input className="input mono" type="number" name="weight" value={calcForm.weight} onChange={handleCalcChange} /></div>
                  <div>
                    <label className="field-label">Daşıma növü</label>
                    <select className="select" name="mode" value={calcForm.mode} onChange={handleCalcChange}>
                      <option value="road">{t('opt_road')}</option><option value="sea">{t('opt_sea')}</option><option value="air">{t('opt_air')}</option><option value="rail">{t('opt_rail')}</option>
                    </select>
                  </div>
                  <div className="full"><button className="btn btn-primary btn-block btn-lg" onClick={handleCalcSubmit}>Hesabla</button></div>
                </div>
                {calcResult && (
                  <div className="calc-result show">
                    <div className="cr-item"><div className="v">{calcResult.low}–{calcResult.high} <span>USD</span></div><div className="k">Təxmini qiymət</div></div>
                    <div className="cr-item"><div className="v">{calcResult.time}</div><div className="k">Təxmini müddət</div></div>
                    <div className="cr-note">Bu yalnız nümunə hesablamadır.</div>
                  </div>
                )}
              </div>
            )}

            {/* 3. CBM KALKULYATORU */}
            {activeTab === 'cbm' && (
              <div className="panel active">
                <div className="calc-grid">
                  <div><label className="field-label">Uzunluq (sm)</label><input className="input mono" type="number" name="l" value={cbmForm.l} onChange={handleCbmChange} placeholder="0" /></div>
                  <div><label className="field-label">En (sm)</label><input className="input mono" type="number" name="w" value={cbmForm.w} onChange={handleCbmChange} placeholder="0" /></div>
                  <div><label className="field-label">Hündürlük (sm)</label><input className="input mono" type="number" name="h" value={cbmForm.h} onChange={handleCbmChange} placeholder="0" /></div>
                  <div><label className="field-label">Bağlama Sayı</label><input className="input mono" type="number" name="q" value={cbmForm.q} onChange={handleCbmChange} min="1" /></div>
                  <div className="full"><button className="btn btn-primary btn-block btn-lg" onClick={handleCbmSubmit}>Həcmi Hesabla</button></div>
                </div>
                {cbmResult && (
                  <div className="calc-result show">
                    <div className="cr-item"><div className="v">{cbmResult} <span>CBM</span></div><div className="k">Ümumi Həcm</div></div>
                  </div>
                )}
              </div>
            )}

            {/* 4. VALYUTA ÇEVİRİCİ */}
            {activeTab === 'currency' && (
              <div className="panel active">
                <div className="calc-grid">
                  <div><label className="field-label">Məbləğ</label><input className="input mono" type="number" name="amt" value={currForm.amt} onChange={handleCurrChange} placeholder="Məs: 1000" /></div>
                  <div>
                    <label className="field-label">Bu Valyutadan</label>
                    <select className="select" name="from" value={currForm.from} onChange={handleCurrChange}>
                      <option value="USD">USD - ABŞ Dolları</option><option value="EUR">EUR - Avro</option><option value="AZN">AZN - Azərbaycan Manatı</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Bu Valyutaya</label>
                    <select className="select" name="to" value={currForm.to} onChange={handleCurrChange}>
                      <option value="AZN">AZN - Azərbaycan Manatı</option><option value="USD">USD - ABŞ Dolları</option><option value="EUR">EUR - Avro</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className="btn btn-primary btn-block btn-lg" style={{ height: '48px' }} onClick={handleCurrSubmit}>{t('btn_convert')}</button>
                  </div>
                </div>
                {currResult && (
                  <div className="calc-result show">
                    <div className="cr-item"><div className="v">{currResult}</div><div className="k">{t('curr_result_label')}</div></div>
                  </div>
                )}
              </div>
            )}

            {/* 5. TRANZİT VAXTI */}
            {activeTab === 'transit' && (
              <div className="panel active">
                <div className="calc-grid">
                  <div><label className="field-label">Çıxış Limanı / Şəhər</label><input className="input" name="from" value={transForm.from} onChange={handleTransChange} placeholder="Məs: Şanxay" /></div>
                  <div><label className="field-label">Təyinat Limanı / Şəhər</label><input className="input" name="to" value={transForm.to} onChange={handleTransChange} placeholder="Məs: Bakı" /></div>
                  <div className="full"><button className="btn btn-primary btn-block btn-lg" onClick={handleTransSubmit}>Vaxtı Öyrən</button></div>
                </div>
                {transResult && (
                  <div className="calc-result show">
                    <div className="cr-item"><div className="v">{transResult} <span>Gün</span></div><div className="k">Təxmini Tranzit Vaxtı</div></div>
                  </div>
                )}
              </div>
            )}

            {/* 6. GÖMRÜK KODLARI */}
            {activeTab === 'hs' && (
              <div className="panel active">
                <div className="track-row">
                  <div className="grow">
                    <label className="field-label">Məhsul adı və ya açar söz</label>
                    <input className="input" value={hsInput} onChange={(e) => setHsInput(e.target.value)} placeholder="Məs: Elektronika..." />
                  </div>
                  <button className="btn btn-primary btn-lg" onClick={handleHsSubmit}>Axtar</button>
                </div>
                {hsResult && (
                  <div className="calc-result show" style={{ alignItems: 'flex-start' }}>
                    <div className="cr-item">
                      <div className="v" style={{ letterSpacing: '2px' }}>{hsResult}</div>
                      <div className="k">Gömrük Kodu (HS)</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--dim)', marginTop: '8px' }}>Qeyd: Dəqiq gömrük bəyannaməsi üçün brokerinizlə əlaqə saxlayın.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </header>

      {/* İZLƏMƏ NƏTİCƏSİ (Şərti) */}
      {isTracking && activeTab === 'track' && (
        <section className="section track" id="izleme">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Canlı İzləmə</span>
              <h2 className="sec-title">Yükünüz hər an harada olduğunu bilin</h2>
            </div>
            <div className="track-panels">
              <div className="track-info">
                <div className="ti-head">
                  <div className="ti-code"><small>{t('tool_track_label')}</small><span>{trackCode}</span></div>
                  <span className="badge"><span className="dot"></span> Yoldadır</span>
                </div>
                <div className="ti-meta">
                    <div><div className="k">Göndərən</div><div className="v">Bakı, AZ</div></div>
                    <div><div className="k">Alan</div><div className="v">İstanbul, TR</div></div>
                    <div><div className="k">Çəki</div><div className="v">250 kq</div></div>
                    <div><div className="k">Daşıma növü</div><div className="v">Quru / TIR</div></div>
                </div>
                <ul className="timeline">
                    <li className="done">
                        <span className="tl-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg></span>
                        <div className="tl-title">Anbarda qəbul edildi</div>
                        <div className="tl-sub">08 İYUN · 09:14 · Bakı</div>
                    </li>
                    <li className="now">
                        <span className="tl-dot"></span>
                        <div className="tl-title">Yoldadır</div>
                        <div className="tl-sub">10 İYUN · 06:00 · Gürcüstan sərhədi</div>
                    </li>
                    <li className="upcoming">
                        <span className="tl-dot"></span>
                        <div className="tl-title">Çatdırılacaq</div>
                        <div className="tl-sub">Təxmini: 13 İYUN · İstanbul</div>
                    </li>
                </ul>
              </div>
              <div className="track-map">
                <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                    <g stroke="#1c2e46" strokeWidth="1" fill="none" opacity="0.6">
                        <path d="M-20 100 Q300 70 620 100"/>
                        <path d="M-20 200 Q300 170 620 200"/>
                        <path d="M-20 300 Q300 270 620 300"/>
                        <path d="M150 -20 Q120 200 150 420"/>
                        <path d="M450 -20 Q420 200 450 420"/>
                    </g>
                    <path id="routeTrack" d="M110 320 C220 240 360 180 500 90" fill="none" stroke="#FF6B35" strokeWidth="2.4" strokeDasharray="6 8"/>
                    <path d="M110 320 C220 240 360 180 500 90" fill="none" stroke="#FF6B35" strokeWidth="2.4" opacity="0.16"/>
                    <circle cx="110" cy="320" r="6" fill="#1BC47D"/>
                    <circle cx="110" cy="320" r="12" fill="none" stroke="#1BC47D" strokeWidth="1.4" opacity="0.5"/>
                    <circle cx="500" cy="90" r="6" fill="#fff"/>
                    <circle cx="500" cy="90" r="12" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.4"/>
                    <g>
                        <animateMotion dur="5s" repeatCount="indefinite" rotate="auto"><mpath href="#routeTrack"/></animateMotion>
                        <circle r="13" fill="#FF6B35" opacity="0.25"/>
                        <circle r="7" fill="#fff"/>
                        <path d="M-4 1.5h6l2-2h-6z M-4 1.5l-1.5 3h9l-1.5-3" fill="#FF6B35" transform="scale(.9)"/>
                    </g>
                </svg>
                <div className="map-eta">ETA · 3 gün</div>
                <div className="map-tag" id="mapFrom"><span className="sm">Çıxış</span><b>Bakı, AZ</b></div>
                <div className="map-tag" id="mapTo"><span className="sm">Təyinat</span><b>İstanbul, TR</b></div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}