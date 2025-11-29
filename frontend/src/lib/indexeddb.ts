import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SemanticSearchDB extends DBSchema {
    documents: {
        key: string;
        value: {
            id: string;
            filename: string;
            tripleCount: number;
            uploadedAt: string;
            synced: boolean;
        };
    };
    searchResults: {
        key: string;
        value: {
            query: string;
            results: any[];
            timestamp: number;
            language?: string;
        };
    };
    pendingUploads: {
        key: number;
        value: {
            file: File;
            timestamp: number;
            synced: boolean;
        };
        autoIncrement: true;
    };
}

class IndexedDBService {
    private db: IDBPDatabase<SemanticSearchDB> | null = null;
    private readonly DB_NAME = 'semantic-search-db';
    private readonly DB_VERSION = 1;

    async init() {
        if (this.db) return this.db;

        this.db = await openDB<SemanticSearchDB>(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                // Documents store
                if (!db.objectStoreNames.contains('documents')) {
                    db.createObjectStore('documents', { keyPath: 'id' });
                }

                // Search results store
                if (!db.objectStoreNames.contains('searchResults')) {
                    db.createObjectStore('searchResults', { keyPath: 'query' });
                }

                // Pending uploads store
                if (!db.objectStoreNames.contains('pendingUploads')) {
                    db.createObjectStore('pendingUploads', { autoIncrement: true });
                }
            },
        });

        return this.db;
    }

    // Documents
    async saveDocument(doc: any) {
        const db = await this.init();
        await db.put('documents', { ...doc, synced: true });
    }

    async getDocuments() {
        const db = await this.init();
        return await db.getAll('documents');
    }

    async deleteDocument(id: string) {
        const db = await this.init();
        await db.delete('documents', id);
    }

    // Search Results (cache)
    async cacheSearchResults(query: string, results: any[], language?: string) {
        const db = await this.init();
        await db.put('searchResults', {
            query,
            results,
            timestamp: Date.now(),
            language,
        });
    }

    async getCachedSearchResults(query: string) {
        const db = await this.init();
        const cached = await db.get('searchResults', query);

        // Cache válido por 1 hora
        if (cached && Date.now() - cached.timestamp < 3600000) {
            return cached.results;
        }

        return null;
    }

    // Pending Uploads
    async queueUpload(file: File) {
        const db = await this.init();
        await db.add('pendingUploads', {
            file,
            timestamp: Date.now(),
            synced: false,
        });
    }

    async getPendingUploads() {
        const db = await this.init();
        const keys = await db.getAllKeys('pendingUploads');
        const values = await db.getAll('pendingUploads');

        return keys.map((key, index) => ({
            key,
            value: values[index]
        }));
    }

    async markUploadSynced(key: number) {
        const db = await this.init();
        await db.delete('pendingUploads', key);
    }

    async clearCache() {
        const db = await this.init();
        await db.clear('searchResults');
    }
}

export const indexedDBService = new IndexedDBService();
