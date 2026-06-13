// Reduced motion: pause SVG (SMIL) animations
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('svg').forEach(function(s){ if(s.pauseAnimations) s.pauseAnimations(); });
}

// Nav background on scroll
var nav = document.getElementById('nav');
window.addEventListener('scroll', function(){
    if (window.scrollY > 24) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
});

// Mobile menu
var menu = document.getElementById('mobileMenu'), scrim = document.getElementById('scrim');
function openMenu(){ menu.classList.add('open'); scrim.classList.add('show'); }
function closeMenu(){ menu.classList.remove('open'); scrim.classList.remove('show'); }
var burgerBtn = document.getElementById('burger');
if (burgerBtn) burgerBtn.addEventListener('click', openMenu);
var mCloseBtn = document.getElementById('mClose');
if (mCloseBtn) mCloseBtn.addEventListener('click', closeMenu);
if (scrim) scrim.addEventListener('click', closeMenu);
if (menu) {
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
}

// =========================================================
// TAB SWITCHING & HASH ROUTING LOGIC
// =========================================================
function switchToolTab(name) {
    if (!name) return;
    document.querySelectorAll('.tab').forEach(function(t){ 
        t.classList.toggle('active', t.getAttribute('data-tab') === name); 
    });
    document.querySelectorAll('.panel').forEach(function(p){
        p.classList.toggle('active', p.getAttribute('data-panel') === name);
    });
}

// Set up click listeners for tabs
document.querySelectorAll('.tab').forEach(function(tab){
    tab.addEventListener('click', function(){
        var name = tab.getAttribute('data-tab');
        window.history.pushState(null, null, '#' + name); // Update URL without reloading
        switchToolTab(name);
    });
});

// Check URL Hash on page load to open the correct tool
window.addEventListener('DOMContentLoaded', () => {
    let hash = window.location.hash.substring(1);
    let validTabs = ['track', 'calc', 'cbm', 'currency', 'transit', 'hs'];
    if (validTabs.includes(hash)) {
        switchToolTab(hash);
    } else {
        // Default to track if the tab system exists on the page
        if(document.querySelector('.tab[data-tab="track"]')) {
            switchToolTab('track');
        }
    }
});

// Update tab if user uses browser Back/Forward buttons
window.addEventListener('hashchange', () => {
    let hash = window.location.hash.substring(1);
    if (hash) switchToolTab(hash);
});


// =========================================================
// CALCULATORS & TOOLS LOGIC
// =========================================================

// 1. Price Calculator (demo)
var rates = { road:{r:1.2,d:'5–7 gün'}, sea:{r:0.55,d:'18–25 gün'}, air:{r:3.6,d:'2–4 gün'}, rail:{r:0.85,d:'12–16 gün'} };
var calcBtn = document.getElementById('calcBtn');
if (calcBtn) {
    calcBtn.addEventListener('click', function(){
        var w = parseFloat(document.getElementById('cWeight').value) || 0;
        var mode = document.getElementById('cMode').value;
        var base = 35;
        var price = Math.round((base + w * rates[mode].r) / 5) * 5;
        var low = price, high = Math.round(price * 1.25 / 5) * 5;
        document.getElementById('crPrice').innerHTML = low + '–' + high + ' <span>USD</span>';
        document.getElementById('crDays').textContent = rates[mode].d;
        document.getElementById('calcResult').classList.add('show');
    });
}

// 2. Tracking -> scroll to preview
var trackBtn = document.getElementById('trackBtn');
if (trackBtn) {
    trackBtn.addEventListener('click', function(){
        var code = document.getElementById('trackInput').value.trim() || 'MT-2891-4730-21';
        var resCodeEl = document.getElementById('resCode');
        if (resCodeEl) resCodeEl.textContent = code;
        var izlemeSection = document.getElementById('izleme');
        if (izlemeSection) izlemeSection.scrollIntoView({behavior:'smooth'});
    });
}

