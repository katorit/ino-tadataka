var CACHE_NAME = 'ino-monument-v1';
var PRECACHE_URLS = [
  '/',
  '/index.html',
];

// インストール時にアプリシェルをキャッシュ
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// ネットワーク優先、失敗時にキャッシュから返す
self.addEventListener('fetch', function (event) {
  // APIリクエストやFirebaseはキャッシュしない
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebasestorage.googleapis.com') ||
      event.request.url.includes('googleapis.com/identitytoolkit') ||
      event.request.url.includes('maps.googleapis.com') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function (response) {
      // 成功したレスポンスをキャッシュに保存
      if (response.status === 200) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function () {
      // オフライン時はキャッシュから返す
      return caches.match(event.request);
    })
  );
});
