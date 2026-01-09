/* GARİBAN BEYİN - Site + İnternet Erişimli */

var geminiApiKey = localStorage.getItem('gemini_api_key') || 'AIzaSyDAvGYW6TmX1fdf0a9Ik45JbvdIkoYMQKA';
var geminiModel = 'gemini-2.0-flash';
var konusmaGecmisi = [];

// Site verilerini çek
async function siteVerisiAl() {
  if (typeof database === 'undefined') return null;
  
  var bugun = new Date().toLocaleDateString('tr-TR');
  var veri = { bugunSiparis: 0, bugunCiro: 0, toplamSiparis: 0, bekleyen: 0, stoklar: [], online: 0 };
  
  try {
    // Siparişler
    var sipSnap = await database.ref('siparisler').once('value');
    sipSnap.forEach(function(c) {
      var s = c.val();
      veri.toplamSiparis++;
      if (s.tarih === bugun) {
        veri.bugunSiparis++;
        veri.bugunCiro += parseInt((s.tutar || '0').replace(/\D/g, '')) || 0;
      }
      var d = (s.durum || '').toLowerCase();
      if (d !== 'tamamlandi' && d !== 'tamamlandı' && d !== 'iptal') veri.bekleyen++;
    });
    
    // Stoklar
    var stokSnap = await database.ref('forumStoklar').once('value');
    var stoklar = stokSnap.val() || {};
    for (var i = 1; i <= 10; i++) {
      var stok = stoklar['forum' + i] || 0;
      veri.stoklar.push('Ürün' + i + ':' + stok);
    }
    
    // Online
    var onlineSnap = await database.ref('canliZiyaretciler').once('value');
    var now = Date.now();
    onlineSnap.forEach(function(c) {
      if (c.val().timestamp > now - 60000) veri.online++;
    });
    
    return veri;
  } catch(e) {
    return null;
  }
}

// İnternette ara
async function internetAra(sorgu) {
  try {
    // Wikipedia
    var wikiRes = await fetch('https://tr.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(sorgu));
    if (wikiRes.ok) {
      var wiki = await wikiRes.json();
      if (wiki.extract) return wiki.extract;
    }
  } catch(e) {}
  
  try {
    // DuckDuckGo
    var ddgRes = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(sorgu) + '&format=json&no_html=1');
    var ddg = await ddgRes.json();
    if (ddg.AbstractText) return ddg.AbstractText;
    if (ddg.RelatedTopics && ddg.RelatedTopics[0] && ddg.RelatedTopics[0].Text) {
      return ddg.RelatedTopics.slice(0,3).map(function(t) { return t.Text; }).join('\n');
    }
  } catch(e) {}
  
  return null;
}

// Gemini'ye sor
async function geminiSor(mesaj, ekVeri) {
  if (!geminiApiKey) return '❌ API Key yok!';
  
  try {
    var gecmis = konusmaGecmisi.slice(-6).map(function(m) {
      return (m.rol === 'user' ? 'Kullanıcı: ' : 'Sen: ') + m.mesaj;
    }).join('\n');

    var prompt = `Sen GARİBAN, akıllı bir e-ticaret asistanısın. Türkçe konuş, samimi ol.
${gecmis ? '\nÖnceki konuşma:\n' + gecmis : ''}
${ekVeri ? '\n' + ekVeri : ''}

Kullanıcı: ${mesaj}`;

    var response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + geminiModel + ':generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8 }
      })
    });
    
    if (!response.ok) {
      if (response.status === 429) return '⏳ Biraz yavaş yaz!';
      return '❌ Hata: ' + response.status;
    }
    
    var data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      var cevap = data.candidates[0].content.parts[0].text;
      konusmaGecmisi.push({ rol: 'user', mesaj: mesaj });
      konusmaGecmisi.push({ rol: 'assistant', mesaj: cevap });
      if (konusmaGecmisi.length > 20) konusmaGecmisi = konusmaGecmisi.slice(-20);
      return cevap;
    }
    return '🤔 Anlayamadım?';
  } catch (e) {
    return '❌ Bağlantı hatası!';
  }
}

// Ana fonksiyon
async function ramcoAkilliCevap(mesaj) {
  var m = mesaj.toLowerCase().trim();
  
  // API Key
  if (m.startsWith('api key:')) {
    geminiApiKey = mesaj.replace(/api key:/i, '').trim();
    localStorage.setItem('gemini_api_key', geminiApiKey);
    return '✅ Kaydedildi!';
  }
  
  // İnternet araması
  if (m.startsWith('ara:') || m.startsWith('arama:')) {
    var sorgu = mesaj.replace(/ara:|arama:/i, '').trim();
    var sonuc = await internetAra(sorgu);
    if (sonuc) {
      return '🔍 ' + sorgu + ':\n\n' + sonuc;
    }
    return await geminiSor('İnternette bulamadım, sen biliyorsan anlat: ' + sorgu, null);
  }
  
  // Site ile ilgili sorular
  if (m.includes('sipariş') || m.includes('ciro') || m.includes('stok') || m.includes('durum') || 
      m.includes('site') || m.includes('satış') || m.includes('online') || m.includes('bekleyen')) {
    var veri = await siteVerisiAl();
    var ekVeri = null;
    if (veri) {
      ekVeri = '[SİTE VERİLERİ: Bugün ' + veri.bugunSiparis + ' sipariş, ' + veri.bugunCiro.toLocaleString('tr-TR') + '₺ ciro, ' +
        'Toplam ' + veri.toplamSiparis + ' sipariş, Bekleyen ' + veri.bekleyen + ', Online ' + veri.online + ' kişi, ' +
        'Stoklar: ' + veri.stoklar.join(', ') + ']';
    }
    return await geminiSor(mesaj, ekVeri);
  }
  
  // Yardım
  if (m === 'yardım' || m === 'help') {
    return '🤖 GARİBAN\n\n💬 Her şeyi sor!\n🔍 "ara: konu" - internette ara\n📊 "durum" - site durumu';
  }
  
  // Normal soru
  return await geminiSor(mesaj, null);
}

function ramcoCevapAl(mesaj, callback) {
  ramcoAkilliCevap(mesaj).then(callback);
}

function ramcoIstatistik() {
  return { geminiAktif: !!geminiApiKey };
}

function ramcoBeyniniBaslat() {
  console.log('🧠 GARİBAN hazır! (Site + İnternet)');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ramcoBeyniniBaslat);
} else {
  ramcoBeyniniBaslat();
}