// 3. CBM Calculator
const cbmBtn = document.getElementById('cbmBtn');
if (cbmBtn) {
    cbmBtn.addEventListener('click', () => {
        let l = parseFloat(document.getElementById('cbmL').value) || 0;
        let w = parseFloat(document.getElementById('cbmW').value) || 0;
        let h = parseFloat(document.getElementById('cbmH').value) || 0;
        let q = parseFloat(document.getElementById('cbmQ').value) || 1;
        
        let cbm = ((l * w * h) / 1000000) * q;
        document.getElementById('crCbm').innerHTML = cbm.toFixed(3) + ' <span>CBM</span>';
        document.getElementById('cbmResult').style.display = 'flex';
    });
}

// 4. Currency Converter (Mock rates based on USD)
const currBtn = document.getElementById('currBtn');
const mockRates = { USD: 1, EUR: 1.08, AZN: 0.59 }; // For demo purposes
if (currBtn) {
    currBtn.addEventListener('click', () => {
        let amt = parseFloat(document.getElementById('currAmt').value) || 0;
        let from = document.getElementById('currFrom').value;
        let to = document.getElementById('currTo').value;
        
        // Convert 'from' to USD, then USD to 'to'
        let usdAmt = amt / mockRates[from];
        let finalAmt = usdAmt * mockRates[to];
        
        document.getElementById('crCurrAmt').innerHTML = finalAmt.toFixed(2) + ' <span>' + to + '</span>';
        document.getElementById('currResult').style.display = 'flex';
    });
}

// 5. Transit Time Estimator (Mock generator)
const transBtn = document.getElementById('transBtn');
if (transBtn) {
    transBtn.addEventListener('click', () => {
        let from = document.getElementById('transFrom').value.trim();
        let to = document.getElementById('transTo').value.trim();
        
        if(from && to) {
            let days = Math.floor(Math.random() * (45 - 12 + 1)) + 12; // Random 12-45 days
            document.getElementById('crTransDays').innerHTML = days + ' <span>Gün</span>';
            document.getElementById('transResult').style.display = 'flex';
        }
    });
}

// 6. HS Code Finder (Mock generator)
const hsBtn = document.getElementById('hsBtn');
if (hsBtn) {
    hsBtn.addEventListener('click', () => {
        let input = document.getElementById('hsInput').value.trim();
        let sampleCodes = ['8517.12.00', '6109.10.00', '8708.99.97', '3926.90.97', '8471.30.00'];
        
        if(input) {
            let code = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];
            document.getElementById('crHsCode').textContent = code;
            document.getElementById('hsResult').style.display = 'flex';
        }
    });
}

// =========================================================
// CONTACT FORM & MISC
// =========================================================

// Contact form (demo)
var formBtn = document.getElementById('formBtn');
if (formBtn) {
    formBtn.addEventListener('click', function(){
        var name = document.getElementById('fName').value.trim();
        if (!name){ document.getElementById('fName').focus(); document.getElementById('fName').style.borderColor = '#FF6B35'; return; }
        document.getElementById('formBody').style.display = 'none';
        document.getElementById('formOk').classList.add('show');
    });
}

