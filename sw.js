/* Service worker: cho phép cài app + dùng offline */
const CACHE = "efm-v6";
const ASSETS = [
  // trang chủ
  "./", "manifest-home.webmanifest", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png",
  // phần của Mít
  "mit/", "mit/index.html",
  // phần của Moon — mỗi chủ đề thêm 1 dòng html + các ảnh của nó
  "moon/universe.html", "moon/manifest-universe.webmanifest",
  "moon/img/observatory.jpg", "moon/img/spacecraft.jpg", "moon/img/probe.jpg",
  "moon/img/asteroid.jpg", "moon/img/meteorite.jpg", "moon/img/galaxy.jpg",
  "moon/img/solarsystem.jpg", "moon/img/universe.jpg", "moon/img/surface.jpg",
  "moon/camping.html", "moon/manifest-camping.webmanifest",
  "moon/ancient.html", "moon/manifest-ancient.webmanifest",
  "moon/img/armor.jpg", "moon/img/weapon.jpg", "moon/img/jade.jpg",
  "moon/img/clay.jpg", "moon/img/tomb.jpg", "moon/img/treasure.jpg",
  "moon/travel.html", "moon/manifest-travel.webmanifest",
];

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
  // Lưu theo đúng trang được mở, để trang chủ, mit/ và các game trong moon/ không lẫn nhau
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(hit => hit || caches.match("./")))
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
