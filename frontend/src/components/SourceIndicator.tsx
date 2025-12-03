'use client';

interface SourceIndicatorProps {
    source: 'online' | 'cache' | 'none';
    verified?: boolean;
    timestamp?: Date;
    onVerify?: () => void;
}

export default function SourceIndicator({ source, verified, timestamp, onVerify }: SourceIndicatorProps) {
    if (source === 'none') return null;

    return (
        <div className="flex items-center gap-2 text-xs mt-2">
            {source === 'cache' ? (
                <>
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    <span className="text-yellow-400 font-medium">Caché Offline</span>
                    {!verified && (
                        <span className="text-yellow-500/70">(No verificado)</span>
                    )}
                    {timestamp && (
                        <span className="text-slate-500">
                            • {new Date(timestamp).toLocaleDateString()}
                        </span>
                    )}
                    {onVerify && (
                        <button
                            onClick={onVerify}
                            className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs font-medium"
                        >
                            Verificar online
                        </button>
                    )}
                </>
            ) : (
                <>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-green-400 font-medium">DBpedia Online</span>
                    <span className="text-green-500/70">✓ Verificado</span>
                </>
            )}
        </div>
    );
}
