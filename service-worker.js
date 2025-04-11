const CACHE_NAME = 'agetrack-cache-v1';
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

// Установка Service Worker и кеширование ресурсов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
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
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Перехват запросов и обслуживание из кеша
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если ресурс есть в кеше, возвращаем его
        if (response) {
          return response;
        }
        
        // Иначе делаем запрос к сети
        return fetch(event.request)
          .then(response => {
            // Если статус не OK, возвращаем как есть
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Кешируем новый успешный ответ
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
}); 