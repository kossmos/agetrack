const sw = /** @type {ServiceWorkerGlobalScope} */ (
    /** @type {unknown} */ (self)
);
const CACHE_NAME = 'agetrack-static-5f5b6fe71a5bdeb8';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './src/timer.js',
    './src/storage.js',
    './src/install.js',
    './favicon.svg',
    './favicon-96x96.png',
    './favicon.ico',
    './apple-touch-icon.png',
    './site.webmanifest',
    './web-app-manifest-192x192.png',
    './web-app-manifest-512x512.png',
];
const assetURLs = ASSETS.map(
    (path) => new URL(path, sw.registration.scope).href,
);
sw.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(assetURLs)),
    );
});
sw.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter(
                            (key) =>
                                key.startsWith('agetrack-') &&
                                key !== CACHE_NAME,
                        )
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => sw.clients.claim()),
    );
});
sw.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== sw.location.origin)
        return;
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches
                .open(CACHE_NAME)
                .then(
                    async (cache) =>
                        (await cache.match(
                            new URL('./index.html', sw.registration.scope).href,
                        )) || Response.error(),
                ),
        );
    } else if (assetURLs.includes(url.href)) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                return (await cache.match(event.request)) || Response.error();
            }),
        );
    }
});
