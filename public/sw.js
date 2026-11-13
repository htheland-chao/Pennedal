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
          caches.open(CACHE).then(async (c) => {
            await c.put(req, kopi);
            // Spillets filer har et hash i navnet (index-AbC123.js). Hver udgivelse giver nye navne, så gamle kopier
            // slettes, når en ny version af samme fil er gemt. Ellers vokser cachen ved hver udgivelse (13. november 2026).
            const sti = new URL(req.url).pathname;
            const m = sti.match(/^(.*\/assets\/[^/]+)-[A-Za-z0-9_-]{6,}(\.[a-z0-9]+)$/);
            if (!m) return;
            for (const gammel of await c.keys()) {
              const g = new URL(gammel.url).pathname;
              if (g !== sti && g.startsWith(`${m[1]}-`) && g.endsWith(m[2])) await c.delete(gammel);
            }
          });
        }
        return svar;
      })
      .catch(() => caches.match(req).then((gemt) => gemt || caches.match('./index.html'))),
  );
});
