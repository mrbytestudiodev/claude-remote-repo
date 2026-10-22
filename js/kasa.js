// Kasa Kırıcı ve Günlük Kasa: rakamları farklı bir şifreyi ipuçlarıyla bul.
// Açılan her kasa rastgele nadirlikte bir koleksiyon eşyası verir; az denemede açmak şansı artırır.

const Kasa = (() => {
  const SETLER = [
    { id: 'kasif', ad: 'Kaşif Seti', ikon: 'pusula', esyalar: [['Altın Pusula', 'efsanevi'], ['Dürbün', 'nadir'], ['Çadır', 'nadir'], ['Harita', 'siradan'], ['Fener', 'siradan'], ['Matara', 'siradan']] },
    { id: 'korsan', ad: 'Korsan Seti', ikon: 'sandik', esyalar: [['Hazine Sandığı', 'efsanevi'], ['Papağan', 'nadir'], ['Kılıç', 'nadir'], ['Kanca', 'siradan'], ['Göz Bandı', 'siradan'], ['Şişede Mektup', 'siradan']] },
    { id: 'uzay', ad: 'Uzay Seti', ikon: 'roket', esyalar: [['Roket', 'efsanevi'], ['Astronot Kaskı', 'nadir'], ['Uzaylı', 'nadir'], ['Uydu', 'siradan'], ['Meteor', 'siradan'], ['Halkalı Gezegen', 'siradan']] },
  ];
  const TOPLAM_ESYA = SETLER.length * 6;
  const GORUNUM = {
    siradan: { baslik: 'SIRADAN', renk: 'var(--camgobegi)', parilti: 'rgba(61,214,245,.35)', isin: 'rgba(61,214,245,.08)', golge: '#0E5566' },
    nadir: { baslik: 'NADİR!', renk: 'var(--mor)', parilti: 'rgba(164,123,255,.45)', isin: 'rgba(164,123,255,.12)', golge: '#3B2A7A' },
    efsanevi: { baslik: 'EFSANEVİ!', renk: 'var(--amber)', parilti: 'rgba(255,181,71,.55)', isin: 'rgba(255,181,71,.14)', golge: 'var(--amber-koyu)' },
  };
  const KOPYA_ALTIN = { siradan: 30, nadir: 80, efsanevi: 200 };
  const IPUCU_FIYAT = 30;
  const BASLANGIC = new Date(2026, 0, 1);

  let mod = null, uzunluk, hakToplam, kod, tahminler, giris, ipuclari, bitti, kasaNo;
  let kuruldu = false;

  const gunlukNo = () => Math.floor((new Date(gunAnahtari()) - new Date(gunAnahtari(BASLANGIC))) / 864e5) + 1;
  const kalanHak = () => hakToplam - tahminler.length;

  function sanslar(kalan) {
    const efsanevi = 8 + kalan * 2.5;
    const nadir = 27 + kalan * 2.5;
    return { siradan: 100 - efsanevi - nadir, nadir, efsanevi };
  }

  function kodUret(rnd = Math.random) {
    const rakamlar = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = rakamlar.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [rakamlar[i], rakamlar[j]] = [rakamlar[j], rakamlar[i]];
    }
    return rakamlar.slice(0, uzunluk);
  }

  function kur() {
    kuruldu = true;
    const tuslar = $('#k-tuslar');
    const dizilim = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'sil', 0, 'ac'];
    tuslar.innerHTML = dizilim
      .map((t) =>
        t === 'sil' ? `<button class="tus tus-sil" data-tus="sil" aria-label="Son rakamı sil">${ikon('sil', 24)}</button>`
        : t === 'ac' ? '<button class="tus tus-ac" data-tus="ac">Aç</button>'
        : `<button class="tus" data-tus="${t}">${t}</button>`)
      .join('');
    tuslar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tus]');
      if (btn && !btn.disabled) tusaBas(btn.dataset.tus);
    });
    $('#k-ipucu').addEventListener('click', ipucuAl);
    document.addEventListener('keydown', (e) => {
      if ($('#ekran-kasa').hidden || !$('#perde').hidden) return;
      if (/^[0-9]$/.test(e.key)) tusaBas(e.key);
      else if (e.key === 'Backspace') tusaBas('sil');
      else if (e.key === 'Enter') tusaBas('ac');
      else return;
      e.preventDefault();
    });
  }

  function tusaBas(t) {
    Ses.baslat();
    if (bitti) return;
    if (t === 'sil') { giris.pop(); Ses.tus(); }
    else if (t === 'ac') { if (giris.length === uzunluk) return tahminEt(); return; }
    else {
      const r = Number(t);
      if (giris.length >= uzunluk || giris.includes(r)) return;
      giris.push(r);
      Ses.tus();
      titret(6);
    }
    ciz();
  }

  // Ekran
  function ciz() {
    $('#k-baslik').textContent = mod === 'gunluk' ? `Günlük Kasa #${gunlukNo()}` : `Kasa #${kasaNo}`;
    const s = sanslar(Math.max(0, kalanHak() - 1));
    [['1', s.siradan], ['2', s.nadir], ['3', s.efsanevi]].forEach(([i, deger]) => {
      $('#k-s' + i).style.width = deger + '%';
      $('#k-y' + i).textContent = '%' + Math.round(deger);
    });

    const hak = $('#k-hak');
    hak.textContent = bitti ? (tahminler.at(-1)?.yesil === uzunluk ? 'Açıldı' : 'Kilitlendi') : `${kalanHak()} hak kaldı`;
    hak.classList.toggle('az', !bitti && kalanHak() <= 2);

    const satirlar = tahminler.map((t) => {
      const kil = !bitti && t.yesil === uzunluk - 1;
      const civiler = Array.from({ length: uzunluk }, (_, i) => `<i class="civi ${i < t.yesil ? 'civi-yesil' : i < t.yesil + t.sari ? 'civi-sari' : ''}"></i>`).join('');
      return `<div class="satir ${kil ? 'kil-payi' : ''}">
        ${t.rakamlar.map((r) => `<div class="rakam">${r}</div>`).join('')}
        <div class="civiler" role="img" aria-label="${t.yesil} doğru yerde, ${t.sari} var ama yeri yanlış">${civiler}</div>
        ${kil ? '<span class="satir-etiket">Kıl payı!</span>' : ''}
      </div>`;
    });
    if (!bitti) {
      const kutular = Array.from({ length: uzunluk }, (_, i) =>
        `<div class="rakam ${i < giris.length ? 'dolu' : ''} ${i === giris.length ? 'imlec' : ''}">${giris[i] ?? ''}</div>`).join('');
      satirlar.push(`<div class="satir aktif" style="animation:none">${kutular}</div>`);
    }
    const liste = $('#k-denemeler');
    liste.innerHTML = satirlar.join('');
    liste.scrollTop = liste.scrollHeight;

    const lejant = $('.lejant');
    $$('.ipucu-yazi', lejant).forEach((x) => x.remove());
    ipuclari.forEach((r, i) => lejant.insertAdjacentHTML('beforeend', `<span class="ipucu-yazi" style="color:var(--camgobegi)">${i + 1}. hane: <b>${r}</b></span>`));

    $$('#k-tuslar [data-tus]').forEach((btn) => {
      const t = btn.dataset.tus;
      if (t === 'ac') btn.disabled = bitti || giris.length !== uzunluk;
      else if (t === 'sil') btn.disabled = bitti || !giris.length;
      else btn.disabled = bitti || giris.includes(Number(t)) || giris.length >= uzunluk;
    });

    const ipucu = $('#k-ipucu');
    ipucu.hidden = mod === 'gunluk';
    ipucu.disabled = bitti || ipuclari.size >= uzunluk - 1 || Cuzdan.miktar() < IPUCU_FIYAT;
    $('#k-kadran').classList.toggle('ac', bitti && tahminler.at(-1)?.yesil === uzunluk);
  }

  function ipucuAl() {
    Ses.baslat();
    const bilinmeyen = kod.map((_, i) => i).filter((i) => !ipuclari.has(i));
    if (bitti || bilinmeyen.length <= 1 || !Cuzdan.harca(IPUCU_FIYAT)) return;
    const i = rastgeleSec(bilinmeyen);
    ipuclari.set(i, kod[i]);
    ipuclari = new Map([...ipuclari].sort((a, b) => a[0] - b[0]));
    Ses.odul('siradan');
    ciz();
  }

  async function tahminEt() {
    const yesil = giris.filter((r, i) => r === kod[i]).length;
    const ortak = giris.filter((r) => kod.includes(r)).length;
    tahminler.push({ rakamlar: [...giris], yesil, sari: ortak - yesil });
    giris = [];
    if (yesil === uzunluk || tahminler.length >= hakToplam) bitti = true;
    gunlukKaydet();
    ciz();
    if (yesil === uzunluk) return kazan();
    if (bitti) return kaybet();
    if (yesil === uzunluk - 1) { Ses.kilPayi(); titret([10, 40, 10]); }
    else Ses.dus();
  }

  async function kazan() {
    const kadran = $('#k-kadran');
    const p = merkez(kadran);
    Ses.zafer();
    titret([20, 40, 60]);
    parcacik(p.x, p.y, ['var(--yesil)', 'var(--amber)', '#FFFFFF'], 26, 120);
    const kalan = kalanHak();
    if (mod === 'normal') Depo.yaz('kasa.no', kasaNo + 1);
    else gunlukBitir(true);
    await bekle(950);
    const s = sanslar(kalan);
    const nadirlik = agirlikliSec(Object.entries(s).map(([deger, agirlik]) => ({ deger, agirlik })));
    ganimetAc(nadirlik, kalan);
  }

  function kaybet() {
    Ses.kaybet();
    titret(60);
    yenidenOynat($('#k-kadran'), 'sars');
    if (mod === 'gunluk') {
      gunlukBitir(false);
      setTimeout(gunlukSonuc, 700);
      return;
    }
    const enIyi = Math.max(...tahminler.map((t) => t.yesil));
    const not = enIyi === uzunluk - 1
      ? `<div class="kutucuk vurgu" style="--sira:2">Bir rakam kalmıştı! En iyi denemende <b>${enIyi}/${uzunluk}</b> rakam doğru yerdeydi.</div>` : '';
    const kutu = Modal.ac(`
      <div class="modal-ust" style="--sira:0">
        <p class="etiket">HAKLAR BİTTİ</p>
        <h2 class="modal-baslik">Kasa kilitlendi</h2>
        <p class="modal-aciklama">Şifre <b style="color:var(--metin);letter-spacing:.2em;font-size:20px">${kod.join('')}</b> idi.</p>
      </div>
      ${not}
      <div class="modal-eylem" style="--sira:3">
        <button class="btn btn-ana" data-yeni>Yeni şifreyle dene</button>
        <button class="btn btn-ikincil" data-menu>Ana menü</button>
      </div>`);
    $('[data-yeni]', kutu).addEventListener('click', () => { Modal.kapat(); yeniKasa(); });
    $('[data-menu]', kutu).addEventListener('click', () => { Modal.kapat(); mod = null; Ekran.git('ana'); });
  }

  // Ganimet
  function setBlogu(set, koleksiyon, yeniAnahtar) {
    const sahip = set.esyalar.filter((_, i) => koleksiyon.includes(`${set.id}:${i}`)).length;
    const hucreler = set.esyalar.map(([ad, nadirlik], i) => {
      const anahtar = `${set.id}:${i}`;
      if (!koleksiyon.includes(anahtar)) return `<div class="set-hucre kilitli" title="Henüz bulunmadı">${ikon('kilit', 18)}</div>`;
      const yeni = anahtar === yeniAnahtar;
      return `<div class="set-hucre ${yeni ? 'yeni' : ''}" style="--renk:${GORUNUM[nadirlik].renk}" title="${ad}">${ikon(set.ikon, 20)}${yeni ? '<span class="yeni-rozet">YENİ</span>' : ''}</div>`;
    }).join('');
    return `<div class="koleksiyon-set" style="width:100%">
      <div class="set-bas"><span>${set.ad} <span class="soluk">${sahip}/6</span></span><span class="kalan">${sahip === 6 ? 'Set tamamlandı!' : `${6 - sahip} parça kaldı`}</span></div>
      <div class="set-izgara">${hucreler}</div>
    </div>`;
  }

  async function ganimetAc(nadirlik, kalan) {
    const kutu = Modal.ac(`
      <div class="isinlar"></div>
      <p class="etiket" id="g-etiket" style="--sira:0">KASA AÇILIYOR</p>
      <div class="sandik-kutu" id="g-sandik" style="--sira:1">${ikon('sandik', 76, 1.8)}</div>
      <div class="modal-ust" id="g-icerik" style="--sira:2"><p class="modal-aciklama">Bakalım içinden ne çıkacak...</p></div>
      <div id="g-set" style="width:100%"></div>
      <div class="modal-eylem" id="g-eylem" style="width:100%"></div>`, 'ganimet');
    const sandik = $('#g-sandik', kutu);
    for (let i = 0; i < 3; i++) {
      await bekle(430);
      yenidenOynat(sandik, 'sallan');
      Ses.gerilim(i);
      titret(15);
    }
    await bekle(480);

    const adaylar = SETLER.flatMap((set) => set.esyalar.map(([ad, n], index) => ({ set, ad, n, index }))).filter((e) => e.n === nadirlik);
    const { set, ad, index } = rastgeleSec(adaylar);
    const anahtar = `${set.id}:${index}`;
    const koleksiyon = Depo.oku('koleksiyon', []);
    const kopya = koleksiyon.includes(anahtar);
    if (!kopya) koleksiyon.push(anahtar);
    Depo.yaz('koleksiyon', koleksiyon);
    const setTamam = !kopya && set.esyalar.every((_, i) => koleksiyon.includes(`${set.id}:${i}`));
    let altin = 20 + kalan * 10 + (kopya ? KOPYA_ALTIN[nadirlik] : 0) + (setTamam ? 500 : 0);
    Cuzdan.ekle(altin);

    const g = GORUNUM[nadirlik];
    kutu.style.setProperty('--renk', g.renk);
    kutu.style.setProperty('--parilti', g.parilti);
    kutu.style.setProperty('--isin', g.isin);
    kutu.style.setProperty('--golge-renk', g.golge);
    kutu.classList.add('acildi');
    sandik.innerHTML = ikon(set.ikon, 76, 1.8);
    sandik.classList.add('acik');
    $('#g-etiket', kutu).textContent = kopya ? 'KOPYA ÇIKTI' : 'KASA AÇILDI';
    $('#g-icerik', kutu).innerHTML = `
      <p class="nadirlik-yazi">${g.baslik}</p>
      <h2 class="modal-baslik">${ad}</h2>
      <p class="modal-aciklama">${kopya ? 'Bu eşya zaten sendeydi, altına çevrildi.' : setTamam ? `${set.ad} tamamlandı! +500 altın bonus.` : `${set.ad} koleksiyonuna eklendi.`}</p>`;
    $('#g-set', kutu).innerHTML = setBlogu(set, koleksiyon, kopya ? null : anahtar) +
      `<div class="cipler" style="margin-top:12px"><span class="cip" style="color:var(--amber)">${ikon('altin', 18)}+${sayi(altin)} altın</span>${kalan ? `<span class="cip" style="color:var(--camgobegi)">${kalan} hak artırdın</span>` : ''}</div>`;
    const p = merkez(sandik);
    Ses.odul(nadirlik);
    titret(nadirlik === 'efsanevi' ? [30, 50, 30, 50, 80] : [20, 40, 20]);
    parcacik(p.x, p.y, [g.renk, '#FFFFFF', 'var(--pembe)'], nadirlik === 'efsanevi' ? 50 : 28, nadirlik === 'efsanevi' ? 200 : 140);

    const eylem = $('#g-eylem', kutu);
    if (mod === 'gunluk') {
      eylem.innerHTML = '<button class="btn btn-ana" data-sonuc>Sonucu gör</button>';
      $('[data-sonuc]', eylem).addEventListener('click', gunlukSonuc);
    } else {
      eylem.innerHTML = '<button class="btn btn-ana" data-sonraki>Sonraki kasayı aç</button><button class="btn btn-ikincil" data-koleksiyon>Koleksiyonu gör</button>';
      $('[data-sonraki]', eylem).addEventListener('click', () => { Modal.kapat(); yeniKasa(); });
      $('[data-koleksiyon]', eylem).addEventListener('click', () => { yeniKasa(); koleksiyonGoster(); });
    }
  }

  function koleksiyonGoster() {
    const koleksiyon = Depo.oku('koleksiyon', []);
    const kutu = Modal.ac(`
      <div class="modal-ust" style="--sira:0">
        <p class="etiket">${koleksiyon.length}/${TOPLAM_ESYA} EŞYA</p>
        <h2 class="modal-baslik">Koleksiyonum</h2>
        <p class="modal-aciklama">Kasaları açtıkça setler dolar. Bir seti tamamlamak 500 altın verir.</p>
      </div>
      ${SETLER.map((set, i) => `<div style="--sira:${i + 1}">${setBlogu(set, koleksiyon, null)}<p class="koleksiyon-adlar" style="margin-top:6px">${set.esyalar.map(([ad], j) => (koleksiyon.includes(`${set.id}:${j}`) ? ad : '???')).join(' · ')}</p></div>`).join('')}
      <div class="modal-eylem" style="--sira:5"><button class="btn btn-ana" data-kapat>Kapat</button></div>`);
    $('[data-kapat]', kutu).addEventListener('click', () => { Modal.kapat(); Ekran.tazele(); });
  }

  // Günlük
  function gunlukKaydet() {
    if (mod !== 'gunluk') return;
    const kazandi = tahminler.at(-1)?.yesil === uzunluk;
    Depo.yaz('gunluk', { gun: gunAnahtari(), tahminler, bitti, kazandi });
  }

  function gunlukBitir(kazandi) {
    const bugun = gunAnahtari();
    const dun = gunAnahtari(gunEkle(new Date(), -1));
    if (Depo.oku('gunluk.son', null) === bugun) return;
    let seri = 0;
    if (kazandi) {
      seri = (Depo.oku('gunluk.son', null) === dun ? Depo.oku('gunluk.seri', 0) : 0) + 1;
      const gecmis = Depo.oku('gunluk.gecmis', []).concat(bugun).slice(-60);
      Depo.yaz('gunluk.gecmis', gecmis);
      Depo.yaz('gunluk.enIyi', Math.max(seri, Depo.oku('gunluk.enIyi', 0)));
    }
    Depo.yaz('gunluk.seri', seri);
    Depo.yaz('gunluk.son', bugun);
  }

  function gunlukDurum() {
    const bugun = gunAnahtari();
    const son = Depo.oku('gunluk.son', null);
    const kayit = Depo.oku('gunluk', null);
    const guncel = son === bugun || son === gunAnahtari(gunEkle(new Date(), -1));
    return {
      seri: guncel ? Depo.oku('gunluk.seri', 0) : 0,
      bugunBitti: kayit?.gun === bugun && kayit.bitti,
      kazandi: kayit?.gun === bugun && kayit.kazandi,
    };
  }

  function gunlukSonuc() {
    const durum = gunlukDurum();
    const enIyi = Depo.oku('gunluk.enIyi', 0);
    const gecmis = Depo.oku('gunluk.gecmis', []);
    const no = gunlukNo();
    const izgara = tahminler.map((t) => `<div class="paylas-satir">${Array.from({ length: uzunluk }, (_, i) => `<i class="${i < t.yesil ? 'y' : i < t.yesil + t.sari ? 's' : ''}"></i>`).join('')}</div>`).join('');
    const bugun = new Date();
    const gunSira = (bugun.getDay() + 6) % 7;
    const pazartesi = gunEkle(bugun, -gunSira);
    const hafta = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((ad, i) => {
      const tamam = gecmis.includes(gunAnahtari(gunEkle(pazartesi, i)));
      return `<div><span>${ad}</span><i class="${tamam ? 'tamam' : ''} ${i === gunSira ? 'bugun' : ''}">${tamam ? ikon('tik', 16, 3) : ''}</i></div>`;
    }).join('');
    const paylasMetni = `Günlük Kasa #${no} ${durum.kazandi ? tahminler.length : 'X'}/${hakToplam}\n` +
      tahminler.map((t) => Array.from({ length: uzunluk }, (_, i) => (i < t.yesil ? '🟩' : i < t.yesil + t.sari ? '🟨' : '⬛')).join('')).join('\n') +
      `\nSeri: ${durum.seri} gün`;

    const kutu = Modal.ac(`
      <div class="modal-ust" style="--sira:0">
        <p class="etiket">GÜNLÜK KASA #${no}</p>
        <h2 class="modal-baslik" style="color:${durum.kazandi ? 'var(--yesil)' : 'var(--pembe)'}">${durum.kazandi ? 'Çözüldü!' : 'Bugün olmadı'}</h2>
        <p class="modal-aciklama">${durum.kazandi ? `${tahminler.length} denemede açtın.` : `Şifre <b style="color:var(--metin);letter-spacing:.2em">${kod.join('')}</b> idi. Yarın yeni bir kasa var.`}</p>
      </div>
      <div class="paylas-izgara" style="--sira:1">${izgara}</div>
      <div class="seri-kart" style="--sira:2">
        <div class="seri-ust">
          <span class="seri-ikon">${ikon('alev', 26)}</span>
          <div style="flex:1;min-width:0"><p class="seri-sayi">${durum.seri} gün seri</p><p class="soluk" style="font-size:13px">En uzun serin: ${enIyi} gün</p></div>
        </div>
        <div class="hafta">${hafta}</div>
      </div>
      <p class="modal-aciklama" style="--sira:3;text-align:center">Yeni kasa <span class="geri-sayim" id="g-sayim">--:--:--</span> sonra</p>
      <div class="modal-eylem" style="--sira:4">
        <button class="btn btn-ana" data-kopyala>${ikon('paylas', 20, 2.4)} Sonucu kopyala</button>
        <button class="btn btn-ikincil" data-menu>Ana menü</button>
      </div>`);

    const sayac = $('#g-sayim', kutu);
    const guncelle = () => {
      if (!document.body.contains(sayac)) return clearInterval(zaman);
      const yarin = new Date(); yarin.setHours(24, 0, 0, 0);
      const fark = Math.max(0, yarin - new Date());
      sayac.textContent = [fark / 36e5, (fark / 6e4) % 60, (fark / 1e3) % 60].map((x) => String(Math.floor(x)).padStart(2, '0')).join(':');
    };
    const zaman = setInterval(guncelle, 1000);
    guncelle();

    const kopyala = $('[data-kopyala]', kutu);
    kopyala.addEventListener('click', () => {
      const yedek = () => {
        if ($('.kopya-metin', kutu)) return;
        kopyala.insertAdjacentHTML('beforebegin', `<textarea class="kopya-metin" id="kopya-metin" readonly aria-label="Paylaşılacak sonuç">${paylasMetni}</textarea>`);
        const alan = $('.kopya-metin', kutu);
        alan.focus();
        alan.select();
        kopyala.innerHTML = 'Metni seçtim, kopyalayıp paylaş';
      };
      try {
        navigator.clipboard.writeText(paylasMetni).then(() => { kopyala.innerHTML = `${ikon('tik', 20, 3)} Kopyalandı, istediğin yere yapıştır`; Ses.tus(); }, yedek);
      } catch { yedek(); }
    });
    $('[data-menu]', kutu).addEventListener('click', () => { Modal.kapat(); Ekran.git('ana'); });
  }

  // Başlatma
  function yeniKasa() {
    mod = 'normal';
    kasaNo = Depo.oku('kasa.no', 1);
    uzunluk = kasaNo <= 3 ? 3 : 4;
    hakToplam = uzunluk === 3 ? 6 : 8;
    kod = kodUret();
    tahminler = [];
    giris = [];
    ipuclari = new Map();
    bitti = false;
    $('#k-kadran').classList.remove('ac');
    ciz();
  }

  function gunlukBaslat() {
    mod = 'gunluk';
    uzunluk = 4;
    hakToplam = 8;
    kod = kodUret(tohumluRastgele('gunluk-' + gunAnahtari()));
    const kayit = Depo.oku('gunluk', null);
    const bugunku = kayit?.gun === gunAnahtari();
    tahminler = bugunku ? kayit.tahminler : [];
    bitti = bugunku ? kayit.bitti : false;
    giris = [];
    ipuclari = new Map();
    ciz();
    if (bitti) setTimeout(gunlukSonuc, 250);
  }

  function ogret() {
    const kutu = Modal.ac(`
      <div class="modal-ust" style="--sira:0">
        <p class="etiket">NASIL OYNANIR</p>
        <h2 class="modal-baslik">Kasa Kırıcı</h2>
      </div>
      <ol class="adimlar" style="--sira:1">
        <li><span>Şifre <b>birbirinden farklı rakamlardan</b> oluşur. Tuşlarla bir tahmin yaz, <b>Aç</b>'a bas.</span></li>
        <li><span><i class="civi civi-yesil" style="vertical-align:-1px"></i> <b>Yeşil nokta:</b> bir rakam doğru yerde. <i class="civi civi-sari" style="vertical-align:-1px"></i> <b>Sarı halka:</b> rakam şifrede var ama yeri yanlış. Hangi rakam olduğunu sen çözersin.</span></li>
        <li><span>Ne kadar <b>az denemede</b> açarsan efsanevi ganimet şansın o kadar artar. Ganimetler koleksiyonunu doldurur.</span></li>
      </ol>
      <div class="modal-eylem" style="--sira:2"><button class="btn btn-ana" data-basla>Başla</button></div>`);
    $('[data-basla]', kutu).addEventListener('click', () => { Ses.baslat(); Modal.kapat(); Depo.yaz('kasa.ogretildi', true); });
  }

  function ac(yeniMod) {
    if (!kuruldu) kur();
    if (yeniMod === 'gunluk') gunlukBaslat();
    else if (mod !== 'normal' || bitti) yeniKasa();
    else ciz();
    if (!Depo.oku('kasa.ogretildi', false)) ogret();
  }

  return {
    ac,
    koleksiyonGoster,
    gunlukDurum,
    koleksiyonSayisi: () => Depo.oku('koleksiyon', []).length,
    toplamEsya: TOPLAM_ESYA,
  };
})();
