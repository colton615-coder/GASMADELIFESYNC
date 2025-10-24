// --- CONFIGURATION ---
const STATIC_CACHE_NAME = 'life-sync-static-v2';
const DYNAMIC_CACHE_NAME = 'life-sync-dynamic-v2';
const DYNAMIC_CACHE_MAX_ENTRIES = 50;
const STATIC_ASSETS = [
  '/', '/index.html', '/index.js', // Updated from .tsx to .js for production build
  '/icon.svg', '/manifest.webmanifest', '/offline.html',
  '/icons/icon-192x192.png', '/icons/icon-256x256.png', '/icons/icon-384x384.png',
  '/icons/icon-512x512.png', '/icons/apple-touch-icon.png'
];
const CDN_ORIGINS = ['https://aistudiocdn.com', 'https://cdn.tailwindcss.com'];
let geminiApiKey; // Will be set by the client

// --- INDEXEDDB HELPERS (Must be self-contained for SW) ---
const DB_NAME = 'LifeSyncDB';
const DB_VERSION = 2; // Incremented DB version
const STORE_KEYS = [
    'tasks', 'habits', 'shoppingListItems', 'itemCategoryMap', 'workoutPlans',
    'workoutHistory', 'journalEntries', 'journalPromptHistory', 'journalDrafts',
    'moodLogs', 'journalAnalysisCache', 'dailyAffirmations',
    'biometricSettings', 'dismissedInsights', 'dailyAffirmationLog', 'lastSyncTime',
    'adaptiveThemeSettings', 'journalSummaryCache', 'mindfulMomentsChat', 'journalLastPromptIndex'
];

const initDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(new Error('Failed to open DB'));
    
    request.onsuccess = (event) => {
        const db = event.target.result;
        db.onversionchange = () => {
            // The main app is likely trying to upgrade. Close this connection immediately.
            db.close();
            console.log('[SW] IndexedDB connection closed to allow version upgrade.');
        };
        resolve(db);
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        STORE_KEYS.forEach(key => {
            if (!db.objectStoreNames.contains(key)) {
                db.createObjectStore(key, { keyPath: 'key' });
            }
        });
        if (!db.objectStoreNames.contains('app_meta')) {
            db.createObjectStore('app_meta', { keyPath: 'key' });
        }
    };
    
    request.onblocked = () => {
        console.error('[SW] IndexedDB open request was blocked. Other connections may be open.');
        reject(new Error('DB open blocked'));
    };
});

const dbGetAll = async (storeName) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
    });
};

const dbSet = async (storeName, key, value) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put({ key, value });
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
    });
};

// --- CORE SERVICE WORKER LOGIC ---
const limitCacheSize = (cacheName, maxItems) => {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        keys.slice(0, keys.length - maxItems).map(key => cache.delete(key));
      }
    });
  });
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keyList) => Promise.all(
      keyList.map((key) => {
        if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

// --- MESSAGE LISTENER FOR API KEY ---
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_API_KEY') {
        geminiApiKey = event.data.apiKey;
        console.log('[SW] Gemini API Key received and stored.');
    }
});

// --- FETCH HANDLER ---
// --- BACKGROUND FETCH EVENT HANDLERS ---
self.addEventListener('backgroundfetchsuccess', (event) => {
  console.log('[SW] Background fetch success:', event.registration.id);
  
  event.waitUntil(
    self.registration.showNotification('Data Export Complete', {
      body: 'Your Life Sync data backup has been successfully downloaded.',
      icon: '/icons/icon-192x192.png'
    })
  );
});

self.addEventListener('backgroundfetchfail', (event) => {
  console.error('[SW] Background fetch failed:', event.registration.id);
  
  event.waitUntil(
    self.registration.showNotification('Data Export Failed', {
      body: 'There was an error creating your data backup. Please try again.',
      icon: '/icons/icon-192x192.png'
    })
  );
});