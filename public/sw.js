const CACHE_NAME = 'habitbloom-v2'
const ASSETS = [
  '/',
  '/index.html',
  '/styles/tokens.css',
  '/styles/layout.css',
  '/styles/components.css',
  '/styles/animations.css',
  '/js/app.js',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  )
})
