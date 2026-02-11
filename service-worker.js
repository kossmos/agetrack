const STATIC_CACHE_NAME = 'agetrack-static-v3';
const RUNTIME_CACHE_NAME = 'agetrack-runtime-v1';
const MAX_RUNTIME_CACHE_ITEMS = 50;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/favicon.svg',
  '/favicon-96x96.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/site.webmanifest'
];

async function trimRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const keys = await cache.keys();
  if (keys.length <= MAX_RUNTIME_CACHE_ITEMS) {
    return;
  }
  const deleteCount = keys.length - MAX_RUNTIME_CACHE_ITEMS;
  await Promise.all(keys.slice(0, deleteCount).map(request => cache.delete(request)));
}

// Установка Service Worker и кеширование ресурсов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Активация и очистка устаревших кешей
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== STATIC_CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Перехват запросов и обслуживание из кеша
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') {
    return;
  }

  // Не кэшируем сторонние ресурсы.
  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isStaticAsset = ASSETS_TO_CACHE.includes(requestUrl.pathname);

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse && isStaticAsset) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          const cacheName = isStaticAsset ? STATIC_CACHE_NAME : RUNTIME_CACHE_NAME;

          caches.open(cacheName).then(cache => {
            cache.put(event.request, responseToCache).then(() => {
              if (!isStaticAsset) {
                trimRuntimeCache();
              }
            });
          });

          return networkResponse;
        })
        .catch(() => {
          return cachedResponse || caches.match('/index.html');
        });
    })
  );
});
