// Service Worker for Sustainability ROI Calculator PWA
// Enables offline functionality and fast loading

const CACHE_NAME = "sustainability-roi-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap"
];

// Install: cache all static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets, network-first for others
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Cache-first strategy for static assets and fonts
  if (
    url.origin === self.location.origin ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Cache valid responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Fallback to index for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
    );
  }
});

// Background sync (for future analytics or data saving)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-calculations") {
    console.log("[SW] Background sync triggered");
  }
});

// Push notification support (optional future feature)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Sustainability ROI";
  const options = {
    body: data.body || "Your calculation is ready.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
