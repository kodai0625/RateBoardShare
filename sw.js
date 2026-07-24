/* RATE BOARD（配布版）のオフライン動作用。

   ★重要: 同じ GitHub アカウントのページはすべて同一オリジン
   （<user>.github.io）になる。個人版の Service Worker と共存するため、
   キャッシュ名は専用の接頭辞にし、activate では「自分の系統の古い版」だけを
   消す。他アプリ（個人版など）のキャッシュには一切触れない。

   更新のたびに CACHE の版番号を上げること。 */

var CACHE  = "rateboard-haifu-v2";
var PREFIX = "rateboard-haifu-";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        /* 自分の系統の古い版だけ削除。個人版のキャッシュには触れない。 */
        return (k.indexOf(PREFIX) === 0 && k !== CACHE) ? caches.delete(k) : null;
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;   /* レート取得など外部は素通し */
  if(e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match("./index.html");
      });
    })
  );
});