// Scroll to Top Button Action
var scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function(){
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ================= TƏRCÜMƏ SİSTEMİ =================
const translations = {
    az: {
        nav_services: "Xidmətlər", nav_track: "İzləmə", nav_about: "Haqqımızda", nav_contact: "Əlaqə", nav_quote: "Təklif Al",
        hero_eyebrow: "Qlobal Daşıma Şəbəkəsi",
        hero_title: "Sizin Yükünüz,<br><em>Bizim Məsuliyyətimiz</em>",
        hero_lead_suffix: " daşımalarında uçtan-uca həll. Yükünüzü göndərdiyiniz andan təhvil alana qədər real vaxtda izləyin.",
        hero_stat_n1: "120+", hero_stat_l1: "Ölkə", hero_stat_n2: "98.6%", hero_stat_l2: "Vaxtında çatdırılma", hero_stat_n3: "7/24", hero_stat_l3: "Canlı izləmə",
        tab_track: "Yükü İzlə", tab_calc: "Qiymət Hesabla",
        track_lbl_code: "İzləmə kodu", btn_track: "İzlə", track_note: "12 rəqəmli kodu daxil edin — nümunə kod artıq yazılıb.",
        calc_lbl_from: "Haradan", calc_lbl_to: "Haraya", calc_lbl_weight: "Çəki (kq)", calc_lbl_mode: "Daşıma növü",
        mode_road: "Quru", mode_sea: "Dəniz", mode_air: "Hava", mode_rail: "Dəmir yolu",
        btn_calc: "Hesabla", calc_ph_city: "Şəhər / Ölkə",
        calc_est_price: "Təxmini qiymət", calc_est_time: "Təxmini müddət", calc_note: "Bu yalnız nümunə hesablamadır. Dəqiq təklif üçün <a href='#elaqe' style='color:var(--orange)'>bizimlə əlaqə saxlayın</a>.",
        why_eyebrow: "Niyə M Trans?", why_title: "Etibar etdiyiniz hər addımda yanınızdayıq",
        why_1_t: "100% Sığorta", why_1_d: "Hər yük tam dəyəri ilə sığortalanır — qapıdan qapıya qədər təminat altındadır.",
        why_2_t: "Sürətli Çatdırılma", why_2_d: "Optimallaşdırılmış marşrutlar və operativ yanaşma ilə vaxta qənaət.",
        why_3_t: "7/24 Dəstək", why_3_d: "Komandamız günün istənilən saatı yükünüzlə bağlı suallarınıza cavab verir.",
        why_4_t: "Qlobal Şəbəkə", why_4_d: "120-dən çox ölkədə tərəfdaş limanlar və agentliklər ilə geniş əhatə dairəsi.",
        srv_eyebrow: "Xidmətlərimiz", srv_title: "Hər yük növü üçün uyğun həll", srv_lead: "Kiçik bağlamadan tam konteynerə qədər — daşımanın bütün mərhələlərini bir əldən idarə edirik.",
        srv_1_t: "Dəniz Daşımacılığı", srv_1_d: "FCL və LCL konteyner həlləri ilə qənaətcil beynəlxalq daşımalar.",
        srv_2_t: "Hava Daşımacılığı", srv_2_d: "Təcili və qiymətli yüklər üçün ən sürətli çatdırılma variantı.",
        srv_3_t: "Quru Daşımacılığı", srv_3_d: "Avropa və Asiya boyunca etibarlı yük maşını və TIR xidmətləri.",
        srv_rail_t: "Dəmir Yolu Daşınmaları", srv_rail_d: "Böyük həcmli yükləriniz üçün təhlükəsiz və ekoloji cəhətdən təmiz qatar daşımaları.",
        srv_repair_t: "Təmir və Diaqnostika", srv_repair_d: "Ağır texnika və yük maşınları üçün müasir avadanlıqlarla peşəkar servis xidməti.",
        srv_parts_t: "Ehtiyat Hissələri", srv_parts_d: "Orijinal və zəmanətli avtomobil ehtiyat hissələrinin birbaşa idxalı və satışı.",
        btn_details: "Ətraflı", btn_get_quote: "Təklif al",
        trk_eyebrow: "Canlı İzləmə", trk_title: "Yükünüz hər an harada olduğunu bilin", trk_lead: "İzləmə kodunuzu daxil etdikdən sonra görəcəyiniz ekran budur — detallı status, mərhələlər və canlı xəritə.",
        trk_lbl_code: "İzləmə kodu", trk_badge: "Yoldadır", trk_meta_sender: "Göndərən", trk_meta_receiver: "Alan", trk_meta_weight: "Çəki", trk_meta_mode: "Daşıma növü", trk_meta_mode_v: "Quru / TIR",
        trk_tl_1_t: "Anbarda qəbul edildi", trk_tl_1_d: "08 İYUN · 09:14 · Bakı",
        trk_tl_2_t: "Yoldadır", trk_tl_2_d: "10 İYUN · 06:00 · Gürcüstan sərhədi",
        trk_tl_3_t: "Çatdırılacaq", trk_tl_3_d: "Təxmini: 13 İYUN · İstanbul",
        trk_map_eta: "ETA · 3 gün", trk_map_from: "Çıxış", trk_map_to: "Təyinat",
        stat_lbl_1: "Ölkə əhatəsi", stat_lbl_2: "İllik daşıma", stat_lbl_3: "Vaxtında çatdırılma", stat_lbl_4: "İl təcrübə",
        cnt_eyebrow: "Əlaqə", cnt_title: "Yükünüz üçün təklif alın", cnt_lead: "Bizimlə əməkdaşlıq üçün formu doldurun — komandamız 1 iş saatı ərzində sizinlə əlaqə saxlayacaq.",
        cnt_lbl_addr: "Ünvan", cnt_val_addr: "Binəqədi rayonu, 6-cı mikrorayon. Həmzə Babaşov küçəsi, 5a, mənzil 12.",
        cnt_lbl_phone: "Telefon", cnt_lbl_email: "E-mail", cnt_lbl_hours: "İş saatları", cnt_val_hours: "B.e – Cümə · 09:00–18:00",
        form_name: "Ad, Soyad", form_name_ph: "Adınız", form_phone: "Telefon", form_email: "E-mail", form_email_ph: "ad@nümunə.az",
        form_type: "Yükün növü", form_type_warehouse: "Anbarlama", form_msg: "Mesaj", form_msg_ph: "Yükünüz haqqında qısa məlumat...",
        form_btn: "Müraciəti Göndər", form_ok_title: "Müraciətiniz alındı", form_ok_desc: "Təşəkkürlər! Komandamız tezliklə sizinlə əlaqə saxlayacaq.",
        ft_brand_desc: "\"M-TRANS\"MMC Beynəlxalq yük daşımaları.",
        ft_col1_title: "Səhifələr", ft_link_home: "Əsas səhifə", ft_link_partners: "Tərəfdaşlarımız",
        ft_col2_title: "Xidmətlərimiz", ft_link_sea: "Dəniz daşınmaları", ft_link_repair: "Təmir və diaqnostika xidmətləri", ft_link_road: "Avtomobil quru yol daşımaları", ft_link_parts: "Avtomobil ehtiyat hissələri",
        ft_col3_title: "Bizimlə əlaqə", ft_copy: "© 2013 - 2026 | M-TRANS MMC | Bütün hüquqlar qorunur.", ft_credit: "Avtohesab MMC tərəfindən təchiz edilmişdir"
    },
    en: {
        nav_services: "Services", nav_track: "Tracking", nav_about: "About Us", nav_contact: "Contact", nav_quote: "Get Quote",
        hero_eyebrow: "Global Transport Network",
        hero_title: "Your Cargo,<br><em>Our Responsibility</em>",
        hero_lead_suffix: " transportation end-to-end solutions. Track your cargo in real-time from dispatch to delivery.",
        hero_stat_n1: "120+", hero_stat_l1: "Countries", hero_stat_n2: "98.6%", hero_stat_l2: "On-time Delivery", hero_stat_n3: "24/7", hero_stat_l3: "Live Tracking",
        tab_track: "Track Cargo", tab_calc: "Calculate Price",
        track_lbl_code: "Tracking Code", btn_track: "Track", track_note: "Enter your 12-digit code — sample code is already written.",
        calc_lbl_from: "From", calc_lbl_to: "To", calc_lbl_weight: "Weight (kg)", calc_lbl_mode: "Transport Mode",
        mode_road: "Road", mode_sea: "Sea", mode_air: "Air", mode_rail: "Railway",
        btn_calc: "Calculate", calc_ph_city: "City / Country",
        calc_est_price: "Estimated Price", calc_est_time: "Estimated Time", calc_note: "This is a sample calculation. For an exact quote, <a href='#elaqe' style='color:var(--orange)'>contact us</a>.",
        why_eyebrow: "Why M Trans?", why_title: "We stand by you at every trusted step",
        why_1_t: "100% Insurance", why_1_d: "Every cargo is insured for its full value — covered from door to door.",
        why_2_t: "Fast Delivery", why_2_d: "Save time with optimized routes and an operative approach.",
        why_3_t: "24/7 Support", why_3_d: "Our team answers your questions about your cargo at any time of the day.",
        why_4_t: "Global Network", why_4_d: "Extensive coverage with partner ports and agencies in over 120 countries.",
        srv_eyebrow: "Our Services", srv_title: "The right solution for every type of cargo", srv_lead: "From a small parcel to a full container — we manage all stages of transportation from a single source.",
        srv_1_t: "Sea Freight", srv_1_d: "Cost-effective international shipping with FCL and LCL container solutions.",
        srv_2_t: "Air Freight", srv_2_d: "The fastest delivery option for urgent and valuable shipments.",
        srv_3_t: "Road Freight", srv_3_d: "Reliable truck and TIR services across Europe and Asia.",
        srv_rail_t: "Railway Freight", srv_rail_d: "Safe and eco-friendly train transportation for your large volume cargo.",
        srv_repair_t: "Repair and Diagnostics", srv_repair_d: "Professional service for heavy machinery and trucks with modern equipment.",
        srv_parts_t: "Spare Parts", srv_parts_d: "Direct import and sales of original and guaranteed auto spare parts.",
        btn_details: "Details", btn_get_quote: "Get Quote",
        trk_eyebrow: "Live Tracking", trk_title: "Know where your cargo is at all times", trk_lead: "This is the screen you will see after entering your tracking code — detailed status, stages, and a live map.",
        trk_lbl_code: "Tracking Code", trk_badge: "In Transit", trk_meta_sender: "Sender", trk_meta_receiver: "Receiver", trk_meta_weight: "Weight", trk_meta_mode: "Transport Mode", trk_meta_mode_v: "Road / TIR",
        trk_tl_1_t: "Received at warehouse", trk_tl_1_d: "JUN 08 · 09:14 · Baku",
        trk_tl_2_t: "In Transit", trk_tl_2_d: "JUN 10 · 06:00 · Georgian border",
        trk_tl_3_t: "To be delivered", trk_tl_3_d: "Est: JUN 13 · Istanbul",
        trk_map_eta: "ETA · 3 days", trk_map_from: "Origin", trk_map_to: "Destination",
        stat_lbl_1: "Country Coverage", stat_lbl_2: "Annual Shipments", stat_lbl_3: "On-time Delivery", stat_lbl_4: "Years Experience",
        cnt_eyebrow: "Contact", cnt_title: "Get a quote for your cargo", cnt_lead: "Fill out the form to collaborate with us — our team will contact you within 1 business hour.",
        cnt_lbl_addr: "Address", cnt_val_addr: "Binagadi district, 6th microdistrict. Hamza Babashov street, 5a, apt 12.",
        cnt_lbl_phone: "Phone", cnt_lbl_email: "E-mail", cnt_lbl_hours: "Working Hours", cnt_val_hours: "Mon – Fri · 09:00–18:00",
        form_name: "Full Name", form_name_ph: "Your Name", form_phone: "Phone", form_email: "E-mail", form_email_ph: "name@example.com",
        form_type: "Cargo Type", form_type_warehouse: "Warehousing", form_msg: "Message", form_msg_ph: "Brief information about your cargo...",
        form_btn: "Send Request", form_ok_title: "Request Received", form_ok_desc: "Thank you! Our team will contact you shortly.",
        ft_brand_desc: "\"M-TRANS\" LLC International Freight Forwarding.",
        ft_col1_title: "Pages", ft_link_home: "Home", ft_link_partners: "Our Partners",
        ft_col2_title: "Our Services", ft_link_sea: "Sea transportation", ft_link_repair: "Repair and diagnostic services", ft_link_road: "Road freight transport", ft_link_parts: "Auto spare parts",
        ft_col3_title: "Contact Us", ft_copy: "© 2013 - 2026 | M-TRANS LLC | All rights reserved.", ft_credit: "Powered by Avtohesab LLC"
    },
    ru: {
        nav_services: "Услуги", nav_track: "Отслеживание", nav_about: "О нас", nav_contact: "Контакты", nav_quote: "Получить квоту",
        hero_eyebrow: "Глобальная Транспортная Сеть",
        hero_title: "Ваш Груз,<br><em>Наша Ответственность</em>",
        hero_lead_suffix: " перевозках — комплексные решения. Отслеживайте свой груз в реальном времени от отправки до доставки.",
        hero_stat_n1: "120+", hero_stat_l1: "Стран", hero_stat_n2: "98.6%", hero_stat_l2: "Доставка вовремя", hero_stat_n3: "24/7", hero_stat_l3: "Отслеживание",
        tab_track: "Отследить груз", tab_calc: "Рассчитать цену",
        track_lbl_code: "Трек-код", btn_track: "Отследить", track_note: "Введите 12-значный код — образец уже введен.",
        calc_lbl_from: "Откуда", calc_lbl_to: "Куда", calc_lbl_weight: "Вес (кг)", calc_lbl_mode: "Вид транспорта",
        mode_road: "Наземный", mode_sea: "Морской", mode_air: "Воздушный", mode_rail: "Железнодорожный",
        btn_calc: "Рассчитать", calc_ph_city: "Город / Страна",
        calc_est_price: "Примерная цена", calc_est_time: "Примерное время", calc_note: "Это примерный расчет. Для точного предложения <a href='#elaqe' style='color:var(--orange)'>свяжитесь с нами</a>.",
        why_eyebrow: "Почему M Trans?", why_title: "Мы рядом с вами на каждом шагу",
        why_1_t: "100% Страховка", why_1_d: "Каждый груз застрахован на полную стоимость — от двери до двери.",
        why_2_t: "Быстрая доставка", why_2_d: "Экономьте время благодаря оптимизированным маршрутам и оперативному подходу.",
        why_3_t: "24/7 Поддержка", why_3_d: "Наша команда отвечает на ваши вопросы о грузе в любое время суток.",
        why_4_t: "Глобальная сеть", why_4_d: "Широкий охват благодаря портам-партнерам и агентствам в более чем 120 странах.",
        srv_eyebrow: "Наши Услуги", srv_title: "Правильное решение для каждого типа груза", srv_lead: "От небольшой посылки до полного контейнера — мы управляем всеми этапами перевозки из одних рук.",
        srv_1_t: "Морские перевозки", srv_1_d: "Экономичные международные перевозки с контейнерными решениями FCL и LCL.",
        srv_2_t: "Авиаперевозки", srv_2_d: "Самый быстрый вариант доставки срочных и ценных грузов.",
        srv_3_t: "Наземные перевозки", srv_3_d: "Надежные услуги грузовиков и TIR по всей Европе и Азии.",
        srv_rail_t: "Железнодорожные перевозки", srv_rail_d: "Безопасные и экологически чистые железнодорожные перевозки для крупногабаритных грузов.",
        srv_repair_t: "Ремонт и диагностика", srv_repair_d: "Профессиональное обслуживание спецтехники и грузовиков на современном оборудовании.",
        srv_parts_t: "Запасные части", srv_parts_d: "Прямой импорт и продажа оригинальных автозапчастей с гарантией.",
        btn_details: "Подробнее", btn_get_quote: "Получить квоту",
        trk_eyebrow: "Живое отслеживание", trk_title: "Знайте, где находится ваш груз в любой момент", trk_lead: "Это экран, который вы увидите после ввода трек-кода — подробный статус, этапы и живая карта.",
        trk_lbl_code: "Трек-код", trk_badge: "В пути", trk_meta_sender: "Отправитель", trk_meta_receiver: "Получатель", trk_meta_weight: "Вес", trk_meta_mode: "Вид транспорта", trk_meta_mode_v: "Наземный / TIR",
        trk_tl_1_t: "Принято на склад", trk_tl_1_d: "08 ИЮН · 09:14 · Баку",
        trk_tl_2_t: "В пути", trk_tl_2_d: "10 ИЮН · 06:00 · Граница Грузии",
        trk_tl_3_t: "Будет доставлено", trk_tl_3_d: "Примерно: 13 ИЮН · Стамбул",
        trk_map_eta: "ETA · 3 дня", trk_map_from: "Отправление", trk_map_to: "Назначение",
        stat_lbl_1: "Охват стран", stat_lbl_2: "Ежегодные перевозки", stat_lbl_3: "Доставка вовремя", stat_lbl_4: "Лет опыта",
        cnt_eyebrow: "Контакты", cnt_title: "Получите квоту для вашего груза", cnt_lead: "Заполните форму для сотрудничества с нами — наша команда свяжется с вами в течение 1 рабочего часа.",
        cnt_lbl_addr: "Адрес", cnt_val_addr: "Бинагадинский район, 6-й микрорайон. Улица Гамзы Бабашова, 5а, кв. 12.",
        cnt_lbl_phone: "Телефон", cnt_lbl_email: "E-mail", cnt_lbl_hours: "Часы работы", cnt_val_hours: "Пн – Пт · 09:00–18:00",
        form_name: "Имя, Фамилия", form_name_ph: "Ваше Имя", form_phone: "Телефон", form_email: "E-mail", form_email_ph: "имя@пример.com",
        form_type: "Тип груза", form_type_warehouse: "Складирование", form_msg: "Сообщение", form_msg_ph: "Краткая информация о вашем грузе...",
        form_btn: "Отправить запрос", form_ok_title: "Запрос получен", form_ok_desc: "Спасибо! Наша команда скоро свяжется с вами.",
        ft_brand_desc: "ООО \"M-TRANS\" Международные грузоперевозки.",
        ft_col1_title: "Страницы", ft_link_home: "Главная", ft_link_partners: "Наши партнеры",
        ft_col2_title: "Наши услуги", ft_link_sea: "Морские перевозки", ft_link_repair: "Услуги по ремонту и диагностике", ft_link_road: "Автомобильные грузоперевозки", ft_link_parts: "Автозапчасти",
        ft_col3_title: "Свяжитесь с нами", ft_copy: "© 2013 - 2026 | ООО M-TRANS | Все права защищены.", ft_credit: "Разработано ООО Avtohesab"
    }
};

function setLanguage(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('on', btn.getAttribute('data-lang') === lang);
    });

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    if (typeof initTypewriter === 'function') {
        initTypewriter(lang);
    }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const selectedLang = this.getAttribute('data-lang');
        setLanguage(selectedLang);
    });
});

