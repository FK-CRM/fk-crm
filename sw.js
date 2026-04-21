const CACHE_NAME = 'fk-crm-v6';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => 
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Supabase API Requests NIEMALS cachen — immer direkt durchlassen
  if (url.hostname.includes('supabase.co') || e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }
  
  // Nur GET-Requests cachen
  e.respondWith(
    caches.match(e.request).then(cached => 
      cached || fetch(e.request).then(resp => {
        if (resp.ok) {
          const cl = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, cl));
        }
        return resp;
      }).catch(() => cached)
    )
  );
});
