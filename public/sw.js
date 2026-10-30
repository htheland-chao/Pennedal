// Enkel offline-cache: henter fra nettet, når det kan, og bruger den gemte kopi, når nettet mangler.
const CACHE = 'pennedal-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((noegler) => Promise.all(noegler.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((svar) => {
        // Kun hele svar (200). Lyd kan komme i bidder (206), og dem kan cachen ikke gemme.
        if (svar.status === 200) {
          const kopi = svar.clone();
          caches.open(CACHE).then((c) => c.put(req, kopi));
        }
        return svar;
      })
      .catch(() => caches.match(req).then((gemt) => gemt || caches.match('./index.html'))),
  );
});
