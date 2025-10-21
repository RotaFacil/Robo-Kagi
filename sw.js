
const CACHE_NAME = 'robokagi-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
];

// Define __BACKEND_API_BASE_URL__ as a placeholder that will be replaced by Vite
// during the build process with the actual backend URL, using the 'define' option in vite.config.ts.
// This is necessary because service workers cannot directly access `process.env` or `import.meta.env`
// without explicit build-time injection.
declare const __BACKEND_API_BASE_URL__: string; // For TypeScript type checking, removed in JS build.
const BACKEND_API_BASE_URL_FOR_SW = __BACKEND_API_BASE_URL__;


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

    // Skip API calls to the backend URL to ensure fresh data
    if (event.request.url.startsWith(BACKEND_API_BASE_URL_FOR_SW)) {
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