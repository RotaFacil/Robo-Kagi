

const CACHE_NAME = 'robokagi-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/logo192.png',
    '/logo512.png',
    'https://cdn.tailwindcss.com',
    'https://aistudiocdn.com/react@^18.3.1',
    'https://aistudiocdn.com/react-dom@^18.3.1/index.js',
    'https://aistudiocdn.com/react-dom@^18.3.1/client.js',
    'https://aistudiocdn.com/react@^18.3.1/index.js',
    'https://aistudiocdn.com/lightweight-charts@^4.2.0',
    'https://aistudiocdn.com/@google/genai@^0.19.1',
    'https://aistudiocdn.com/vite@^7.1.11',
    'https://aistudiocdn.com/@vitejs/plugin-react@^5.0.4',
    'https://aistudiocdn.com/tailwindcss@^4.1.15'
];

// Define API path prefixes to identify backend requests and prevent them from being cached by the service worker.
const API_PREFIXES = [
    '/config', '/start_', '/stop_', '/ai_monitor_list', '/order', '/market_order',
    '/limit_order', '/symbols', '/ohlcv', '/kagi', '/market_overview', '/account',
    '/backtest', '/focus'
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

    const url = new URL(event.request.url);

    // Skip API calls to the backend to ensure fresh data
    if (API_PREFIXES.some(prefix => url.pathname.startsWith(prefix))) {
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