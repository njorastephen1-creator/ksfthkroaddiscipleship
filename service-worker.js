const CACHE_NAME = 'ksf-discipleship-v6'; // Bumped to v6 to force update

const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './download.jpeg',   // Added your main logo here!
  './teachers.JPG'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching local app assets');
      return cache.addAll(LOCAL_ASSETS);
    }).catch(err => {
      console.log('Cache failed:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Ignore non-GET requests and external API calls (like Firebase)
  if (event.request.method !== 'GET' || 
      event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to index.html for navigation requests
          if (event.request.destination === 'document' || event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});