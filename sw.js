const C='rink-v2';const FILES=['./','./index.html','./manifest.json','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// Network first, so a new version shows up on the next open; fall back to the cache when offline.
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok&&new URL(e.request.url).origin===location.origin){const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));});
