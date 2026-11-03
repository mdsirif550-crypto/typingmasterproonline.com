const CACHE_NAME = "typingmaster-app-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/typing_Master_Pro.html",
  "/offline-practice.html",
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
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cachedPage = await caches.match(request, { ignoreSearch: true });
        if (cachedPage) return cachedPage;
        const pathFallback = await caches.match(url.pathname);
        if (pathFallback) return pathFallback;
        return (await caches.match("/offline-practice.html")) ||
          (await caches.match("/index.html"));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      return Response.error();
    }
  })());
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
