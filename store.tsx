import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// --- DATABASE CONFIGURATION ---
const DB_NAME = 'LifeSyncDB';
const DB_VERSION = 2; // Incremented version to trigger upgrade for existing users
const STORE_KEYS = [
    'tasks', 'habits', 'shoppingListItems', 'itemCategoryMap', 'workoutPlans',
    'workoutHistory', 'journalEntries', 'journalPromptHistory', 'journalDrafts',
    'moodLogs', 'journalAnalysisCache', 'dailyAffirmations', 'swingHistory',
    'biometricSettings', 'dismissedInsights', 'dailyAffirmationLog', 'lastSyncTime',
    'adaptiveThemeSettings', 'journalSummaryCache', 'mindfulMomentsChat', 'weeklyReviewCache'
];
const MIGRATION_KEY = 'v1_indexeddb_migration_complete';

// --- INDEXEDDB HELPER FUNCTIONS ---
let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(new Error('Failed to open IndexedDB.'));
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            STORE_KEYS.forEach(key => {
                if (!db.objectStoreNames.contains(key)) {
                    db.createObjectStore(key, { keyPath: 'key' });
                }
            });
            // Store for migration flag
            if (!db.objectStoreNames.contains('app_meta')) {
                db.createObjectStore('app_meta', { keyPath: 'key' });
            }
        };
    });
    return dbPromise;
};

const dbGet = async <T,>(storeName: string, key: string): Promise<T | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result?.value);
    });
};

const dbSet = async (storeName: string, key: string, value: any): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put({ key, value });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

const dbGetAllData = async (): Promise<Record<string, any>> => {
    const db = await initDB();
    const data: Record<string, any> = {};
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_KEYS, 'readonly');
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve(data);
        
        STORE_KEYS.forEach(storeName => {
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => {
                if (request.result.length > 0) {
                    data[storeName] = request.result[0].value;
                }
            };
        });
    });
};

// --- DATA MIGRATION ---
const migrateFromLocalStorage = async () => {
    console.log('Checking if data migration is needed...');
    const isMigrated = await dbGet('app_meta', MIGRATION_KEY);
    if (isMigrated) {
        console.log('Migration already complete.');
        return;
    }

    console.log('Starting migration from localStorage to IndexedDB...');
    for (const key of STORE_KEYS) {
        const localData = localStorage.getItem(key);
        if (localData) {
            try {
                // The old hook stored data in a { data: ..., lastUpdated: ... } wrapper
                const parsedWrapper = JSON.parse(localData);
                const actualData = parsedWrapper.data !== undefined ? parsedWrapper.data : parsedWrapper;
                await dbSet(key, key, actualData);
                console.log(`Migrated "${key}"`);
            } catch (e) {
                console.warn(`Could not migrate key "${key}"`, e);
            }
        }
    }

    await dbSet('app_meta', MIGRATION_KEY, true);
    console.log('Migration finished.');
};

// --- REACT CONTEXT & PROVIDER ---
interface AppData {
    [key: string]: any;
}

interface DataContextType {
    data: AppData;
    setData: (key: string, value: any) => void;
    isLoaded: boolean;
}

const DataContext = createContext<DataContextType>({
    data: {},
    setData: () => {},
    isLoaded: false,
});

export const useStore = () => useContext(DataContext);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setDataState] = useState<AppData>({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                await initDB();
                await migrateFromLocalStorage();
                const allData = await dbGetAllData();
                setDataState(allData);
            } catch (error) {
                console.error("Critical Error: Failed to initialize or load data from IndexedDB.", error);
                // Fallback to an empty state to prevent a crash
                setDataState({});
            } finally {
                // Ensure the app always proceeds from the loading screen
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    const setData = useCallback((key: string, value: any) => {
        setDataState(prevData => {
            const currentSlice = prevData[key];
            const newSliceValue = typeof value === 'function' ? value(currentSlice) : value;
            const newData = { ...prevData, [key]: newSliceValue };
            dbSet(key, key, newSliceValue);
            return newData;
        });
    }, []);

    const value = { data, setData, isLoaded };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
// Exporting DB functions for service worker to import (conceptually)
export const db = { initDB, dbGetAllData, dbSet };
