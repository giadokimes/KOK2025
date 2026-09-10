const CACHE_VERSION = 'kok-v29';

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
  './first-aid.js',
  './cpr-card.png',
  './aed-card.png',
  './fonts/inter.css',
  './fonts/inter-greek-wght-normal.woff2',
  './fonts/inter-greek-ext-wght-normal.woff2',
  './fonts/inter-latin-wght-normal.woff2',
  './fonts/inter-latin-ext-wght-normal.woff2',
  './icon-192-v2.png',
  './icon-512-v2.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-v2.ico',
  './logo-48-v2.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_URLS))
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

// Network-first για αρχεία που αλλάζουν (JSON/JS/HTML/CSS).
// Cache-first για στατικά (εικόνες, fonts, SVG).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const path = url.pathname.toLowerCase();

  const isDynamic =
    path.endsWith('.json') ||
    path.endsWith('.js') ||
    path.endsWith('.html') ||
    path.endsWith('.css') ||
    path.endsWith('/');

  if (isDynamic) {
    // Network-first: φέρνει πάντα φρέσκο, αλλά fallback σε cache offline
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first για στατικά assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});