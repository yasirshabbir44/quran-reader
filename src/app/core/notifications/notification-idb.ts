import {
  NOTIFICATION_DB_NAME,
  NOTIFICATION_DB_VERSION,
  NOTIFICATION_STATE_KEY,
  NOTIFICATION_STORE,
  type NotificationSyncState,
} from './notification-storage';

export function writeNotificationSyncState(state: NotificationSyncState): Promise<void> {
  return openNotificationDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(NOTIFICATION_STORE, 'readwrite');
        const store = tx.objectStore(NOTIFICATION_STORE);
        const request = store.put(state, NOTIFICATION_STATE_KEY);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

function openNotificationDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTIFICATION_DB_NAME, NOTIFICATION_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(NOTIFICATION_STORE)) {
        db.createObjectStore(NOTIFICATION_STORE);
      }
    };
  });
}
