import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SynapseDB extends DBSchema {
    searches: {
        key: string;
        value: {
            id: string;
            query: string;
            results: any[];
            dbpediaResults: any[];
            timestamp: number;
        };
    };
    files: {
        key: string;
        value: {
            id: string;
            filename: string;
            tripleCount: number;
            createdAt: string;
        };
    };
    pendingUploads: {
        key: string;
        value: {
            id: string;
            file: File;
            timestamp: number;
        };
    };
}

const DB_NAME = 'synapse-search-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SynapseDB>> | null = null;

export const getDB = async (): Promise<IDBPDatabase<SynapseDB>> => {
    if (!dbPromise) {
        dbPromise = openDB<SynapseDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Create object stores
                if (!db.objectStoreNames.contains('searches')) {
                    db.createObjectStore('searches', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('pendingUploads')) {
                    db.createObjectStore('pendingUploads', { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

// Search cache operations
export const cacheSearch = async (query: string, results: any[], dbpediaResults: any[]) => {
    const db = await getDB();
    const id = `search-${Date.now()}`;
    await db.put('searches', {
        id,
        query,
        results,
        dbpediaResults,
        timestamp: Date.now(),
    });
};

export const getCachedSearch = async (query: string) => {
    const db = await getDB();
    const allSearches = await db.getAll('searches');
    return allSearches.find(s => s.query.toLowerCase() === query.toLowerCase());
};

export const clearOldSearches = async (maxAge: number = 24 * 60 * 60 * 1000) => {
    const db = await getDB();
    const allSearches = await db.getAll('searches');
    const now = Date.now();

    for (const search of allSearches) {
        if (now - search.timestamp > maxAge) {
            await db.delete('searches', search.id);
        }
    }
};

// File cache operations
export const cacheFiles = async (files: any[]) => {
    const db = await getDB();
    const tx = db.transaction('files', 'readwrite');

    for (const file of files) {
        await tx.store.put(file);
    }

    await tx.done;
};

export const getCachedFiles = async () => {
    const db = await getDB();
    return await db.getAll('files');
};

// Pending uploads operations
export const addPendingUpload = async (file: File) => {
    const db = await getDB();
    const id = `upload-${Date.now()}`;
    await db.put('pendingUploads', {
        id,
        file,
        timestamp: Date.now(),
    });
    return id;
};

export const getPendingUploads = async () => {
    const db = await getDB();
    return await db.getAll('pendingUploads');
};

export const removePendingUpload = async (id: string) => {
    const db = await getDB();
    await db.delete('pendingUploads', id);
};

export const clearAllPendingUploads = async () => {
    const db = await getDB();
    await db.clear('pendingUploads');
};
