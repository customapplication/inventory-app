/* Service worker for the Inventory app.
 *
 * IMPORTANT: bump CACHE on every release you upload. A phone that already has
 * the old version will otherwise keep serving it, and your fix will be
 * reported as broken.
 */
const CACHE = 'inventory-v3.16.2';

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
  // One file at a time. cache.addAll() is all-or-nothing, so a single missing
  // icon used to leave NOTHING cached - and the app would not open offline
  // until it had happened to be loaded again while online.
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
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
        // Only good answers are kept. A 404 or 500 during an upload used to
        // be cached too, and then served as "the app" whenever offline.
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => {
        if (hit) return hit;
        // Only a page load falls back to the app itself; an image or icon that
        // is not cached gets a plain failure, not a copy of index.html.
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});
