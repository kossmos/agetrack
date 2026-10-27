const CACHE_NAME = 'agetrack-static-v5';
const ASSETS = ['./', './index.html', './styles.css', './script.js', './favicon.svg',
    './favicon-96x96.png', './favicon.ico', './apple-touch-icon.png', './site.webmanifest',
    './web-app-manifest-192x192.png', './web-app-manifest-512x512.png'];
const assetURLs = ASSETS.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assetURLs)));
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys
        .filter(key => key.startsWith('agetrack-') && key !== CACHE_NAME)
        .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
    if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request).catch(() => caches.match(new URL('./index.html', self.registration.scope).href)));
    } else if (assetURLs.includes(url.href)) {
        event.respondWith(caches.open(CACHE_NAME).then(async cache => {
            return await cache.match(event.request) || fetch(event.request);
        }));
    }
});
