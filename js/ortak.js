// Ortak yardımcılar: kayıt, ses, titreşim, ikonlar, modal, efektler, altın.

const Depo = {
  oku(anahtar, varsayilan) {
    try {
      const deger = localStorage.getItem('bulmaca.' + anahtar);
      return deger == null ? varsayilan : JSON.parse(deger);
    } catch { return varsayilan; }
  },
  yaz(anahtar, deger) {
    try { localStorage.setItem('bulmaca.' + anahtar, JSON.stringify(deger)); } catch {}
  },
};

const azHareket = (() => {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
})();

const bekle = (ms) => new Promise((coz) => setTimeout(coz, azHareket ? Math.min(ms, 40) : ms));
const sayi = (n) => Math.round(n).toLocaleString('tr-TR');
const $ = (secici, kok = document) => kok.querySelector(secici);
const $$ = (secici, kok = document) => [...kok.querySelectorAll(secici)];
const titret = (desen) => { try { navigator.vibrate?.(desen); } catch {} };

function rastgeleSec(dizi, rnd = Math.random) {
  return dizi[Math.floor(rnd() * dizi.length)];
}

function agirlikliSec(liste, rnd = Math.random) {
  const toplam = liste.reduce((t, o) => t + o.agirlik, 0);
  let r = rnd() * toplam;
  for (const o of liste) {
    r -= o.agirlik;
    if (r <= 0) return o.deger;
  }
  return liste[liste.length - 1].deger;
}

// Aynı tohum her yerde aynı diziyi verir (günlük kasa herkese aynı şifreyi sorar).
function tohumluRastgele(metin) {
  let h = 1779033703 ^ metin.length;
  for (let i = 0; i < metin.length; i++) {
    h = Math.imul(h ^ metin.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// İkonlar: 24'lük kutuda çizgi ikonlar.
const IKONLAR = {
  geri: '<path d="M15 18l-6-6 6-6"/>',
  altin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
  ses: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
  sessiz: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>',
  kilit: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  sil: '<path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="M12 9l6 6M18 9l-6 6"/>',
  yildirim: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  zincir: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  patlama: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  cekic: '<path d="M13 3l8 8-3 3-8-8z"/><path d="M11.5 9.5L3 18l3 3 8.5-8.5"/>',
  takas: '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
  balik: '<path d="M2 12c3.5-5 10-6.5 15 0-5 6.5-11.5 5-15 0z"/><path d="M17 12l5-4v8z"/><circle cx="7.5" cy="11" r="0.6"/>',
  kucuk: '<path d="M12 4v14M6 12l6 6 6-6"/>',
  pusula: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  sandik: '<path d="M3 10h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 10a9 5 0 0 1 18 0"/><path d="M10 13h4"/>',
  roket: '<path d="M12 2c4 3 5.5 8 4 13H8C6.5 10 8 5 12 2z"/><path d="M8 15l-3 4h4M16 15l3 4h-4"/><circle cx="12" cy="9" r="1.5"/>',
  alev: '<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-4-1-6.5 1-9.5z"/>',
  tik: '<path d="M5 12l5 5 9-10"/>',
  saat: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  paylas: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v13M7 8l5-5 5 5"/>',
  soru: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.6"/><path d="M12 17.2v.1"/>',
  kupa: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5a3.5 3.5 0 0 0 3.8 4M16 6h3.5a3.5 3.5 0 0 1-3.8 4"/><path d="M12 13v4M8 21h8M10 17h4"/>',
  yenile: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
};

function ikon(ad, boyut = 22, kalinlik = 2.2) {
  return `<svg width="${boyut}" height="${boyut}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${kalinlik}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKONLAR[ad] || ''}</svg>`;
}

function ikonlariDoldur(kok = document) {
  $$('[data-ikon]', kok).forEach((yer) => {
    if (!yer.firstChild) yer.innerHTML = ikon(yer.dataset.ikon, Number(yer.dataset.boyut) || 22);
  });
}

// Ses: tarayıcı sesi ilk dokunuştan sonra açar.
const Ses = {
  ctx: null,
  acik: Depo.oku('ses', true),
  baslat() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {}
  },
  ton(frekans, sure = 0.12, tip = 'sine', guc = 0.12, gecikme = 0) {
    if (!this.acik || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + gecikme;
      const osc = this.ctx.createOscillator();
      const kazanc = this.ctx.createGain();
      osc.type = tip;
      osc.frequency.setValueAtTime(frekans, t);
      kazanc.gain.setValueAtTime(0.0001, t);
      kazanc.gain.exponentialRampToValueAtTime(guc, t + 0.012);
      kazanc.gain.exponentialRampToValueAtTime(0.0001, t + sure);
      osc.connect(kazanc).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + sure + 0.03);
    } catch {}
  },
  dus() { this.ton(196, 0.09, 'triangle', 0.14); },
  // Zincir uzadıkça ses inceliyor: her halka iki yarım ton yukarı.
  birles(adim) {
    const f = 392 * Math.pow(2, (Math.min(adim, 14) * 2) / 12);
    this.ton(f, 0.16, 'square', 0.05);
    this.ton(f * 1.5, 0.22, 'sine', 0.09, 0.03);
  },
  tus() { this.ton(700, 0.05, 'triangle', 0.07); },
  hata() { this.ton(150, 0.22, 'sawtooth', 0.06); },
  kilPayi() { this.ton(520, 0.12, 'square', 0.05); this.ton(494, 0.2, 'square', 0.05, 0.12); },
  zafer() { [523, 659, 784, 1047].forEach((f, i) => this.ton(f, 0.26, 'triangle', 0.11, i * 0.09)); },
  gerilim(i) { this.ton(220 + i * 90, 0.16, 'square', 0.05); },
  odul(seviye) {
    const notalar = seviye === 'efsanevi' ? [523, 659, 784, 1047, 1319, 1568] : seviye === 'nadir' ? [523, 659, 784, 1047] : [523, 784];
    notalar.forEach((f, i) => this.ton(f, 0.32, 'triangle', 0.11, i * 0.07));
  },
  kaybet() { [392, 330, 262].forEach((f, i) => this.ton(f, 0.3, 'triangle', 0.09, i * 0.14)); },
};

// Modal
const Modal = {
  perde: null,
  kutu: null,
  ac(html, sinif = '') {
    this.perde = $('#perde');
    this.kutu = $('#modal');
    this.kutu.className = 'modal ' + sinif;
    this.kutu.innerHTML = html;
    ikonlariDoldur(this.kutu);
    this.perde.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => this.perde.classList.add('acik')));
    const ilk = this.kutu.querySelector('button');
    if (ilk) setTimeout(() => ilk.focus({ preventScroll: true }), 60);
    return this.kutu;
  },
  kapat() {
    if (!this.perde) return;
    this.perde.classList.remove('acik');
    this.perde.hidden = true;
    this.kutu.innerHTML = '';
  },
};

