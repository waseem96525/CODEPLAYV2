const C="codeplay-v1";const F=["./","./index.html","./css/style.css","./js/app.js","./js/store.js","./js/runner.js","./js/challenges-html.js","./js/challenges-css.js","./js/challenges-js.js","./js/cheatsheets.js","./js/badges.js","./js/projects.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match("./index.html"))))});
