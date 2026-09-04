const CACHE_VERSION = 'kok-v15';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './signs-data.json',
  './ota-data.json',
  // Εικόνες πινακίδων από Wikimedia
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-1.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-2.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-3.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-4.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-5.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-6.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-7.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-8.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-9.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-10.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-11.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-12.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-13.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-14.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-15.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-16.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-17.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-18.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-19.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-20.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-21.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-22.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-23.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-24.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-25.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-26.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-27.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-28.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-29.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-30.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-31.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-32.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-33.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-34.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-35.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-36.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-37.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-38.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-39.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-40.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-41.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-42.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-43.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-44.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-45.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-46.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-47.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-48.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-49.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-50.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-50a.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-50d.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-51.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-51a.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-51d.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-52.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-52a.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-52d.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-53.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-54.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-55.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-56.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-57.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-58.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-59.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-60.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-61.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-62.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-63.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-64.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-65.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-66.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-66a.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-67.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-67a.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-68.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-69.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-70.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-71.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-72.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-73a.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-73d.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-74a.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-74d.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-75.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-76.svg',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Traffic_Sign_GR_-_KOK_2009_-_R-77.svg'
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