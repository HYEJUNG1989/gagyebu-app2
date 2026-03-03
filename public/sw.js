const CACHE = "gagyebu-v1";
const ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(clients.claim());
});
self.addEventListener("fetch", e => {
  if (e.request.url.includes("firebaseio.com") || e.request.url.includes("googleapis")) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