// =========================================================
// TYPEWRITER VƏ RƏQƏM SAYAN (COUNTER)
// =========================================================

let typeTimeout;
let isDeleting = false;
let wordIndex = 0;
let charIndex = 0;

function initTypewriter(lang) {
    const words = {
        az: ["Dəniz", "Hava", "Quru", "Dəmir yolu"],
        en: ["Sea", "Air", "Road", "Railway"],
        ru: ["Морских", "Воздушных", "Наземных", "Железнодорожных"]
    };
    
    const el = document.getElementById('typewriter');
    if (!el) return;
    
    clearTimeout(typeTimeout);
    
    function type() {
        const currentWord = words[lang][wordIndex];
        
        if (isDeleting) {
            charIndex--;
        } else {
            charIndex++;
        }
        
        el.innerText = currentWord.substring(0, charIndex);
        
        let baseSpeed = isDeleting ? 30 : 65;
        let randomDelay = Math.random() * 45; 
        let typeSpeed = baseSpeed + randomDelay;
        
        if (!isDeleting && charIndex === currentWord.length) {
            typeSpeed = 2500; 
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words[lang].length;
            typeSpeed = 400; 
        }
        
        typeTimeout = setTimeout(type, typeSpeed);
    }
    
    charIndex = 0;
    isDeleting = false;
    type();
}

function startCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        if (isNaN(target)) return;

        const duration = 2500; 
        let startTime = null;
        const prefix = counter.getAttribute('data-prefix') || '';
        const isDecimal = target % 1 !== 0;

        function updateCounter(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = currentTime - startTime;
            
            const timeFraction = Math.min(progress / duration, 1);
            const ease = 1 - Math.pow(1 - timeFraction, 4);
            const currentVal = target * ease;

            counter.innerText = prefix + (isDecimal ? currentVal.toFixed(1) : Math.floor(currentVal));

            if (progress < duration) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = prefix + target;
            }
        }
        
        requestAnimationFrame(updateCounter);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setLanguage('az');
    
    const statsSection = document.querySelector('.hero-stats');
    const observer = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting) {
            startCounters();
            observer.disconnect();
        }
    }, { threshold: 0.1 });

    if(statsSection) observer.observe(statsSection);
});
// =========================================================
// SCROLL REVEAL ANIMATIONS (Intersection Observer)
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    // Determine the viewport logic 
    const revealOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before it hits the bottom
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the active class to trigger the CSS transition
                entry.target.classList.add('active');
                // Stop observing once the animation has played to save memory
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    // Select all elements with the 'reveal-up' class and observe them
    document.querySelectorAll('.reveal-up').forEach(element => {
        revealObserver.observe(element);
    });
});

