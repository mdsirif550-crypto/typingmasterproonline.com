const CACHE_NAME = "typingmaster-app-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/app-icon-192.png",
  "/app-icon-512.png",
  "/logo.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith("typingmaster-app-") && cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseCopy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put("/index.html", responseCopy)));
          }
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => cachedResponse || fetch(request))
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(windowClients => {
        const appClient = windowClients.find(client =>
          new URL(client.url).pathname.endsWith("/typing_Master_Pro.html")
        );
        if (appClient) {
          return appClient.focus().then(() => {
            appClient.postMessage({ type: "OPEN_MESSAGES" });
          });
        }
        return self.clients.openWindow("/typing_Master_Pro.html?openMessages=1");
      })
  );
});
