// ============================================
// FIREBASE YAPILANDIRMA DOSYASI
// ============================================
// Bu dosya tüm sayfalarda Firebase bağlantısını yönetir.
// Ayarlar domain-bagla.html sayfasından değiştirilebilir.
// ============================================

// Firebase ayarları var mı kontrol et
function firebaseAyarlariVarMi() {
    var saved = localStorage.getItem('account_settings');
    if (saved) {
        try {
            var s = JSON.parse(saved);
            if (s.firebaseApiKey && s.firebaseProjectId && s.firebaseDatabaseUrl) {
                return true;
            }
        } catch(e) {}
    }
    return false;
}

// Firebase ayarları yoksa domain-bagla.html'e yönlendir
// (sadece ana-sayfa ve ürün sayfalarında çalışır, domain-bagla.html'de çalışmaz)
function firebaseKontrolVeYonlendir() {
    var currentPage = window.location.pathname.split('/').pop();
    var muafSayfalar = ['domain-bagla.html', 'index.html', ''];
    
    if (!muafSayfalar.includes(currentPage) && !firebaseAyarlariVarMi()) {
        // Varsayılan değerler kullanılıyor, uyarı göster
        console.log('⚠️ Firebase ayarları yapılmamış, varsayılan kullanılıyor');
    }
}

// localStorage'dan ayarları oku
function getFirebaseConfig() {
    var saved = localStorage.getItem('account_settings');
    if (saved) {
        try {
            var s = JSON.parse(saved);
            // Eğer kullanıcı kendi bilgilerini girdiyse onları kullan
            if (s.firebaseApiKey && s.firebaseProjectId && s.firebaseDatabaseUrl) {
                console.log('✅ Özel Firebase ayarları kullanılıyor');
                return {
                    apiKey: s.firebaseApiKey,
                    authDomain: s.firebaseProjectId + ".firebaseapp.com",
                    databaseURL: s.firebaseDatabaseUrl,
                    projectId: s.firebaseProjectId,
                    storageBucket: s.firebaseProjectId + ".appspot.com",
                    messagingSenderId: "000000000000",
                    appId: "1:000000000000:web:000000000000"
                };
            }
        } catch(e) {
            console.log('⚠️ Ayarlar okunamadı, varsayılan kullanılıyor');
        }
    }
    
    // ============================================
    // VARSAYILAN DEĞERLER
    // ============================================
    // Arkadaşına vereceğin kopyada bu kısmı BOŞ BIRAK
    // Arkadaşın domain-bagla.html'den kendi bilgilerini girecek
    // ============================================
    
    console.log('ℹ️ Varsayılan Firebase ayarları kullanılıyor');
    return {
        apiKey: "AIzaSyBiEXctGsBTCHpuFtQMTDU-uYsuxvASR8I",
        authDomain: "hizlikargo-93a30.firebaseapp.com",
        databaseURL: "https://hizlikargo-93a30-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "hizlikargo-93a30",
        storageBucket: "hizlikargo-93a30.appspot.com",
        messagingSenderId: "604815462602",
        appId: "1:604815462602:web:8ca69b66610618e5136433"
    };
}

// Firebase'i başlat
var firebaseConfig = getFirebaseConfig();

// Eğer Firebase zaten başlatılmamışsa başlat
if (typeof firebase !== 'undefined') {
    if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase başlatıldı');
    }
    var database = firebase.database();
    
    // Firebase ayarları kontrolü
    firebaseKontrolVeYonlendir();
}

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

// WhatsApp numarasını al
function getWhatsAppNumber() {
    // Önce ana sayfadan kaydedilen numaraya bak
    var wpNumara = localStorage.getItem('whatsapp_numara');
    if (wpNumara) return wpNumara;
    
    // Sonra account_settings'e bak
    var saved = localStorage.getItem('account_settings');
    if (saved) {
        try {
            var s = JSON.parse(saved);
            if (s.whatsappNumber) return s.whatsappNumber;
        } catch(e) {}
    }
    
    return "905551234567"; // Varsayılan
}

// Site adını al
function getSiteName() {
    var saved = localStorage.getItem('account_settings');
    if (saved) {
        try {
            var s = JSON.parse(saved);
            if (s.siteName) return s.siteName;
        } catch(e) {}
    }
    return "Mağaza"; // Varsayılan
}

// Meta Pixel ID al
function getMetaPixelId() {
    var saved = localStorage.getItem('meta_pixel_settings');
    if (saved) {
        try {
            var s = JSON.parse(saved);
            if (s.pixelId && s.active) return s.pixelId;
        } catch(e) {}
    }
    return null;
}

// TikTok Pixel ID al
function getTikTokPixelId() {
    var saved = localStorage.getItem('tiktok_pixel_settings');
    if (saved) {
        try {
            var s = JSON.parse(saved);
            if (s.pixelId && s.active) return s.pixelId;
        } catch(e) {}
    }
    return null;
}

// Firebase bağlantı durumunu kontrol et
function checkFirebaseConnection() {
    if (typeof firebase === 'undefined' || !database) {
        return { connected: false, message: 'Firebase yüklenmedi' };
    }
    
    return { connected: true, message: 'Firebase bağlı' };
}

console.log('📦 Firebase Config yüklendi');
