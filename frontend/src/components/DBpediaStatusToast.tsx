'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'loading' | 'success' | 'warning' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface DBpediaStatusToastProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

const icons = {
    loading: (
        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    success: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    warning: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    error: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    info: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const colors = {
    loading: 'from-blue-500/20 to-blue-600/20 border-blue-500/50 text-blue-300',
    success: 'from-green-500/20 to-green-600/20 border-green-500/50 text-green-300',
    warning: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50 text-yellow-300',
    error: 'from-red-500/20 to-red-600/20 border-red-500/50 text-red-300',
    info: 'from-purple-500/20 to-purple-600/20 border-purple-500/50 text-purple-300',
};

export default function DBpediaStatusToast({ toasts, onRemove }: DBpediaStatusToastProps) {
    useEffect(() => {
        toasts.forEach(toast => {
            if (toast.duration && toast.duration > 0) {
                const timer = setTimeout(() => {
                    onRemove(toast.id);
                }, toast.duration);

                return () => clearTimeout(timer);
            }
        });
    }, [toasts, onRemove]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${colors[toast.type]} backdrop-blur-xl border rounded-2xl shadow-xl animate-slide-in-right min-w-[300px] max-w-md`}
                >
                    <div className="flex-shrink-0">
                        {icons[toast.type]}
                    </div>
                    <p className="flex-1 text-sm font-medium">{toast.message}</p>
                    <button
                        onClick={() => onRemove(toast.id)}
                        className="flex-shrink-0 hover:opacity-70 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}

// Hook personalizado para manejar toasts
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (type: ToastType, message: string, duration = 5000): string => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, message, duration }]);
        return id;
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return {
        toasts,
        addToast,
        removeToast,
        showLoading: (msg: string) => addToast('loading', msg, 0),
        showSuccess: (msg: string) => addToast('success', msg),
        showWarning: (msg: string) => addToast('warning', msg),
        showError: (msg: string) => addToast('error', msg),
        showInfo: (msg: string) => addToast('info', msg),
    };
}
