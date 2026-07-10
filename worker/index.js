/* Custom service worker extensions (merged by next-pwa) */

self.addEventListener("push", (event) => {
  let data = {
    title: "UD Professionals Directory",
    body: "You have a new notification",
    url: "/dashboard",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    tag: "ud-notification",
    renotify: false,
    notificationId: null,
    type: null,
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch {
    try {
      const text = event.data?.text();
      if (text) data.body = text;
    } catch {
      // keep defaults
    }
  }

  // Soften system toast when any app window is already focused
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const focused = clientsList.some((c) => c.focused);

      if (focused) {
        for (const client of clientsList) {
          client.postMessage({
            type: "PUSH_FOREGROUND",
            title: data.title,
            body: data.body,
            url: data.url,
            notificationId: data.notificationId,
          });
        }
        return;
      }

      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/icons/icon-192x192.png",
        badge: data.badge || "/icons/icon-96x96.png",
        tag: data.tag || "ud-notification",
        renotify: !!data.renotify,
        data: {
          url: data.url || "/dashboard",
          notificationId: data.notificationId,
        },
        vibrate: [100, 50, 100],
        requireInteraction: false,
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  const notificationId = event.notification.data?.notificationId;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if (notificationId) {
            client.postMessage({
              type: "MARK_NOTIFICATION_READ",
              notificationId,
            });
          }
          if ("navigate" in client) {
            await client.navigate(url);
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(url);
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
