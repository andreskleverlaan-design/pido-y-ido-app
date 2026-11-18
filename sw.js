/* Pido y Ido service worker: app works offline after first visit */
var CACHE = 'pidoyido-v6';
var SHELL = ['./', 'index.html', 'app.css', 'app.js', 'qrcode.js', 'config.js', 'cloud.js', 'vendor/supabase.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE && k !== 'pidoyido-img'; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    // network first for app files, so updates arrive; fall back to cache offline
    e.respondWith(fetch(req).then(function (res) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res; }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('index.html'); }); }));
  } else if (/images\.(pexels|unsplash)\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host) || /\/storage\/v1\/object\/public\/fotos\//.test(url.pathname)) {
    // cache food photos and fonts after first load
    e.respondWith(caches.open('pidoyido-img').then(function (c) { return c.match(req).then(function (hit) { return hit || fetch(req).then(function (res) { c.put(req, res.clone()); return res; }); }); }));
  }
});
