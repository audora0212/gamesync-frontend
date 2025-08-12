/* global self */
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

// Note: The config below should match the client config
firebase.initializeApp({
  apiKey: "AIzaSyDfwB0dOlR86iQfVzZTuO1G0jYoI6ZTMfY",
  authDomain: "gamesync-0212.firebaseapp.com",
  projectId: "gamesync-0212",
  storageBucket: "gamesync-0212.firebasestorage.app",
  messagingSenderId: "551919197948",
  appId: "1:551919197948:web:cb8eaca23e4596c3008179",
  measurementId: "G-EE1FWZ9B9M"
});

const messaging = firebase.messaging();
const handledMessageIds = new Set();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  const mid = (payload && (payload.messageId || (payload.data && payload.data.messageId))) || null;
  if (mid && handledMessageIds.has(mid)) return;
  if (mid) handledMessageIds.add(mid);
  // Prefer data-only message
  const title = (payload.data && payload.data.title) || (payload.notification && payload.notification.title) || 'GameSync 알림';
  const body  = (payload.data && payload.data.body)  || (payload.notification && payload.notification.body)  || '';
  const options = {
    body,
    data: payload.data || {},
    icon: '/favicon.ico'
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = '/dashboard'; // Could deep-link using event.notification.data
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});


