"use strict";

const CACHE_NAME = "genova-360-lab-v0.1.9";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css?v=0.1.12",
  "./js/punti.js?v=0.1.12",
  "./js/vr-viewer.js?v=0.1.12",
  "./js/app.js?v=0.1.12",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./panorama/demo-genova.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // I video possono essere molto pesanti: non vengono mai messi nella cache PWA.
  if (request.destination === "video" || /\/video\//i.test(url.pathname) || /\.(mp4|webm|mov|m4v|ogv)$/i.test(url.pathname)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    }).catch(() => caches.match(request))
  );
});
