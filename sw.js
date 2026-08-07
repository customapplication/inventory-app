/* Service worker for the Inventory app.
 *
 * IMPORTANT: bump CACHE on every release you upload. A phone that already has
 * the old version will otherwise keep serving it, and your fix will be
 * reported as broken.
 */
const CACHE = 'inventory-v3.8.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => { /* a missing icon must not block install */ })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first with a cache fallback.
 *
 * Cache-first is the usual tutorial pattern and it makes updates arrive
 * unpredictably; this way the app still works offline but a new upload is
 * picked up on the next load.
 */
self.addEventListener('fetch', e => {
  const req = e.request;

  // Never cache POSTs or anything cross-origin — that would mean serving a
  // stale sync response out of the cache.
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
