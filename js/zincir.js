// Zincir: sütuna taş bırak, aynı sayılar birleşip katlanır, birleşmeler zincirleme sürer.
// Puan hedefi her aşıldığında oyuncu kuralları büken bir joker seçer.

const Zincir = (() => {
  const SATIR = 7;
  const SUTUN = 5;
  const ARA = 8;

  const JOKERLER = {
    usta: { ad: 'Zincir Ustası', nadirlik: 'nadir', ikon: 'zincir', aciklama: 'Zincirin her halkası puan çarpanını 1 yerine 2 artırır.' },
    balik: { ad: 'Büyük Balık', nadirlik: 'siradan', ikon: 'balik', aciklama: '64 ve üstü taş oluşturan birleşmeler ×2 puan verir.' },
    kucuk: { ad: 'Küçük Taş', nadirlik: 'siradan', ikon: 'kucuk', aciklama: 'Sıradaki taşlar hiçbir zaman en büyük değerden gelmez.' },
    cekic: { ad: 'Çekiç', nadirlik: 'nadir', ikon: 'cekic', aktif: 1, aciklama: 'Her seviyede 1 kez: dokunduğun taşı kırar.' },
    takas: { ad: 'Takas', nadirlik: 'siradan', ikon: 'takas', aktif: 2, aciklama: 'Her seviyede 2 kez: sıradaki taşı başka bir sayıyla değiştirir.' },
    domino: { ad: 'Domino', nadirlik: 'efsanevi', ikon: 'patlama', aciklama: '3 halka ve üstü zincirden sonra en küçük taş patlar, zincir devam eder.' },
    kivilcim: { ad: 'Kıvılcım', nadirlik: 'efsanevi', ikon: 'yildirim', aciklama: 'Kazandığın bütün puanlar kalıcı olarak ×1,5.' },
  };
  const SINERJI = { usta: ['domino', 'kucuk'], domino: ['usta'], balik: ['kivilcim'], kivilcim: ['balik'], kucuk: ['usta'], cekic: ['takas'], takas: ['cekic'] };
  const NADIRLIK = {
    siradan: { yazi: 'SIRADAN', renk: 'var(--camgobegi)', cerceve: 'var(--cizgi-2)', agirlik: 6 },
    nadir: { yazi: 'NADİR', renk: 'var(--mor)', cerceve: 'var(--mor)', agirlik: 3 },
    efsanevi: { yazi: 'EFSANEVİ', renk: 'var(--amber)', cerceve: 'var(--amber)', agirlik: 1.5 },
  };
  const TAS_RENGI = { 2: '#7C84C4', 4: '#3DD6F5', 8: '#5B8CFF', 16: '#A47BFF', 32: '#FF6FB1', 64: '#FF8A3D', 128: '#FFD23F', 256: '#4ADE80', 512: '#F2F3FA', 1024: '#FF7A7A' };

  let izgara, taslar, skor, seviye, jokerler, siradaki, mesgul, bitti, cekicModu, enUzunZincir, isikSutun;
  let h = 56;
  let tahta, katman, isik, oyunVar = false;
  let rekor = Depo.oku('zincir.rekor', 0);

  const hedef = (n) => (n <= 0 ? 0 : Math.round((200 * Math.pow(n, 1.9)) / 50) * 50);
  const jokerVar = (id) => jokerler.some((j) => j.id === id);
  const renk = (v) => TAS_RENGI[v] || '#FFB547';

  function kur() {
    tahta = $('#z-tahta');
    katman = $('#z-taslar');
    isik = $('#z-isik');
    $('#z-zemin').innerHTML = '<div></div>'.repeat(SATIR * SUTUN);
    tahta.tabIndex = 0;
    tahta.setAttribute('aria-label', 'Oyun tahtası. 1-5 tuşlarıyla sütun seçip taş bırakabilirsin.');
    tahta.addEventListener('pointerdown', tahtayaDokun);
    tahta.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') isikGoster(hucreBul(e).c); });
    tahta.addEventListener('pointerleave', () => { isik.style.opacity = 0; });
    tahta.addEventListener('keydown', tusaBas);
    addEventListener('resize', () => { if (!$('#ekran-zincir').hidden) olcule(); });
  }

  function olcule() {
    const alan = $('#z-alan');
    const pad = 10;
    const genislik = (alan.clientWidth - 2 * pad - 2 - (SUTUN - 1) * ARA) / SUTUN;
    const yukseklik = (alan.clientHeight - 2 * pad - 2 - (SATIR - 1) * ARA) / SATIR;
    h = Math.max(30, Math.floor(Math.min(genislik, yukseklik, 66)));
    tahta.style.setProperty('--h', h + 'px');
    taslar?.forEach((t) => konumla(t, 0));
  }

  const donustur = (r, c) => `translate(${c * (h + ARA)}px, ${r * (h + ARA)}px)`;

  function konumla(t, sure) {
    if (sure != null) t.el.style.transitionDuration = sure + 'ms';
    t.el.style.transform = donustur(t.r, t.c);
    t.el.style.setProperty('--konum', donustur(t.r, t.c));
  }

  function tasGuncelle(t, pop) {
    t.el.dataset.v = Math.min(t.v, 2048);
    t.el.dataset.b = String(t.v).length;
    t.el.firstChild.textContent = t.v;
    if (pop) yenidenOynat(t.el, 'pop');
  }

  function tasOlustur(v, r, c) {
    const el = document.createElement('div');
    el.className = 'tas';
    el.append(document.createElement('span'));
    const t = { v, r, c, el, canli: true };
    tasGuncelle(t);
    konumla(t, 0);
    katman.append(el);
    taslar.push(t);
    return t;
  }

  function tasSil(t, efektli) {
    t.canli = false;
    taslar = taslar.filter((x) => x !== t);
    if (izgara[t.r]?.[t.c] === t) izgara[t.r][t.c] = null;
    if (efektli) {
      const p = merkez(t.el);
      parcacik(p.x, p.y, [renk(t.v), '#FFFFFF'], 16);
      t.el.classList.add('cikis');
      setTimeout(() => t.el.remove(), 220);
    } else t.el.remove();
  }

  function yeniDeger() {
    const enBuyuk = taslar.reduce((m, t) => Math.max(m, t.v), 2);
    const secenekler = [2, 4, 8, 16, 32, 64].filter((x) => x <= Math.max(8, enBuyuk / 8));
    if (jokerVar('kucuk') && secenekler.length > 2) secenekler.pop();
    const agirlik = [6, 5, 4, 3, 2, 1];
    return agirlikliSec(secenekler.map((deger, i) => ({ deger, agirlik: agirlik[i] })));
  }

  function yeniOyun() {
    katman.innerHTML = '';
    izgara = Array.from({ length: SATIR }, () => Array(SUTUN).fill(null));
    taslar = [];
    skor = 0;
    seviye = 1;
    jokerler = [];
    mesgul = false;
    bitti = false;
    cekicModu = false;
    enUzunZincir = 0;
    isikSutun = 2;
    siradaki = [yeniDeger(), yeniDeger()];
    oyunVar = true;
    $('#z-rekor').textContent = sayi(rekor);
    skorGuncelle(false);
    siradakiCiz();
    jokerleriCiz();
  }

  // Girdi
  function hucreBul(e) {
    const k = katman.getBoundingClientRect();
    const c = Math.min(SUTUN - 1, Math.max(0, Math.floor((e.clientX - k.left + ARA / 2) / (h + ARA))));
    const r = Math.floor((e.clientY - k.top + ARA / 2) / (h + ARA));
    return { r, c };
  }

  function isikGoster(c) {
    isikSutun = c;
    isik.style.transform = `translateX(${c * (h + ARA)}px)`;
    isik.style.opacity = 1;
  }

  function tahtayaDokun(e) {
    Ses.baslat();
    const { r, c } = hucreBul(e);
    if (cekicModu) return cekicVur(r, c);
    isikGoster(c);
    birak(c);
  }

  function tusaBas(e) {
    if (/^[1-5]$/.test(e.key)) { isikGoster(Number(e.key) - 1); birak(Number(e.key) - 1); }
    else if (e.key === 'ArrowLeft') isikGoster(Math.max(0, isikSutun - 1));
    else if (e.key === 'ArrowRight') isikGoster(Math.min(SUTUN - 1, isikSutun + 1));
    else if (e.key === 'Enter' || e.key === ' ') birak(isikSutun);
    else return;
    e.preventDefault();
  }

  const bosSatir = (c) => { for (let r = SATIR - 1; r >= 0; r--) if (!izgara[r][c]) return r; return -1; };

  async function birak(c) {
    if (mesgul || bitti) return;
    const r = bosSatir(c);
    if (r < 0) { Ses.hata(); titret(40); yenidenOynat(tahta, 'sars'); return; }
    mesgul = true;
    const v = siradaki.shift();
    siradaki.push(yeniDeger());
    siradakiCiz(true);
    const t = tasOlustur(v, -1, c);
    void t.el.offsetWidth;
    t.r = r;
    izgara[r][c] = t;
    const sure = 90 + (r + 1) * 22;
    konumla(t, sure);
    await bekle(sure);
    Ses.dus();
    titret(8);
    await coz([t]);
    await sonrasi();
  }

  async function sonrasi() {
    while (skor >= hedef(seviye) && !bitti) await seviyeAtla();
    mesgul = false;
    if (SUTUN && [...Array(SUTUN).keys()].every((c) => izgara[0][c])) oyunBitti();
  }

  function birlesmeBul(oncelik) {
    const adaylar = [...new Set([...oncelik, ...taslar])];
    for (const t of adaylar) {
      if (!t.canli || t.r < 0) continue;
      const komsular = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dr, dc]) => izgara[t.r + dr]?.[t.c + dc])
        .filter((k) => k && k.v === t.v);
      if (komsular.length) return { tas: t, komsular };
    }
    return null;
  }

  function yercekimi() {
    const dusenler = [];
    for (let c = 0; c < SUTUN; c++) {
      let yaz = SATIR - 1;
      for (let r = SATIR - 1; r >= 0; r--) {
        const t = izgara[r][c];
        if (!t) continue;
        if (r !== yaz) {
          izgara[yaz][c] = t;
          izgara[r][c] = null;
          t.r = yaz;
          konumla(t, 150);
          dusenler.push(t);
        }
        yaz--;
      }
    }
    return dusenler;
  }

  function puanHesapla(v, adim) {
    const carpan = jokerVar('usta') ? 1 + (adim - 1) * 2 : adim;
    let puan = v * carpan;
    if (jokerVar('balik') && v >= 64) puan *= 2;
    if (jokerVar('kivilcim')) puan *= 1.5;
    return Math.round(puan);
  }

  async function coz(oncelik) {
    let adim = 0;
    let toplam = 0;
    let dominoKullanildi = false;
    for (;;) {
      const bulunan = birlesmeBul(oncelik);
      if (!bulunan) {
        if (jokerVar('domino') && adim >= 3 && !dominoKullanildi && taslar.length > 1) {
          dominoKullanildi = true;
          const enKucuk = taslar.reduce((a, b) => (b.v < a.v ? b : a));
          const p = merkez(enKucuk.el);
          ucanYazi(p.x, p.y - 24, 'DOMİNO!', 'var(--amber)', 18);
          tasSil(enKucuk, true);
          Ses.birles(adim + 2);
          await bekle(220);
          oncelik = yercekimi();
          await bekle(oncelik.length ? 190 : 0);
          continue;
        }
        break;
      }
      const { tas, komsular } = bulunan;
      adim++;
      komsular.forEach((k) => {
        izgara[k.r][k.c] = null;
        k.canli = false;
        k.r = tas.r;
        k.c = tas.c;
        konumla(k, 120);
      });
      await bekle(120);
      komsular.forEach((k) => tasSil(k));
      tas.v *= 2 ** komsular.length;
      tasGuncelle(tas, true);

      const kazanc = puanHesapla(tas.v, adim);
      skor += kazanc;
      toplam += kazanc;
      enUzunZincir = Math.max(enUzunZincir, adim);
      skorGuncelle(true);
      const p = merkez(tas.el);
      parcacik(p.x, p.y, [renk(tas.v), '#FFFFFF', 'var(--amber)'], 8 + adim * 4, 70 + adim * 12);
      ucanYazi(p.x, p.y - 20, '+' + sayi(kazanc));
      Ses.birles(adim);
      titret(adim >= 3 ? [12, 30, 18] : 12);
      if (adim >= 2) komboGoster(adim, toplam);
      if (adim >= 4) yenidenOynat(tahta, 'sars');

      await bekle(160);
      const dusenler = yercekimi();
      if (dusenler.length) await bekle(180);
      oncelik = [tas, ...dusenler];
    }
  }

  function komboGoster(adim, toplam) {
    const kutu = $('#z-kombo');
    const baslik = adim >= 6 ? 'İNANILMAZ' : adim >= 4 ? 'MUHTEŞEM' : 'ZİNCİR';
    kutu.innerHTML = `<b>${baslik} ×${adim}</b><span>+${sayi(toplam)}</span>`;
    yenidenOynat(kutu, 'goster');
  }

  // Görünüm
  function skorGuncelle(zipla) {
    const el = $('#z-skor');
    el.textContent = sayi(skor);
    if (zipla) yenidenOynat(el, 'zipla');
    const onceki = hedef(seviye - 1);
    const sonraki = hedef(seviye);
    const oran = Math.max(0, Math.min(1, (skor - onceki) / (sonraki - onceki)));
    $('#z-ilerleme').style.width = oran * 100 + '%';
    $('#z-seviye').textContent = `Seviye ${seviye}`;
    const odul = jokerler.length < 4 ? 'Sonraki joker' : 'Sonraki bonus';
    $('#z-hedef-yazi').innerHTML = `${odul}: <b>${sayi(Math.max(0, sonraki - skor))}</b> puan`;
  }

  function siradakiCiz(yeni) {
    $('#z-siradaki').innerHTML = siradaki
      .map((v, i) => `<div class="on-tas ${i ? 'kucuk' : ''} ${yeni && i === 1 ? 'yeni' : ''}" data-v="${v}">${v}</div>`)
      .join('');
  }

  function jokerleriCiz() {
    const yer = $('#z-jokerler');
    yer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const j = jokerler[i];
      if (!j) {
        const bos = document.createElement('div');
        bos.className = 'joker-slot bos';
        yer.append(bos);
        continue;
      }
      const tanim = JOKERLER[j.id];
      const btn = document.createElement('button');
      btn.className = 'joker-slot' + (tanim.aktif ? ' aktif' : '') + (j.id === 'cekic' && cekicModu ? ' secili' : '');
      btn.style.setProperty('--renk', NADIRLIK[tanim.nadirlik].renk);
      btn.setAttribute('aria-label', `${tanim.ad}: ${tanim.aciklama}`);
      btn.innerHTML = ikon(tanim.ikon, 24) + (tanim.aktif ? `<span class="hak-rozet">${j.hak}</span>` : '');
      if (tanim.aktif && !j.hak) btn.disabled = true;
      btn.addEventListener('click', () => jokerKullan(j));
      yer.append(btn);
    }
  }

  function jokerKullan(j) {
    Ses.baslat();
    if (mesgul || bitti) return;
    if (j.id === 'cekic' && j.hak) {
      cekicModu = !cekicModu;
      tahta.classList.toggle('cekic-modu', cekicModu);
      Ses.tus();
    } else if (j.id === 'takas' && j.hak) {
      const eski = siradaki[0];
      let yeni = yeniDeger();
      for (let i = 0; i < 6 && yeni === eski; i++) yeni = yeniDeger();
      siradaki[0] = yeni;
      j.hak--;
      siradakiCiz();
      yenidenOynat($('#z-siradaki .on-tas'), 'yeni');
      Ses.tus();
    } else if (!JOKERLER[j.id].aktif) {
      jokerListesi();
      return;
    }
    jokerleriCiz();
  }

  async function cekicVur(r, c) {
    const t = izgara[r]?.[c];
    if (!t || mesgul) return;
    const j = jokerler.find((x) => x.id === 'cekic');
    j.hak--;
    cekicModu = false;
    tahta.classList.remove('cekic-modu');
    mesgul = true;
    tasSil(t, true);
    Ses.hata();
    titret([20, 20, 40]);
    jokerleriCiz();
    await bekle(200);
    const dusenler = yercekimi();
    await bekle(dusenler.length ? 190 : 0);
    await coz(dusenler);
    await sonrasi();
  }

  function jokerListesi() {
    const satirlar = jokerler.map((j, i) => jokerKartHTML(j.id, i, false)).join('');
    const kutu = Modal.ac(`
      <div class="modal-ust" style="--sira:0"><h2 class="modal-baslik">Jokerlerin</h2></div>
      <div class="joker-kartlar">${satirlar}</div>
      <div class="modal-eylem" style="--sira:5"><button class="btn btn-ana" data-kapat>Oyuna dön</button></div>`);
    $('[data-kapat]', kutu).addEventListener('click', () => Modal.kapat());
  }

  function jokerKartHTML(id, i, secilebilir = true) {
    const j = JOKERLER[id];
    const n = NADIRLIK[j.nadirlik];
    const sinerji = secilebilir && (SINERJI[id] || []).some(jokerVar) ? '<span class="sinerji">SİNERJİ</span>' : '';
    const etiket = secilebilir ? 'button' : 'div';
    return `<${etiket} class="joker-kart ${j.nadirlik}" ${secilebilir ? `data-joker="${id}"` : ''} style="--sira:${i + 1}; --cerceve:${n.cerceve}">
      <span class="joker-ikon" style="--renk:${n.renk}">${ikon(j.ikon, 26)}</span>
      <span class="joker-metin">
        <span class="joker-ad">${j.ad}<span class="nadirlik ${j.nadirlik}">${n.yazi}</span></span>
        <span class="joker-aciklama">${j.aciklama}</span>
      </span>${sinerji}
    </${etiket}>`;
  }

  function jokerAdaylari() {
    const havuz = Object.keys(JOKERLER).filter((id) => !jokerVar(id));
    const secilen = [];
    while (secilen.length < 3 && havuz.length) {
      const id = agirlikliSec(havuz.map((deger) => ({ deger, agirlik: NADIRLIK[JOKERLER[deger].nadirlik].agirlik })));
      secilen.push(id);
      havuz.splice(havuz.indexOf(id), 1);
    }
    return secilen;
  }

  function jokerSec() {
    return new Promise((bitir) => {
      let yenileHakki = 1;
      const ciz = () => {
        const kutu = Modal.ac(`
          <div class="modal-ust" style="--sira:0">
            <p class="etiket">SEVİYE ${seviye - 1} TAMAMLANDI</p>
            <h2 class="modal-baslik">Bir joker seç</h2>
            <p class="modal-aciklama">Jokerler oyunun kurallarını senin lehine büker. En fazla 4 tane taşıyabilirsin.</p>
          </div>
          <div class="joker-kartlar">${jokerAdaylari().map((id, i) => jokerKartHTML(id, i)).join('')}</div>
          <div class="modal-eylem" style="--sira:5">
            <button class="btn btn-ikincil" data-yenile ${yenileHakki ? '' : 'disabled'}>${ikon('yenile', 20)} Kartları yenile (${yenileHakki} hak)</button>
          </div>`);
        $$('[data-joker]', kutu).forEach((btn) =>
          btn.addEventListener('click', () => {
            const id = btn.dataset.joker;
            const p = merkez(btn);
            jokerler.push({ id, hak: JOKERLER[id].aktif || 0 });
            Ses.odul(JOKERLER[id].nadirlik);
            titret([15, 40, 15]);
            parcacik(p.x, p.y, ['var(--amber)', 'var(--pembe)', 'var(--camgobegi)', '#FFFFFF'], 30, 160);
            Modal.kapat();
            jokerleriCiz();
            skorGuncelle(false);
            bitir();
          })
        );
        $('[data-yenile]', kutu).addEventListener('click', () => {
          if (!yenileHakki) return;
          yenileHakki--;
          Ses.tus();
          ciz();
        });
      };
      ciz();
    });
  }

  async function seviyeAtla() {
    seviye++;
    jokerler.forEach((j) => { if (JOKERLER[j.id].aktif) j.hak = JOKERLER[j.id].aktif; });
    const p = merkez(tahta);
    Ses.zafer();
    titret([20, 40, 20]);
    ucanYazi(p.x, p.y, `SEVİYE ${seviye}!`, 'var(--amber)', 40);
    parcacik(p.x, p.y, ['var(--amber)', 'var(--pembe)', 'var(--camgobegi)', '#FFFFFF'], 40, 180);
    skorGuncelle(false);
    jokerleriCiz();
    await bekle(700);
    if (jokerler.length < 4) await jokerSec();
    else {
      const bonus = 100 * seviye;
      skor += bonus;
      ucanYazi(p.x, p.y + 40, `Bonus +${sayi(bonus)}`, 'var(--pembe)', 22);
      skorGuncelle(true);
    }
  }

  function oyunBitti() {
    bitti = true;
    oyunVar = false;
    const eskiRekor = rekor;
    const yeniRekor = skor > rekor;
    if (yeniRekor) {
      rekor = skor;
      Depo.yaz('zincir.rekor', rekor);
      Ses.zafer();
    } else Ses.kaybet();
    let not;
    if (yeniRekor) not = `<div class="kutucuk" style="--sira:3"><b>Yeni rekor!</b> ${eskiRekor ? `Eski rekorun ${sayi(eskiRekor)} puandı.` : 'İlk rekorun kaydedildi.'}</div>`;
    else if (eskiRekor - skor <= eskiRekor * 0.25) not = `<div class="kutucuk vurgu" style="--sira:3">Rekora sadece <b>${sayi(eskiRekor - skor)}</b> puan kalmıştı!</div>`;
    else not = `<div class="kutucuk vurgu" style="--sira:3">Sonraki ödüle sadece <b>${sayi(hedef(seviye) - skor)}</b> puan kalmıştı!</div>`;
    const enBuyuk = taslar.reduce((m, t) => Math.max(m, t.v), 0);
    const kutu = Modal.ac(`
      <div class="modal-ust" style="--sira:0">
        <p class="etiket">IZGARA DOLDU</p>
        <h2 class="modal-baslik">Oyun bitti</h2>
      </div>
      <div class="modal-ust" style="--sira:1"><p class="buyuk-sayi">${sayi(skor)}</p></div>
      ${not}
      <div class="kutucuk" style="--sira:4">Seviye <b>${seviye}</b> · En büyük taş <b>${enBuyuk}</b> · En uzun zincir <b>×${enUzunZincir}</b></div>
      <div class="modal-eylem" style="--sira:5">
        <button class="btn btn-ana" data-tekrar>Tekrar oyna</button>
        <button class="btn btn-ikincil" data-menu>Ana menü</button>
      </div>`);
    $('[data-tekrar]', kutu).addEventListener('click', () => { Modal.kapat(); yeniOyun(); });
    $('[data-menu]', kutu).addEventListener('click', () => { Modal.kapat(); yeniOyun(); Ekran.git('ana'); });
  }

  function ogret() {
    const kutu = Modal.ac(`
      <div class="modal-ust" style="--sira:0">
        <p class="etiket">NASIL OYNANIR</p>
        <h2 class="modal-baslik">Zincir</h2>
      </div>
      <ol class="adimlar" style="--sira:1">
        <li><span>Bir <b>sütuna dokun</b>, sıradaki taş o sütuna düşsün.</span></li>
        <li><span>Aynı sayılar <b>yan yana ya da üst üste</b> gelince birleşip büyür: 4 ile 4, 8 olur.</span></li>
        <li><span>Yeni taş başka bir taşla birleşirse <b>zincir</b> devam eder. Her halka puanı katlar.</span></li>
        <li><span>Hedef puana ulaşınca kuralları büken bir <b>joker</b> seçersin. Bütün sütunlar dolunca oyun biter.</span></li>
      </ol>
      <div class="modal-eylem" style="--sira:2"><button class="btn btn-ana" data-basla>Başla</button></div>`);
    $('[data-basla]', kutu).addEventListener('click', () => { Ses.baslat(); Modal.kapat(); Depo.yaz('zincir.ogretildi', true); });
  }

  function ac() {
    if (!tahta) kur();
    requestAnimationFrame(() => {
      olcule();
      if (!oyunVar) yeniOyun();
      if (!Depo.oku('zincir.ogretildi', false)) ogret();
      tahta.focus({ preventScroll: true });
    });
  }

  return { ac, rekor: () => rekor };
})();