// Efektler
function merkez(eleman) {
  const k = eleman.getBoundingClientRect();
  return { x: k.left + k.width / 2, y: k.top + k.height / 2 };
}

function parcacik(x, y, renkler, adet = 14, uzaklik = 90) {
  if (azHareket) return;
  const katman = $('#efekt');
  for (let i = 0; i < adet; i++) {
    const p = document.createElement('div');
    const boy = 4 + Math.random() * 7;
    p.className = 'parcacik';
    p.style.cssText = `left:${x}px;top:${y}px;width:${boy}px;height:${boy}px;background:${rastgeleSec(renkler)}`;
    katman.append(p);
    const aci = Math.random() * Math.PI * 2;
    const mesafe = uzaklik * (0.4 + Math.random() * 0.8);
    const dx = Math.cos(aci) * mesafe;
    const dy = Math.sin(aci) * mesafe + 20;
    p.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`, opacity: 0 },
      ],
      { duration: 500 + Math.random() * 350, easing: 'cubic-bezier(.2,.8,.2,1)' }
    ).onfinish = () => p.remove();
  }
}

function ucanYazi(x, y, metin, renk = 'var(--pembe)', boyut = 20) {
  const katman = $('#efekt');
  const yazi = document.createElement('div');
  yazi.className = 'ucan-yazi';
  yazi.textContent = metin;
  yazi.style.cssText = `left:${x}px;top:${y}px;color:${renk};font-size:${boyut}px`;
  katman.append(yazi);
  yazi.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0 },
      { transform: 'translate(-50%, -90%) scale(1.1)', opacity: 1, offset: 0.2 },
      { transform: 'translate(-50%, -260%) scale(1)', opacity: 0 },
    ],
    { duration: azHareket ? 600 : 900, easing: 'cubic-bezier(.2,.8,.2,1)' }
  ).onfinish = () => yazi.remove();
}

function yenidenOynat(eleman, sinif) {
  eleman.classList.remove(sinif);
  void eleman.offsetWidth;
  eleman.classList.add(sinif);
}

// Altın
const Cuzdan = {
  miktar() { return Depo.oku('altin', 100); },
  ekle(n) {
    Depo.yaz('altin', this.miktar() + n);
    this.goster(true);
  },
  harca(n) {
    if (this.miktar() < n) return false;
    Depo.yaz('altin', this.miktar() - n);
    this.goster();
    return true;
  },
  goster(parla = false) {
    $$('[data-altin]').forEach((yer) => {
      yer.textContent = sayi(this.miktar());
      if (parla) yenidenOynat(yer.parentElement, 'parla');
    });
  },
};

// Tarih (günlük kasa yerel saatle gün değiştirir)
function gunAnahtari(tarih = new Date()) {
  const a = String(tarih.getMonth() + 1).padStart(2, '0');
  const g = String(tarih.getDate()).padStart(2, '0');
  return `${tarih.getFullYear()}-${a}-${g}`;
}
function gunEkle(tarih, n) {
  const d = new Date(tarih);
  d.setDate(d.getDate() + n);
  return d;
}
