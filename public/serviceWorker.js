const FILES_TO_CACHE = [
  '/',
  '/index.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
  '/styles.css'
];

const STATIC_CACHE_NAME = 'static-cache';
const DATA_CACHE_NAME = 'data-cache';

// Precaches static files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log("Static files were precached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  )

  self.skipWaiting();
});

// Cleans out unnecessary caches; claims remainder.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== STATIC_CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('Removing old cache data: ', key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});


// Intercepts fetches
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api')) {
    e.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(e.request)
        .then(response => {

          // Returns response, caches data if online.
          if (response.status === 200) {
            cache.put(e.request.url, response.clone())
          }
          return response;
        })

        // Returns cache if offline
        .catch(err => {
          return cache.match(e.request);
        });
      }).catch(err => console.log(err))
    )
    return;
  }

  // Returns static files via server or local cache if necessary
  e.respondWith(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      return cache.match(e.request).then(response => {
        return response || fetch (e.request);
      });
    })
  );
});
