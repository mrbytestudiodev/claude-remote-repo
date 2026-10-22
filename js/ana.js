// Ekranlar arası geçiş, ana menü özetleri ve açılış.

const Ekran = {
  git(ad) {
    const hedef = ad === 'gunluk' ? 'kasa' : ad;
    $$('.ekran').forEach((ekran) => { ekran.hidden = ekran.id !== 'ekran-' + hedef; });
    if (ad === 'ana') this.tazele();
    else if (ad === 'zincir') Zincir.ac();
    else Kasa.ac(ad === 'gunluk' ? 'gunluk' : 'normal');
  },
  tazele() {
    Cuzdan.goster();
    $('[data-zincir-rekor]').textContent = `Rekor ${sayi(Zincir.rekor())}`;
    const esya = `${Kasa.koleksiyonSayisi()}/${Kasa.toplamEsya}`;
    $('[data-koleksiyon-rozet]').textContent = `Koleksiyon ${esya}`;
    $('[data-koleksiyon-sayi]').textContent = esya;
    const d = Kasa.gunlukDurum();
    $('[data-gunluk-rozet]').textContent = d.bugunBitti
      ? (d.kazandi ? `Bugün çözüldü · ${d.seri} gün seri` : 'Yarın yeni kasa var')
      : d.seri ? `${d.seri} gün seri · bugünü kaçırma` : 'Bugünün kasası hazır';
  },
};

function sesDugmesiniCiz() {
  const btn = $('#ses-btn');
  btn.innerHTML = ikon(Ses.acik ? 'ses' : 'sessiz', 22);
  btn.setAttribute('aria-label', Ses.acik ? 'Sesi kapat' : 'Sesi aç');
}

function basla() {
  ikonlariDoldur();
  sesDugmesiniCiz();
  $$('[data-git]').forEach((btn) => btn.addEventListener('click', () => { Ses.baslat(); Ekran.git(btn.dataset.git); }));
  $$('[data-geri]').forEach((btn) => btn.addEventListener('click', () => Ekran.git('ana')));
  $('#koleksiyon-btn').addEventListener('click', () => { Ses.baslat(); Kasa.koleksiyonGoster(); });
  $('#ses-btn').addEventListener('click', () => {
    Ses.acik = !Ses.acik;
    Depo.yaz('ses', Ses.acik);
    Ses.baslat();
    sesDugmesiniCiz();
    Ses.tus();
  });
  Ekran.git('ana');
}

window.claude?.hot?.ready ? window.claude.hot.ready(basla) : basla();
