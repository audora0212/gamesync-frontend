/* global self */
// Fallback service worker without importScripts to avoid external CDN blocking
// We handle background pushes via the standard 'push' event.

const handledMessageIds = new Set();

self.addEventListener('push', (event) => {
  if (!event) return;
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // if JSON parse fails, try raw text
    const text = event.data ? event.data.text() : '';
    payload = { data: { title: 'GameSync 알림', body: text } };
  }

  const dataObj = payload.data || payload; // support both {data:{...}} and flat {...}
  const mid = dataObj && (dataObj.messageId || dataObj.mid) || null;
  if (mid && handledMessageIds.has(mid)) return;
  if (mid) handledMessageIds.add(mid);

  const title = dataObj.title || (payload.notification && payload.notification.title) || 'GameSync 알림';
  const body  = dataObj.body  || (payload.notification && payload.notification.body)  || '';

  const options = {
    body,
    data: dataObj || {},
    icon: '/favicon.ico'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});


