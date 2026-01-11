importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration - these are public client-side keys
// Protected by Firebase Security Rules and domain restrictions
firebase.initializeApp({
  apiKey: "AIzaSyBYNwHEfwyQTwKb7LLfGYhXTqrmZekM_-o",
  authDomain: "oneanime-e3849.firebaseapp.com",
  projectId: "oneanime-e3849",
  storageBucket: "oneanime-e3849.firebasestorage.app",
  messagingSenderId: "372585562382",
  appId: "1:372585562382:web:9f38d63c2eccb0bcc5175f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Neue Episode verfügbar!';
  const notificationOptions = {
    body: payload.notification?.body || 'Eine neue Episode deines Animes ist erschienen.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.animeId || 'anime-notification',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const animeId = event.notification.data?.animeId;
  const url = animeId ? `/anime/${animeId}` : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
