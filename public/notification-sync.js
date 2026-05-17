/**
 * Daily reminder handlers imported by Angular's ngsw-worker.
 * Reads prefs + precomputed payload from IndexedDB (written by the app).
 */
const DB_NAME = 'quran-daily-reminders';
const DB_VERSION = 1;
const STORE = 'state';
const STATE_KEY = 'current';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim().then(() => checkAndMaybeNotify()));
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-quran-reminder') {
    event.waitUntil(checkAndMaybeNotify());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'daily-quran-reminder') {
    event.waitUntil(checkAndMaybeNotify());
  }
});

self.addEventListener('message', (event) => {
  const type = event.data && event.data.type;
  if (type === 'CHECK_REMINDER' || type === 'SYNC_PREFS') {
    event.waitUntil(checkAndMaybeNotify());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function readState(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const request = store.get(STATE_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

function writeState(db, state) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.put(state, STATE_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function localDateKey(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

function localMinutesSinceMidnight(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone || undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return hour * 60 + minute;
  } catch {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
}

function isDue(prefs) {
  if (!prefs || !prefs.enabled) {
    return false;
  }
  const today = localDateKey(prefs.timeZone);
  if (prefs.lastNotifiedDate === today) {
    return false;
  }
  const nowMinutes = localMinutesSinceMidnight(prefs.timeZone);
  const target = (Number(prefs.hour) || 0) * 60 + (Number(prefs.minute) || 0);
  return nowMinutes >= target;
}

async function checkAndMaybeNotify() {
  if (!('Notification' in self) || Notification.permission !== 'granted') {
    return;
  }

  let db;
  try {
    db = await openDb();
    const state = await readState(db);
    if (!state || !state.prefs || !state.payload) {
      return;
    }
    if (!isDue(state.prefs)) {
      return;
    }

    const payload = state.payload;
    await self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag || 'quran-daily-reminder',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: payload.url },
      renotify: false,
    });

    const today = localDateKey(state.prefs.timeZone);
    state.prefs.lastNotifiedDate = today;
    await writeState(db, state);
  } catch {
    /* offline / IDB unavailable */
  } finally {
    if (db) {
      db.close();
    }
  }
}
