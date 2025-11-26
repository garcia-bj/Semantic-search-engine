'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Document {
    id: string;
    filename: string;
    createdAt: string;
    _count?: { triples: number };
}

interface SearchResult {
    id: string;
    subject: string;
    predicate: string;
    object: string;
    document: {
        id: string;
        filename: string;
    };
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [files, setFiles] = useState<Document[]>([]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await fetch(`${API_URL}/upload/documents`);
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            }
        } catch (error) {
            console.error('Error al obtener archivos:', error);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setIsUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Archivo subido:', data);
                fetchFiles();
                e.target.value = ''; // Reset input
            } else {
                const errorData = await res.json();
                setError(errorData.message || 'Error al subir archivo');
            }
        } catch (error) {
            console.error('Error al subir archivo:', error);
            setError('Error de conexión con el servidor');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (documentId: string) => {
        try {
            const res = await fetch(`${API_URL}/upload/documents/${documentId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchFiles();
            }
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
            } else {
                setError('Error en la búsqueda');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setError('Error de conexión con el servidor');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 text-white">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative max-w-7xl mx-auto p-6 md:p-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-10 md:mb-16">
                    <Link
                        href="/"
                        className="group flex items-center gap-3 text-2xl md:text-3xl font-bold"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            Buscador Semántico
                        </span>
                    </Link>
                </header>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400">
                        {error}
                    </div>
                )}

                <div className="grid lg:grid-cols-[320px_1fr] gap-6 md:gap-8">
                    {/* Sidebar - Base de Conocimiento */}
                    <aside className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-700/50 h-fit shadow-2xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-purple-300">
                                Base de Conocimiento
                            </h2>
                        </div>

                        <div className="mb-8">
                            <label className="block w-full cursor-pointer group">
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-center py-4 rounded-2xl transition-all font-bold shadow-lg hover:shadow-purple-500/50 hover:scale-105 transform duration-300">
                                    {isUploading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Subiendo...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Subir OWL/RDF
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleUpload}
                                    accept=".owl,.rdf,.xml"
                                    disabled={isUploading}
                                />
                            </label>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-slate-400">
                                    Archivos ({files.length})
                                </span>
                            </div>

                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl group hover:bg-slate-800/80 transition-all border border-slate-700/30 hover:border-purple-500/30"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm text-slate-300 truncate font-medium block" title={file.filename}>
                                                {file.filename}
                                            </span>
                                            {file._count && (
                                                <span className="text-xs text-slate-500">
                                                    {file._count.triples} triples
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-2 p-2 hover:bg-red-500/10 rounded-lg"
                                        title="Eliminar archivo"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}

                            {files.length === 0 && (
                                <div className="text-center py-12 px-4">
                                    <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">
                                        No hay archivos subidos
                                    </p>
                                    <p className="text-xs text-slate-600 mt-2">
                                        Sube archivos OWL/RDF para comenzar
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main Content - Búsqueda */}
                    <main className="space-y-8">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                            <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Busca en tu base de conocimiento (ej: 'Person', 'Organization', etc.)"
                                    className="w-full bg-transparent text-white px-8 py-6 pr-20 focus:outline-none text-lg placeholder:text-slate-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching || !query.trim()}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 text-white p-3 rounded-2xl transition-all shadow-lg hover:shadow-purple-500/50 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                                >
                                    {isSearching ? (
                                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Results */}
                        <div className="space-y-6">
                            {isSearching && (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-purple-500/50">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-semibold text-purple-300">Buscando...</p>
                                        <p className="text-sm text-slate-500 mt-2">Analizando la base de conocimiento</p>
                                    </div>
                                </div>
                            )}

                            {!isSearching && results.length > 0 && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-slate-400">
                                            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                                        </h3>
                                    </div>
                                    {results.map((result, index) => (
                                        <div
                                            key={result.id}
                                            className="group p-8 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] shadow-xl hover:shadow-2xl hover:shadow-purple-500/20"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full">
                                                            Base de Conocimiento
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {result.document.filename}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-purple-300 mb-3">{result.subject}</h3>
                                                    <div className="space-y-2 text-sm">
                                                        <p className="text-slate-400">
                                                            <span className="font-semibold text-slate-300">Predicado:</span> {result.predicate}
                                                        </p>
                                                        <p className="text-slate-400">
                                                            <span className="font-semibold text-slate-300">Objeto:</span> {result.object}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {!isSearching && results.length === 0 && query && (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-semibold text-slate-400 mb-2">No se encontraron resultados</p>
                                    <p className="text-sm text-slate-600">Intenta con una consulta diferente</p>
                                </div>
                            )}

                            {!isSearching && results.length === 0 && !query && (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-semibold text-slate-400 mb-2">Comienza tu búsqueda</p>
                                    <p className="text-sm text-slate-600">Ingresa una consulta para ver resultados semánticos</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
