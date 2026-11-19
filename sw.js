const C='rink-v3';const FILES=['./','./index.html','./manifest.json','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// Network first, so a new version shows up on the next open; fall back to the cache when offline.
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok&&new URL(e.request.url).origin===location.origin){const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));});
// Daily reminder notifications, sent by the scheduled job in the repository.
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{};}catch(x){d={body:e.data&&e.data.text()};}
  e.waitUntil(self.registration.showNotification(d.title||"Scarlett's Rink",{body:d.body||'Time for your drills!',icon:'./icon.svg',badge:'./icon.svg',tag:'rink-reminder',data:{url:'./'}}));});
self.addEventListener('notificationclick',e=>{e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus();}return self.clients.openWindow('./');}));});
