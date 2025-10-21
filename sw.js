const CACHE_NAME = 'robokagi-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
];

// On install, cache the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// On activation, clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});

// On fetch, use a network-first strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API calls and websockets
    if (event.request.url.includes('://localhost:8000')) {
        return;
    }

    // For all other GET requests, try network first, then cache
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If the fetch is successful, cache the response
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    // Don't cache chrome-extension requests that can cause errors
                    if (!event.request.url.startsWith('chrome-extension://')) {
                        cache.put(event.request, responseToCache);
                    }
                });
                return networkResponse;
            })
            .catch(() => {
                // If the network fails, try to serve from the cache
                return caches.match(event.request).then(response => {
                    return response || new Response("You are offline.", { status: 404, statusText: "Offline" });
                });
            })
    );
});
