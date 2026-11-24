// Sobrou: arquivos do app pra abrir sem internet. Versão: v40 (baf8e4f7)
// Regra: a página (index.html) vem SEMPRE da internet primeiro; o cache só é usado sem conexão.
// Assim uma versão nova chega na próxima vez que você abrir o app com internet.
const CACHE = "sobrou-v40-baf8e4f7";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("sobrou-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const RUNTIME = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)\//;
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (r.mode === "navigate" || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname))) {
    e.respondWith(fetch(r, {cache: "no-store"}).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); } return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(r).then(hit => { const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => hit); return hit || net; }));
    return;
  }
  if (RUNTIME.test(r.url)) {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })));
  }
});

// Lembrete diário: chega pelo GitHub (Actions) e aparece como notificação.
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Sobrou", { body: d.body || "Já lançou os gastos de hoje?", icon: "./icons/icon-192.png", badge: "./icons/icon-192.png", tag: d.tag || "sobrou-lembrete" }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { for (const c of cs) if ("focus" in c) return c.focus(); return self.clients.openWindow("./"); }));
});
