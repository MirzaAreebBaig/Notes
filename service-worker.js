self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_REMINDER') {
    const { time, text } = event.data;
    const timeoutId = setTimeout(() => {
      self.registration.showNotification('Reminder', {
        body: text,
        icon: '/favicon.ico',
        requireInteraction: true
      });
    }, new Date(time) - Date.now());
    
    // Store timeout ID if needed for cancellation
    self.timeouts = self.timeouts || new Map();
    self.timeouts.set(event.data.id, timeoutId);
  }
});
