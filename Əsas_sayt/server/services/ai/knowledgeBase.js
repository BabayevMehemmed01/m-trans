// ============================================================
// FAYL: server/services/ai/knowledgeBase.js
// TƏSVİR: Chatbot-un RAG bilik bazasının məzmunu (seed).
//
//  Chatbot-un 3 vəzifəsindən İKİSİ bu məzmuna əsaslanır:
//    • saytdan istifadə üzrə təlimat (topic: 'site_usage')
//    • ümumi texniki suallar (topic: 'technical')
//  Üçüncü vəzifə — məhsul/stok — birbaşa PostgreSQL-dən gəlir.
//
//  Məzmunu dəyişdikdən sonra:  npm run seed:kb
// ============================================================

'use strict';

/**
 * @type {Array<{slug: string, topic: string, title: string, body: string, keywords: string[], priority: number}>}
 */
const ARTICLES = [
  // ══════════════════════════════════════════════════════════
  // SAYTDAN İSTİFADƏ
  // ══════════════════════════════════════════════════════════
  {
    slug: 'site-parca-axtarisi',
    topic: 'site_usage',
    title: 'Saytda ehtiyat hissəsi necə axtarılır',
    keywords: ['axtarış', 'axtarmaq', 'tapmaq', 'oem', 'kod', 'kataloq', 'search', 'detal tapmaq'],
    priority: 10,
    body: [
      'Ehtiyat hissəsi axtarmağın üç yolu var:',
      '1) Yuxarı menyudakı "Ehtiyat Hissələri" (Kataloq) bölməsinə keçin — bütün məhsullar orada göstərilir.',
      '2) Kataloq səhifəsindəki axtarış sahəsinə OEM kodunu (məsələn K020345) və ya detalın adını (məsələn "hava filtri") yazın.',
      '3) Kateqoriya və brend filtrlərindən istifadə edərək siyahını daraldın.',
      'OEM kodunu boşluqsuz və ya boşluqla yazmağınızın fərqi yoxdur — sistem "K-020 345" və "k020345" variantlarını eyni kod kimi tanıyır.',
      'Detalın üzərinə klikləsəniz, ətraflı məlumat pəncərəsi açılır: uyğunluq (hansı maşınlara gedir), qiymət və anbar qalığı.',
    ].join('\n'),
  },
  {
    slug: 'site-sifaris-vermek',
    topic: 'site_usage',
    title: 'Sifariş və sorğu necə göndərilir',
    keywords: ['sifariş', 'sifariş vermək', 'səbət', 'almaq', 'sorğu', 'təklif', 'whatsapp', 'order'],
    priority: 10,
    body: [
      'Sayt üzərindən birbaşa onlayn ödəniş yoxdur — sifarişlər menecer təsdiqi ilə rəsmiləşdirilir.',
      'Ardıcıllıq belədir:',
      '1) Bəyəndiyiniz detalın kartındakı "Səbətə at" düyməsinə basın.',
      '2) Sağ yuxarıdakı səbət ikonuna klikləyin — seçdiyiniz detallar orada toplanır.',
      '3) Səbətdə miqdarı dəqiqləşdirin və "Sorğu göndər" düyməsinə basın.',
      '4) Açılan formada ad, telefon və e-poçt məlumatlarınızı doldurun.',
      '5) Sorğunu WhatsApp vasitəsilə dərhal göndərə, yaxud e-poçtla rəsmi kommersiya təklifi tələb edə bilərsiniz.',
      'Menecerlərimiz adətən 1 iş saatı ərzində sizinlə əlaqə saxlayır.',
    ].join('\n'),
  },
  {
    slug: 'site-vin-sorgusu',
    topic: 'site_usage',
    title: 'VIN kod ilə detal seçimi',
    keywords: ['vin', 'vin kod', 'şassi nömrəsi', 'uyğunluq', 'hansı detal'],
    priority: 8,
    body: [
      'Detalın maşınınıza uyğun olduğuna əmin deyilsinizsə, VIN kod yoxlanışından istifadə edin.',
      '"Bizimlə Əlaqə" səhifəsindəki "VIN Kod və Ehtiyat Hissəsi Sorğusu" formasını doldurun:',
      'VIN kodu, ehtiyac duyduğunuz detalın adını və ya OEM kodunu yazın.',
      'Mütəxəssislərimiz VIN üzrə dəqiq kataloq yoxlaması aparıb sizə uyğun detalın kodunu təsdiqləyir.',
      'Bu xidmət pulsuzdur və səhv detal alınmasının qarşısını alır.',
    ].join('\n'),
  },
  {
    slug: 'site-promokod',
    topic: 'site_usage',
    title: 'Promokod necə istifadə olunur',
    keywords: ['promokod', 'endirim', 'kupon', 'promo', 'güzəşt'],
    priority: 5,
    body: [
      'Promokodu səbət pəncərəsindəki "Promokod" sahəsinə daxil edib təsdiq düyməsinə basın.',
      'Endirim dərhal yekun məbləğə tətbiq olunur.',
      'Promokod işləmirsə, müddəti bitmiş və ya deaktiv edilmiş ola bilər — bu halda menecerlə əlaqə saxlayın.',
    ].join('\n'),
  },
  {
    slug: 'site-hesab-qeydiyyat',
    topic: 'site_usage',
    title: 'Qeydiyyat və hesaba giriş',
    keywords: ['qeydiyyat', 'hesab', 'giriş', 'login', 'parol', 'profil', 'daxil olmaq'],
    priority: 5,
    body: [
      'Sağ yuxarıdakı profil ikonu vasitəsilə qeydiyyatdan keçə və ya hesabınıza daxil ola bilərsiniz.',
      'Qeydiyyat sorğularınızın tarixçəsini saxlamaq üçün faydalıdır, lakin sorğu göndərmək üçün MƏCBURİ DEYİL.',
      'Parolunuzu unutmusunuzsa menecerlə əlaqə saxlayın.',
      'Qeyd: "Anbardar paneli" yalnız şirkət əməkdaşları üçündür və adi müştərilərə açıq deyil.',
    ].join('\n'),
  },
  {
    slug: 'site-dil-secimi',
    topic: 'site_usage',
    title: 'Saytın dilini dəyişmək',
    keywords: ['dil', 'language', 'rus', 'ingilis', 'tərcümə', 'az', 'en', 'ru'],
    priority: 3,
    body: [
      'Sayt üç dildə işləyir: Azərbaycan, İngilis və Rus.',
      'Dili yuxarı menyudakı dil seçicisindən (AZ / EN / RU) dəyişə bilərsiniz.',
      'Seçiminiz brauzerinizdə yadda saxlanılır.',
    ].join('\n'),
  },
  {
    slug: 'site-elaqe-melumatlari',
    topic: 'company',
    title: 'M-Trans Logistics əlaqə məlumatları',
    keywords: ['əlaqə', 'ünvan', 'telefon', 'email', 'ofis', 'harada', 'iş saatı', 'kontakt'],
    priority: 10,
    body: [
      'Mərkəzi ofis və təchizat terminalı: Qəzənfər Xalıqov küç., İqtisadi Zona 1, Xırdalan şəhəri, Azərbaycan.',
      'Gürcüstan istiqaməti: Poti Port Logistika Terminalı.',
      'E-poçt: info@m-trans.az (ümumi), manager@m-trans.az (satış), poti@m-trans.az (Poti terminalı).',
      'Telefon və WhatsApp nömrəsi saytın "Bizimlə Əlaqə" səhifəsində göstərilib.',
      'Sorğularınıza adətən 1 iş saatı ərzində cavab verilir.',
    ].join('\n'),
  },
  {
    slug: 'site-catdirilma',
    topic: 'site_usage',
    title: 'Çatdırılma və anbar qalığı barədə',
    keywords: ['çatdırılma', 'göndərmə', 'nə vaxt', 'stok', 'anbar', 'qalıq', 'mövcud'],
    priority: 7,
    body: [
      'Hər detalın kartında anbar qalığı göstərilir.',
      '"Stokda var" — detal anbarımızdadır və dərhal göndərilə bilər.',
      'Stok sıfırdırsa detal sifarişlə gətirilir — bu halda menecer sizə gözləmə müddətini bildirir.',
      'Dəqiq çatdırılma tarixi və nəqliyyat şərtləri sorğunuz əsasında menecer tərəfindən təsdiqlənir.',
      'Şirkət Poti Portu üzərindən beynəlxalq logistika xidməti də göstərir.',
    ].join('\n'),
  },

  // ══════════════════════════════════════════════════════════
  // TEXNİKİ BİLİK
  // ══════════════════════════════════════════════════════════
  {
    slug: 'texniki-yag-deyisme',
    topic: 'technical',
    title: 'Yük avtomobillərində mühərrik yağının dəyişmə intervalı',
    keywords: ['yağ', 'mühərrik yağı', 'yağ dəyişmə', 'servis', 'interval', 'moped yağ'],
    priority: 8,
    body: [
      'Ağır yük texnikasında mühərrik yağının dəyişmə intervalı istismar şəraitindən asılıdır:',
      '• Volvo FH / FM: normal şəraitdə təxminən 60.000–100.000 km və ya ildə bir dəfə.',
      '• Mercedes-Benz Actros: 60.000–120.000 km (uzun məsafə rejimində daha yüksək).',
      '• Scania R/S seriyası: 60.000–90.000 km.',
      '• MAN TGX, DAF XF: 60.000–100.000 km.',
      'Şəhərdaxili, tozlu və ya ağır yüklü rejimdə interval 30–40% qısaldılmalıdır.',
      'Yağ dəyişilərkən yağ filtri MÜTLƏQ birlikdə dəyişdirilir.',
      'Dəqiq interval üçün istehsalçının servis kitabçasına baxın.',
    ].join('\n'),
  },
  {
    slug: 'texniki-filtr-novleri',
    topic: 'technical',
    title: 'Filtr növləri və dəyişmə vaxtları',
    keywords: ['filtr', 'hava filtri', 'yanacaq filtri', 'salon filtri', 'yağ filtri', 'kabinə filtri'],
    priority: 8,
    body: [
      'Yük avtomobilində dörd əsas filtr var:',
      '• Yağ filtri — hər yağ dəyişməsində (60.000–100.000 km).',
      '• Yanacaq filtri — 40.000–60.000 km. Keyfiyyətsiz yanacaqda daha tez.',
      '• Hava filtri — 40.000–80.000 km, tozlu yollarda 20.000 km-də yoxlanmalıdır.',
      '• Kabinə (salon) filtri — ildə bir dəfə və ya 30.000 km.',
      'Tıxanmış hava filtri yanacaq sərfini artırır və gücü azaldır.',
      'Tıxanmış yanacaq filtri isə enjeksiya pompasına ciddi zərər vura bilər.',
    ].join('\n'),
  },
  {
    slug: 'texniki-eylec-asinma',
    topic: 'technical',
    title: 'Əyləc bəndlərinin və disklərinin aşınma əlamətləri',
    keywords: ['əyləc', 'tormoz', 'disk', 'bənd', 'lövhə', 'cırıltı', 'səs', 'aşınma', 'fren'],
    priority: 8,
    body: [
      'Əyləc sisteminin dəyişdirilməli olduğunu göstərən əlamətlər:',
      '• Əyləc zamanı metal cırıltısı və ya fit səsi — bəndlər kritik həddə aşınıb.',
      '• Sükanda və ya pedalda titrəyiş — disk əyilib və ya qeyri-bərabər aşınıb.',
      '• Əyləc məsafəsinin uzanması.',
      '• Pedalın həddindən artıq dərinə getməsi — sistemdə hava və ya maye itkisi ola bilər.',
      '• Maşının əyləc zamanı bir tərəfə çəkilməsi — bir tərəfdəki suport ilişib.',
      'Yük texnikasında əyləc bəndləri adətən 80.000–150.000 km, disklər isə 2 dəst bənd ömrünə bərabər müddət xidmət edir.',
      'Əyləc bəndləri HƏMİŞƏ ox üzrə cüt-cüt dəyişdirilir.',
    ].join('\n'),
  },
  {
    slug: 'texniki-pnevmatik-sistem',
    topic: 'technical',
    title: 'Pnevmatik (hava) sistemin qulluğu',
    keywords: ['pnevmatik', 'hava', 'kompressor', 'wabco', 'knorr', 'hava sızması', 'quruducu'],
    priority: 7,
    body: [
      'Yük avtomobilinin əyləc və asqı sistemi sıxılmış hava ilə işləyir.',
      'Əsas qulluq nöqtələri:',
      '• Hava quruducusunun (air dryer) kartricı ildə bir dəfə və ya 100.000 km-də dəyişdirilir. Kartric işləmirsə sistemə rütubət düşür və qışda donma yaranır.',
      '• Hava rezervuarlarındakı kondensat müntəzəm boşaldılmalıdır.',
      '• Hava sızması səsi eşidilirsə, valfları və birləşmələri yoxlayın — sızma kompressoru həddindən artıq işlədir.',
      '• Kompressor təzyiqi normada 8–12 bar arasında olmalıdır.',
      'WABCO və Knorr-Bremse bu sahədə əsas istehsalçılardır və hər ikisinin məhsulları anbarımızda mövcuddur.',
    ].join('\n'),
  },
  {
    slug: 'texniki-amortizator',
    topic: 'technical',
    title: 'Amortizator və asqı sisteminin vəziyyəti',
    keywords: ['amortizator', 'asqı', 'yaylanma', 'rессор', 'körpü', 'süspansiyon'],
    priority: 6,
    body: [
      'Amortizatorun dəyişdirilməli olduğunu göstərən əlamətlər:',
      '• Gövdəsində yağ sızıntısı.',
      '• Maşının nahamar yolda həddindən artıq yırğalanması və tez sakitləşməməsi.',
      '• Təkərlərin qeyri-bərabər aşınması.',
      '• Əyləc zamanı burun hissənin çox aşağı düşməsi.',
      'Amortizatorlar ox üzrə cüt-cüt dəyişdirilir.',
      'Orta xidmət müddəti ağır yük texnikasında 100.000–150.000 km-dir.',
    ].join('\n'),
  },
  {
    slug: 'texniki-soyutma-sistemi',
    topic: 'technical',
    title: 'Soyutma sistemi: termostat, su pompası, radiator',
    keywords: ['soyutma', 'termostat', 'su pompası', 'radiator', 'qızma', 'antifriz', 'temperatur'],
    priority: 6,
    body: [
      'Mühərrikin həddindən artıq qızmasının əsas səbəbləri:',
      '• Termostatın ilişib qapalı qalması — mühərrik tez qızır, radiator soyuq qalır.',
      '• Su pompasının podşipnikinin dağılması — səs və sızma müşahidə olunur.',
      '• Radiatorun xaricdən tozla, daxildən əhəngləşmə ilə tıxanması.',
      '• Antifrizin azalması və ya keyfiyyətini itirməsi.',
      'Antifriz adətən hər 2–3 ildə və ya 200.000 km-də dəyişdirilir.',
      'Mühərrik qızarsa dərhal saxlayın — davam etmək baş bloka (silindr başlığına) ciddi zərər verə bilər.',
    ].join('\n'),
  },
  {
    slug: 'texniki-akkumulyator-alternator',
    topic: 'technical',
    title: 'Akkumulyator və alternator problemləri',
    keywords: ['akkumulyator', 'alternator', 'batareya', 'işə düşmür', 'elektrik', 'şarj'],
    priority: 6,
    body: [
      'Maşın işə düşmürsə ilk yoxlanılacaqlar:',
      '• Akkumulyator klemmalarının oksidləşməsi və bərkidilməsi.',
      '• Akkumulyator gərginliyi: mühərrik söndürülmüş halda 12,6 V (24 V sistemdə ~25,2 V) olmalıdır.',
      '• Alternator işləyən mühərrikdə 13,8–14,4 V (24 V sistemdə 27–28 V) verməlidir.',
      'Alternator kəməri sürüşürsə fit səsi gəlir və şarj zəifləyir.',
      'Yük texnikasında adətən iki ədəd 12 V akkumulyator ardıcıl bağlanaraq 24 V sistem yaradır — onlar HƏMİŞƏ cüt dəyişdirilir.',
    ].join('\n'),
  },
  {
    slug: 'texniki-oem-kod-nedir',
    topic: 'technical',
    title: 'OEM kod nədir və nə üçün lazımdır',
    keywords: ['oem', 'oem kod', 'artikul', 'kod nədir', 'analoq', 'əvəzedici', 'cross reference'],
    priority: 9,
    body: [
      'OEM (Original Equipment Manufacturer) kod — detalın avtomobil istehsalçısı tərəfindən verilmiş orijinal nömrəsidir.',
      'Məsələn Mercedes-in verdiyi 1665011200 kodu konkret bir termostatı bildirir.',
      'Eyni detalı Bosch, Knorr-Bremse, Ferodo kimi müstəqil istehsalçılar da hazırlaya bilər — onların öz artikul nömrəsi olur.',
      'Bu uyğunluğa "cross-reference" (çarpaz uyğunluq) deyilir.',
      'Sistemimiz OEM kodu üzrə axtarış apararaq bütün uyğun analoqları tapır — beləliklə orijinaldan daha sərfəli, lakin keyfiyyətcə eyni variantı seçə bilərsiniz.',
      'Detalın üzərindəki və ya köhnə detalın qutusundakı kodu bizə göndərsəniz, uyğun variantları tapa bilərik.',
    ].join('\n'),
  },
];

module.exports = { ARTICLES };