// =========================================================
// SERVICES 4-IN-1 PAGE TABS ROUTING
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    const srvTabs = document.querySelectorAll('.srv-tab-btn');
    if (srvTabs.length > 0) {
        const hash = window.location.hash.substring(1);
        const validSrvTabs = ['deniz', 'hava', 'quru', 'demir'];
        
        function activateSrvTab(tabId) {
            document.querySelectorAll('.srv-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-target') === tabId);
            });
            document.querySelectorAll('.srv-tab-content').forEach(content => {
                content.classList.toggle('active', content.id === tabId);
            });
        }

        // URL hash-də məlumat varsa onu aç, yoxdursa standart "deniz" açılsın
        if (validSrvTabs.includes(hash)) {
            activateSrvTab(hash);
        } else {
            activateSrvTab('deniz');
        }

        // İkonlara/düymələrə klikləyəndə işləməsi üçün
        srvTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                window.history.pushState(null, null, '#' + target); // URL-i reload etmədən yeniləyir
                activateSrvTab(target);
            });
        });
    }
});
// =========================================================
// XƏRİTƏ VƏ VİDEO DƏYİŞDİRİCİ MƏNTİQİ (MAP & VIDEO TOGGLE)
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById('toggleMapVideoBtn');
    const locationMap = document.getElementById('locationMap');
    const locationVideo = document.getElementById('locationVideo');
    const toggleText = document.getElementById('toggleText');
    const toggleIcon = document.getElementById('toggleIcon');

    // İkonların SVG kodları
    const playIconHTML = `<svg class="mtrans-play-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M10 8L16 12L10 16V8Z" fill="currentColor"/></svg>`;
    const mapIconHTML = `<svg class="mtrans-play-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`;

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Əgər video gizlidirsə, onu göstər və başlat
            if (locationVideo.style.display === 'none') {
                locationMap.style.display = 'none';
                locationVideo.style.display = 'block';
                locationVideo.play();

                toggleText.textContent = 'Ünvana xəritədən bax';
                toggleIcon.innerHTML = mapIconHTML;
            } 
            // Əgər video açıqdırsa, onu dayandır və xəritəni göstər
            else {
                locationVideo.pause();
                locationVideo.style.display = 'none';
                locationMap.style.display = 'block';

                toggleText.textContent = 'Ünvana video ilə bax';
                toggleIcon.innerHTML = playIconHTML;
            }
        });
    }
});
// =========================================================
// Vakansiyalar: Drag & Drop CV Yükləmə Sistemi
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('cvFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    if (dropZone && fileInput) {
        // Kliklədikdə fayl pəncərəsini aç (Open file dialog on click)
        dropZone.addEventListener('click', () => fileInput.click());

        // Fayl seçildikdə adını göstər (Show filename when selected)
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                fileNameDisplay.textContent = this.files[0].name;
            }
        });

        // Sürüşdürüb buraxma (Drag & drop) hərəkətlərinin default davranışını ləğv et
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Dropzone üzərinə fayl gətirdikdə vizual dəyişiklik
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        // Faylı drop etdikdə (buraxdıqda) input-a mənimsət
        dropZone.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files && files.length > 0) {
                fileInput.files = files;
                fileNameDisplay.textContent = files[0].name;
            }
        }, false);
    }
});