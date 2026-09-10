const CACHE_VERSION = 'kok-v25';

// Βασικά αρχεία της εφαρμογής — ΠΡΕΠΕΙ να επιτύχουν όλα, αλλιώς η εγκατάσταση
// του service worker αποτυγχάνει σκόπιμα (καλύτερα να ξέρουμε αμέσως).
const CORE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './styles.css',
  './icons.js',
  './data.js',
  './signs.js',
  './ota.js',
  './app.js',
  './ui.js',
  './vehicle-check.js',
  './icon-192-v2.png',
  './icon-512-v2.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-v2.ico',
  './logo-48-v2.png',
  './signs-data.json',
  './ota-data.json',
  './cpr-card.png',
  './aed-card.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // 1) Τα βασικά αρχεία ΠΡΕΠΕΙ να επιτύχουν όλα.
      return cache.addAll(CORE_URLS).then(() => {
        // 2) Τα SVG των πινακίδων φορτώνονται ΔΥΝΑΜΙΚΑ από το signs-data.json.
        //    Είναι τοπικά αρχεία, οπότε το cache.add() δουλεύει απευθείας.
        //    Αν κάποιο αποτύχει, ΔΕΝ μπλοκάρει την υπόλοιπη εγκατάσταση.
        return caches.match('./signs-data.json').then((res) => {
          if (!res) return;
          return res.json().then((map) => {
            const urls = Object.values(map).filter((u) => typeof u === 'string' && !/^https?:/i.test(u));
            return Promise.allSettled(
              urls.map((url) => cache.add(url).catch(() => {}))
            );
          }).catch(() => {});
        });
      });
    }).then(() => self.skipWaiting())
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