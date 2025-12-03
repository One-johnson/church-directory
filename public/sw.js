if (!self.define) {
  let e,
    s = {};
  const i = (i, t) => (
    (i = new URL(i + ".js", t).href),
    s[i] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = i), (e.onload = s), document.head.appendChild(e));
        } else ((e = i), importScripts(i), s());
      }).then(() => {
        let e = s[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e;
      })
  );
  self.define = (t, n) => {
    const c =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[c]) return;
    let a = {};
    const r = (e) => i(e, c),
      l = { module: { uri: c }, exports: a, require: r };
    s[c] = Promise.all(t.map((e) => l[e] || r(e))).then((e) => (n(...e), a));
  };
}
define(["./workbox-c05e7c83"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "ba5982b3d402bbd5b60c83b4c9c63c95",
        },
        {
          url: "/_next/static/chunks/107-d00699c7a57a2c45.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/137.3ed8b0a02b2d6380.js",
          revision: "3ed8b0a02b2d6380",
        },
        {
          url: "/_next/static/chunks/187-4e9193a58d8ae327.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/273acdc0-4ca141d71fc7e59c.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/376-97e3eb74d9601b1e.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/411-20dba45648ed9fbb.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/519-b210e268306986a3.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/528-e270083dbf3e39e0.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/541.6cd4b6a83c672c41.js",
          revision: "6cd4b6a83c672c41",
        },
        {
          url: "/_next/static/chunks/594-8a325a9e76031bbc.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/5baed960.7d62a9f869586425.js",
          revision: "7d62a9f869586425",
        },
        {
          url: "/_next/static/chunks/65d4da31-7c5b51a639041124.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/701.bcb67b4613a6f6f3.js",
          revision: "bcb67b4613a6f6f3",
        },
        {
          url: "/_next/static/chunks/73-7796313562cdd3f9.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/775.3b825ad83debdb39.js",
          revision: "3b825ad83debdb39",
        },
        {
          url: "/_next/static/chunks/785.60ab39ee2674a2a0.js",
          revision: "60ab39ee2674a2a0",
        },
        {
          url: "/_next/static/chunks/80-210afc65cbbbcf8e.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/834-767795792c285ad0.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/864-2726b213e0ab9887.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/915-668334212435b308.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/993-91217802e4d6459b.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-25953d0cd27f85f9.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/admin/approvals/page-c3ebf46592f55b2a.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/admin/users/page-f3c555148bc2efff.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/api/health/route-4b96c3894d69f0f8.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/api/logger/route-2955232409816a76.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/api/me/route-5a2d18bcba3e9924.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/api/proxy/route-cc69adc404594e03.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/dashboard/page-ea06567d486805c2.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/directory/page-2cd4540734285c91.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/layout-7cb9db7b87bc73ee.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/messages/page-3b10b493d1286846.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/offline/page-2684b8086c154cc8.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/page-3ed2cb6fa7cc468f.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/profile/create/page-01be4b9719f7f760.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/profile/edit/page-46572f1970a101c8.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/app/register/page-6a235dbdf5dd31c1.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/badf541d.48b004bd26e714d2.js",
          revision: "48b004bd26e714d2",
        },
        {
          url: "/_next/static/chunks/c132bf7d.d2fddcbeb05aed15.js",
          revision: "d2fddcbeb05aed15",
        },
        {
          url: "/_next/static/chunks/f9a5ee2b-50d5fc65ce32c491.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/framework-2d482de72417e21e.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/main-6194f340fa84ade8.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/main-app-1f60cff84777c070.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/pages/_app-ba18307dd5be3133.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/pages/_error-0e6a07668efb1afc.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-3ece912bee76c02c.js",
          revision: "lml2MzsYIJh2Tm3HW_0eJ",
        },
        {
          url: "/_next/static/css/93406825bcff790d.css",
          revision: "93406825bcff790d",
        },
        {
          url: "/_next/static/lml2MzsYIJh2Tm3HW_0eJ/_buildManifest.js",
          revision: "787319348d020c4765e670f5c69fdf51",
        },
        {
          url: "/_next/static/lml2MzsYIJh2Tm3HW_0eJ/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/media/4cf2300e9c8272f7-s.p.woff2",
          revision: "18bae71b1e1b2bb25321090a3b563103",
        },
        {
          url: "/_next/static/media/747892c23ea88013-s.woff2",
          revision: "a0761690ccf4441ace5cec893b82d4ab",
        },
        {
          url: "/_next/static/media/8d697b304b401681-s.woff2",
          revision: "cc728f6c0adb04da0dfcb0fc436a8ae5",
        },
        {
          url: "/_next/static/media/93f479601ee12b01-s.p.woff2",
          revision: "da83d5f06d825c5ae65b7cca706cb312",
        },
        {
          url: "/_next/static/media/9610d9e46709d722-s.woff2",
          revision: "7b7c0ef93df188a852344fc272fc096b",
        },
        {
          url: "/_next/static/media/ba015fad6dcf6784-s.woff2",
          revision: "8ea4f719af3312a055caf09f34c89a77",
        },
        {
          url: "/icons/icon-192x192.png",
          revision: "1bc3e9d3a15c87858db7c68a2cb3d28e",
        },
        {
          url: "/icons/icon-512x512.png",
          revision: "8e4d79e43b05b9eeb902839704afe9d2",
        },
        { url: "/manifest.json", revision: "cdb59bdb8d66a4e3ef0882d09803b3ee" },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: i,
              state: t,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/api\/.*$/i,
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /.*/i,
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ));
});
