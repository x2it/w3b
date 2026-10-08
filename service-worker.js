/* ============================================================
 * w3b.pub · Service Worker
 * 策略：导航请求 Network-first（保证内容新鲜）；
 *       同源静态资源 Cache-first（秒开 + 离线可用）；
 *       跨域请求一律不透传缓存（交给 CDN / 浏览器）。
 * 升级：修改 VERSION 并重新发布，activate 自动清旧缓存。
 * ============================================================ */
'use strict';

const VERSION = '2026.10.09';
const CACHE = `w3b-${VERSION}`;

// 首装预缓存核心资源（版本号参数与页面引用的 v=3.3.9 保持一致）
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/404.html',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/assets/css/style.css',
  '/assets/js/i18n-init.js?v=3.3.9',
  '/assets/js/theme.js?v=3.3.9',
  '/assets/js/balance.js?v=3.3.9',
  '/assets/js/particles.js?v=3.3.9',
  '/assets/js/extras-index.js?v=3.3.9'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只处理 GET 与同源请求
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  // 导航请求：先网络，失败回退缓存（离线打开首页）
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/index.html')))
    );
    return;
  }

  // 静态资源：先缓存，未命中再网络并回填
  event.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
    )
  );
});
