'use client';

import { useEffect, useState } from 'react';
import { syncManager } from '../lib/sync-manager';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const updateStatus = () => {
            setIsOnline(navigator.onLine);
            syncManager.getPendingCount().then(setPendingCount);
        };

        updateStatus();
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);

        const interval = setInterval(updateStatus, 5000);

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
            clearInterval(interval);
        };
    }, []);

    if (isOnline && pendingCount === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!isOnline && (
                <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 mb-2">
                    <span className="text-xl">🔴</span>
                    <div>
                        <p className="font-semibold">Sin conexión</p>
                        <p className="text-sm opacity-90">Trabajando offline</p>
                    </div>
                </div>
            )}

            {pendingCount > 0 && (
                <div className="bg-yellow-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
                    <span className="text-xl">⏳</span>
                    <div>
                        <p className="font-semibold">{pendingCount} cambios pendientes</p>
                        <p className="text-sm opacity-90">Se sincronizarán al reconectar</p>
                    </div>
                </div>
            )}
        </div>
    );
}
