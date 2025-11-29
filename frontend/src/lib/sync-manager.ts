import { indexedDBService } from './indexeddb';

class SyncManager {
    private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    private syncInProgress = false;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());
        }
    }

    private handleOnline() {
        this.isOnline = true;
        console.log('🟢 Connection restored');
        this.syncPendingChanges();
    }

    private handleOffline() {
        this.isOnline = false;
        console.log('🔴 Connection lost - Working offline');
    }

    async syncPendingChanges() {
        if (this.syncInProgress || !this.isOnline) return;

        this.syncInProgress = true;
        console.log('🔄 Syncing pending changes...');

        try {
            await this.syncPendingUploads();
            console.log('✅ Sync completed');
        } catch (error) {
            console.error('❌ Sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    private async syncPendingUploads() {
        const pending = await indexedDBService.getPendingUploads();

        for (const upload of pending) {
            try {
                const formData = new FormData();
                formData.append('file', upload.value.file);

                const response = await fetch('http://localhost:3001/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    await indexedDBService.markUploadSynced(upload.key);
                    console.log(`✅ Uploaded: ${upload.value.file.name}`);
                }
            } catch (error) {
                console.error(`❌ Failed to upload: ${upload.value.file.name}`, error);
            }
        }
    }

    getOnlineStatus() {
        return this.isOnline;
    }

    async getPendingCount() {
        const pending = await indexedDBService.getPendingUploads();
        return pending.length;
    }
}

export const syncManager = new SyncManager();
