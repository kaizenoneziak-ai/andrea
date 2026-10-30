/* Andrea · service worker
 * Estrategia local-first. No hay servidor remoto ni analítica.
 * Al cambiar archivos de la app, subir VERSION para limpiar el caché anterior.
 */
const VERSION = 'andrea-v0.7.7';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './robots.txt',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './js/core.js',
  './js/views.js',
  './js/agenda.js',
  './js/views-more.js',
  './js/yasmin.js',
  './js/induccion.js',
  './js/actions.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Los datos privados nunca se cachean.
  if (url.pathname.endsWith('/seed.js')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(VERSION).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(VERSION).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* El botón «Actualizar ahora» de Ajustes pide activar la versión nueva. */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ANDREA_ACTUALIZAR') self.skipWaiting();
});

/* Un toque en la notificación abre Andrea. */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
