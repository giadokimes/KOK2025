// ΚΟΚ Τσέπης — Service Worker
// Ανεβάζοντας νέα έκδοση: άλλαξε το CACHE_VERSION ώστε οι συσκευές να πάρουν τα νέα αρχεία.
const CACHE_VERSION = 'kok-v13';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Cache-first, με σιωπηλή ανανέωση στο παρασκήνιο όταν υπάρχει σύνδεση
// (stale-while-revalidate): πάντα απαντάει αμέσως από την cache αν υπάρχει,
// έτσι η εφαρμογή ανοίγει αξιόπιστα ακόμη κι όταν δεν υπάρχει σήμα.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
