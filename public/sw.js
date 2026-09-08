const CACHE = 'boya-stok-v3'

const APP_SHELL = [
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  if (!req.url.startsWith(self.location.origin)) return // Firestore vs. dış istekler dokunulmaz

  const url = new URL(req.url)

  // HTML / sayfa gezinmeleri: her zaman ağdan, offline'da cache'e düş
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match(req).then(r => r || caches.match('/')))
    )
    return
  }

  // Hash'li statik dosyalar: önce cache, yoksa ağdan al ve sakla
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname === '/logo.png') {
    e.respondWith(
      caches.match(req).then(cached =>
        cached ||
        fetch(req).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(req, clone))
          }
          return res
        })
      )
    )
    return
  }

  // Diğer her şey: ağ öncelikli
  e.respondWith(fetch(req).catch(() => caches.match(req)))
})
