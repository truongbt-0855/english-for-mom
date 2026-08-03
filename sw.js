/* Service worker: cho phép cài app + dùng offline */
const CACHE = "efm-v1";
const ASSETS = ["./", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;

  // Trang chính: lấy từ mạng để luôn có bản mới, rớt mạng thì dùng bản đã lưu
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("./", cp)); return r; })
        .catch(() => caches.match("./"))
    );
    return;
  }

  // Font, icon...: có sẵn trong cache thì dùng luôn, chưa có thì tải rồi lưu lại
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      const cp = r.clone();
      caches.open(CACHE).then(c => c.put(req, cp));
      return r;
    }))
  );
});
