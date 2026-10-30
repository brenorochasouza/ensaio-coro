/* Ensaio do Coro: guarda o app no aparelho para abrir sem internet.
   Com internet, sempre busca a versão nova do app e atualiza a cópia.
   Os arquivos de música e partitura não passam por aqui: o app já guarda
   no próprio aparelho cada música aberta. */
const CACHE = 'ensaio-coro-v1';
const LOCAIS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
const BIBLIOTECAS = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];
const HOSTS_CDN = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(LOCAIS);
    await Promise.allSettled(BIBLIOTECAS.map(u => fetch(u).then(r => { if (r.ok) return c.put(u, r); })));
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('ensaio-coro-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Bibliotecas e fontes: usa a cópia guardada; se não tiver, baixa e guarda.
  if (HOSTS_CDN.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return; // Supabase e o resto seguem direto

  // App: tenta a rede (versão nova); sem resposta em 4 s, abre a cópia do aparelho.
  const daRede = fetch(req).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return res;
  });
  const doCache = () => caches.match(req, { ignoreSearch: true })
    .then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
  e.respondWith(new Promise(resolve => {
    let feito = false;
    const entregar = r => { if (!feito && r) { feito = true; resolve(r); } };
    const t = setTimeout(() => doCache().then(entregar), 4000);
    daRede.then(res => { clearTimeout(t); entregar(res); })
      .catch(() => { clearTimeout(t); doCache().then(r => entregar(r || Response.error())); });
  }));
  e.waitUntil(daRede.catch(() => {}));
});
