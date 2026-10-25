/**
 * HabitFlow Service Worker
 * Handles App Shell caching, Web Push notifications, notification routing, and safe offline behavior.
 * 
 * CRITICAL PRIVACY & SECURITY RULE (PRD Section 9 & Owner B Scope):
 * - NEVER indiscriminately cache private authenticated user APIs (/api/entries, /api/questions, /api/auth).
 * - Private APIs use Network-First and NEVER persist sensitive habit records to unsafe public caches.
 */

const CACHE_NAME = 'habitflow-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
];

// 1. Install & precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('Pre-cache warning for non-essential shell assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate & cleanup stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch interceptor: Static shell Stale-While-Revalidate; Dynamic APIs Network-First
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL PRIVACY GUARD: Never cache private API endpoints or auth mutations
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            error: 'You are currently offline. HabitFlow queued local updates for sync.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Static shell assets & Next.js static chunks
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkRes) => {
          if (networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // Page navigations: Network first with cached shell fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/track').then((res) => res || caches.match('/'));
      })
    );
  }
});

// 4. Push event listener: displays native Web Push notification
self.addEventListener('push', (event) => {
  let data = {
    title: 'HabitFlow Check-in',
    body: 'Time to record your habits for this hour.',
    url: '/track',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.data?.url || data.url || '/track',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open_track', title: 'Open Track Sheet' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: 'habitflow-reminder',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification click: routes directly to Track Sheet (/track)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/track';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing HabitFlow window if open
      for (const client of clientList) {
        if (client.url.includes('/track') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
