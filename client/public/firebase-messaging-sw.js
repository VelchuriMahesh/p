importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCElWqYYSuiWW3WMP7WuBnaklVn4HaHUTc',
  authDomain: 'celebrate-with-purpose-9550d.firebaseapp.com',
  projectId: 'celebrate-with-purpose-9550d',
  storageBucket: 'celebrate-with-purpose-9550d.appspot.com',
  messagingSenderId: '467208415922',
  appId: '1:467208415922:web:19e18ed9f3d0fba3d577ab',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Celebrate With Purpose', {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data,
  });
});