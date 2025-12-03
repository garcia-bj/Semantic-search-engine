'use client';

interface SearchResult {
    id?: string;
    subject: string;
    predicate: string;
    object: string;
    document?: {
        id: string;
        filename: string;
    };
    // Campos enriquecidos para individuos
    type?: string;
    isClass?: boolean;
    isIndividual?: boolean;
    className?: string;
    classUri?: string;
    individuals?: any[];
    individualName?: string;
    individualUri?: string;
    classes?: any[];
    properties?: any[];
    relations?: any[];
}

interface SearchResultCardProps {
    result: SearchResult;
    index: number;
    t: any;
}

export default function SearchResultCard({ result, index, t }: SearchResultCardProps) {
    // Si es una clase OWL con individuos
    if (result.isClass && result.type === 'class' && result.individuals) {
        return (
            <div
                key={result.id || `class-${index}`}
                className="group p-6 bg-gradient-to-br from-purple-900/40 to-slate-900/40 backdrop-blur-xl border-2 border-purple-500/50 rounded-3xl hover:border-purple-400/70 transition-all duration-300 hover:scale-[1.01] shadow-2xl hover:shadow-purple-500/30"
            >
                {/* Header de Clase */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-purple-500/30 text-purple-200 text-xs font-bold rounded-full border border-purple-400/50">
                                CLASS
                            </span>
                            {result.document?.filename && (
                                <span className="text-xs text-slate-400">
                                    📄 {result.document.filename}
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-purple-200 mb-1">{result.className}</h3>
                        <p className="text-xs text-slate-400 break-all font-mono">{result.classUri}</p>
                    </div>
                </div>

                {/* Individuos */}
                {result.individuals && result.individuals.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Individuals ({result.individuals.length})
                        </h4>
                        <div className="space-y-3">
                            {result.individuals.map((individual: any, idx: number) => (
                                <div key={idx} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                                    <h5 className="text-lg font-bold text-emerald-300 mb-2">{individual.label}</h5>

                                    {/* Propiedades (Data Properties) */}
                                    {individual.properties && individual.properties.length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-xs font-semibold text-slate-400 mb-1">Properties:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {individual.properties.map((prop: any, pIdx: number) => (
                                                    <div key={pIdx} className="flex items-center gap-2 text-sm">
                                                        <span className="text-emerald-400 font-medium">{prop.property}:</span>
                                                        <span className="text-slate-300">{prop.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Relaciones (Object Properties) */}
                                    {individual.relations && individual.relations.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 mb-1">Relations:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {individual.relations.map((rel: any, rIdx: number) => (
                                                    <div key={rIdx} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                                                        {rel.property} → {rel.valueLabel}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {result.individuals && result.individuals.length === 0 && (
                    <p className="text-slate-400 text-sm italic">No individuals found for this class</p>
                )}
            </div>
        );
    }

    // Si es un individuo directo
    if (result.isIndividual && result.type === 'individual') {
        return (
            <div
                key={result.id || `individual-${index}`}
                className="group p-6 bg-gradient-to-br from-emerald-900/40 to-slate-900/40 backdrop-blur-xl border-2 border-emerald-500/50 rounded-3xl hover:border-emerald-400/70 transition-all duration-300 hover:scale-[1.02] shadow-2xl hover:shadow-emerald-500/30"
            >
                {/* Header de Individuo */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 text-xs font-bold rounded-full border border-emerald-400/50">
                                INDIVIDUAL
                            </span>
                            {result.document?.filename && (
                                <span className="text-xs text-slate-400">
                                    📄 {result.document.filename}
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-emerald-200 mb-1">{result.individualName}</h3>
                        <p className="text-xs text-slate-400 break-all font-mono">{result.individualUri}</p>

                        {/* Clases del individuo */}
                        {result.classes && result.classes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {result.classes.map((cls: any, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                                        {cls.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Propiedades */}
                {result.properties && result.properties.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-bold text-emerald-300 mb-2">Properties:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {result.properties.map((prop: any, idx: number) => (
                                <div key={idx} className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-emerald-300">{prop.property}</span>
                                        <span className="text-sm text-emerald-400/70">{prop.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Relaciones */}
                {result.relations && result.relations.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-blue-300 mb-2">Relations:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {result.relations.map((rel: any, idx: number) => (
                                <div key={idx} className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-blue-300">{rel.property}</span>
                                        <span className="text-sm text-blue-400/70">{rel.valueLabel}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Resultado normal (tripleta)
    return (
        <div
            key={result.id || `local-${index}`}
            className="group p-6 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.01] shadow-xl hover:shadow-2xl hover:shadow-purple-500/20"
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full">
                            {t.knowledgeBase}
                        </span>
                        <span className="text-xs text-slate-500">
                            {result.document?.filename || 'General Document'}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-purple-300 mb-3 break-words">{result.subject}</h3>
                    <div className="space-y-2 text-sm">
                        <p className="text-slate-400 break-all">
                            <span className="font-semibold text-slate-300">{t.predicate}:</span> {result.predicate}
                        </p>
                        <p className="text-slate-400 break-all">
                            <span className="font-semibold text-slate-300">{t.object}:</span> {result.object}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
