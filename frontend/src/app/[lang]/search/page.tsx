'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import LanguageSelector from '@/components/LanguageSelector';
import SearchResultCard from '@/components/SearchResultCard';
import DBpediaStatusToast, { useToast } from '@/components/DBpediaStatusToast';
import SourceIndicator from '@/components/SourceIndicator';
import { Locale } from '@/lib/i18n';
import { searchDBpedia, DBpediaResult } from '@/lib/dbpedia';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Document {
    id: string;
    filename: string;
    createdAt: string;
    tripleCount?: number;
}

interface SearchResult {
    id: string;
    subject: string;
    predicate: string;
    object: string;
    document?: {
        id: string;
        filename: string;
    };
}

const translations = {
    es: {
        title: 'Buscador Semántico',
        knowledgeBase: 'Base de Conocimiento',
        uploadButton: 'Subir OWL/RDF',
        uploading: 'Subiendo...',
        files: 'Archivos',
        noFiles: 'No hay archivos subidos',
        noFilesDesc: 'Sube archivos OWL/RDF para comenzar',
        searchPlaceholder: 'Busca en tu base de conocimiento (ej: "Person", "Organization", etc.)',
        searching: 'Buscando...',
        analyzingKB: 'Analizando la base de conocimiento y DBpedia',
        resultsFound: 'resultado(s) encontrado(s)',
        noResults: 'No se encontraron resultados',
        tryDifferent: 'Intenta con una consulta diferente',
        startSearch: 'Comienza tu búsqueda',
        enterQuery: 'Ingresa una consulta para ver resultados semánticos',
        predicate: 'Predicado',
        object: 'Objeto',
        deleteFile: 'Eliminar archivo',
        triples: 'tripletas',
        localResults: 'Resultados Locales',
        dbpediaResults: 'Resultados de DBpedia',
        externalSource: 'Fuente Externa',
        readMore: 'Leer más en DBpedia'
    },
    en: {
        title: 'Semantic Search',
        knowledgeBase: 'Knowledge Base',
        uploadButton: 'Upload OWL/RDF',
        uploading: 'Uploading...',
        files: 'Files',
        noFiles: 'No files uploaded',
        noFilesDesc: 'Upload OWL/RDF files to get started',
        searchPlaceholder: 'Search in your knowledge base (e.g., "Person", "Organization", etc.)',
        searching: 'Searching...',
        analyzingKB: 'Analyzing knowledge base and DBpedia',
        resultsFound: 'result(s) found',
        noResults: 'No results found',
        tryDifferent: 'Try a different query',
        startSearch: 'Start your search',
        enterQuery: 'Enter a query to see semantic results',
        predicate: 'Predicate',
        object: 'Object',
        deleteFile: 'Delete file',
        triples: 'triples',
        localResults: 'Local Results',
        dbpediaResults: 'DBpedia Results',
        externalSource: 'External Source',
        readMore: 'Read more on DBpedia'
    },
    pt: {
        title: 'Busca Semântica',
        knowledgeBase: 'Base de Conhecimento',
        uploadButton: 'Enviar OWL/RDF',
        uploading: 'Enviando...',
        files: 'Arquivos',
        noFiles: 'Nenhum arquivo enviado',
        noFilesDesc: 'Envie arquivos OWL/RDF para começar',
        searchPlaceholder: 'Pesquise em sua base de conhecimento (ex: "Person", "Organization", etc.)',
        searching: 'Buscando...',
        analyzingKB: 'Analisando a base de conhecimento e DBpedia',
        resultsFound: 'resultado(s) encontrado(s)',
        noResults: 'Nenhum resultado encontrado',
        tryDifferent: 'Tente uma consulta diferente',
        startSearch: 'Comece sua busca',
        enterQuery: 'Digite uma consulta para ver resultados semânticos',
        predicate: 'Predicado',
        object: 'Objeto',
        deleteFile: 'Excluir arquivo',
        triples: 'triplas',
        localResults: 'Resultados Locais',
        dbpediaResults: 'Resultados do DBpedia',
        externalSource: 'Fonte Externa',
        readMore: 'Leia mais no DBpedia'
    }
};

export default function SearchPage() {
    const params = useParams();
    const lang = (params.lang as Locale) || 'es';
    const t = translations[lang];

    const [query, setQuery] = useState('');
    const [files, setFiles] = useState<Document[]>([]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [dbpediaResults, setDbpediaResults] = useState<DBpediaResult[]>([]);
    const [dbpediaSource, setDbpediaSource] = useState<'online' | 'cache' | 'offline' | 'none'>('none');
    const [dbpediaVerified, setDbpediaVerified] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const { toasts, addToast, removeToast, showLoading, showSuccess, showWarning, showError } = useToast();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
            console.error('Error fetching files:', error);
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
                console.log('File uploaded:', data);
                fetchFiles();
                e.target.value = '';
            } else {
                const errorData = await res.json();
                setError(errorData.message || 'Error uploading file');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setError('Connection error with server');
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
            console.error('Error deleting file:', error);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError('');
        setResults([]);
        setDbpediaResults([]);
        setDbpediaSource('none');

        try {
            // Búsqueda local con parámetro de idioma
            const localRes = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}&language=${lang}`);
            if (localRes.ok) {
                const data = await localRes.json();
                setResults(data.results || []);
            }

            // Búsqueda DBpedia con caché y notificaciones
            const toastId = showLoading('Buscando en DBpedia...');

            try {
                const dbpediaRes = await fetch(
                    `${API_URL}/dbpedia-cache/search?q=${encodeURIComponent(query)}&lang=${lang}`,
                    { signal: AbortSignal.timeout(10000) } // 10s timeout
                );

                removeToast(toastId);

                if (dbpediaRes.ok) {
                    const data = await dbpediaRes.json();

                    if (data.success && data.results.length > 0) {
                        setDbpediaResults(data.results);
                        setDbpediaSource(data.source);
                        setDbpediaVerified(data.verified || false);

                        if (data.source === 'online') {
                            showSuccess(`${data.results.length} resultados encontrados en DBpedia`);
                        } else if (data.source === 'cache') {
                            showWarning(`Usando caché offline (${data.results.length} resultados)`);
                        } else if (data.source === 'offline') {
                            showWarning(`Usando base de conocimiento local (${data.results.length} resultados)`);
                        }
                    } else {
                        showWarning('No se encontraron resultados en DBpedia');
                    }
                } else {
                    showError('Error al buscar en DBpedia');
                }
            } catch (dbError: any) {
                removeToast(toastId);
                if (dbError.name === 'TimeoutError' || dbError.name === 'AbortError') {
                    showWarning('DBpedia tardó mucho en responder (puede estar lento o sin internet)');
                } else {
                    showError('Error de conexión con DBpedia');
                }
            }

        } catch (error) {
            console.error('Search error:', error);
            setError('Error de conexión con el servidor');
            showError('Error de conexión con el servidor');
        } finally {
            setIsSearching(false);
        }
    };

    const hasResults = results.length > 0 || dbpediaResults.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 text-white">
            {/* Toast Notifications */}
            <DBpediaStatusToast toasts={toasts} onRemove={removeToast} />
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative max-w-[1600px] mx-auto p-4 md:p-6">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                            title={isSidebarOpen ? "Cerrar barra lateral" : "Abrir barra lateral"}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <Link
                            href={`/${lang}`}
                            className="group flex items-center gap-3 text-xl md:text-2xl font-bold"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 hidden md:block">
                                {t.title}
                            </span>
                        </Link>
                    </div>
                    <LanguageSelector currentLang={lang} />
                </header>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400">
                        {error}
                    </div>
                )}

                <div className="flex gap-6 relative">
                    {/* Sidebar - Knowledge Base */}
                    <aside
                        className={`
                            fixed inset-y-0 left-0 z-50 w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 p-6 transform transition-transform duration-300 ease-in-out
                            lg:relative lg:translate-x-0 lg:bg-gradient-to-br lg:from-slate-900/80 lg:to-slate-900/40 lg:rounded-3xl lg:border lg:h-fit lg:shadow-2xl lg:z-0
                            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-purple-300">
                                    {t.knowledgeBase}
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="lg:hidden p-2 text-slate-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
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
                                            {t.uploading}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            {t.uploadButton}
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

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-slate-400">
                                    {t.files} ({files.length})
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
                                            {file.tripleCount !== undefined && (
                                                <span className="text-xs text-slate-500">
                                                    {file.tripleCount} {t.triples}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-2 p-2 hover:bg-red-500/10 rounded-lg"
                                        title={t.deleteFile}
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
                                        {t.noFiles}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-2">
                                        {t.noFilesDesc}
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main Content - Search */}
                    <main className="flex-1 min-w-0 transition-all duration-300">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative group mb-8">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                            <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t.searchPlaceholder}
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
                        <div className="space-y-8">
                            {isSearching && (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-purple-500/50">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-semibold text-purple-300">{t.searching}</p>
                                        <p className="text-sm text-slate-500 mt-2">{t.analyzingKB}</p>
                                    </div>
                                </div>
                            )}

                            {!isSearching && hasResults && (
                                <div className={`grid gap-8 ${dbpediaResults.length > 0 && results.length > 0 ? 'xl:grid-cols-2' : 'grid-cols-1'}`}>
                                    {/* DBpedia Results (Left) */}
                                    {dbpediaResults.length > 0 && (
                                        <section className="min-w-0">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-xl font-bold text-white">{t.dbpediaResults} ({dbpediaResults.length})</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {dbpediaResults.map((result, index) => (
                                                    <div
                                                        key={`${result.resource}-${index}`}
                                                        className="group p-6 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.01] shadow-xl hover:shadow-2xl hover:shadow-blue-500/20"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">
                                                                        {t.externalSource}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">
                                                                        DBpedia
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-xl font-bold text-blue-300 mb-2 break-words">{result.label}</h3>
                                                                {result.abstract && (
                                                                    <p className="text-slate-400 text-sm mb-3 line-clamp-3 break-words">
                                                                        {result.abstract}
                                                                    </p>
                                                                )}
                                                                <a
                                                                    href={result.resource}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                                >
                                                                    {t.readMore}
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Local Results (Right) */}
                                    {results.length > 0 && (
                                        <section className="min-w-0">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-xl font-bold text-white">{t.localResults} ({results.length})</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {results.map((result, index) => (
                                                    <SearchResultCard key={result.id || `local-${index}`} result={result} index={index} t={t} />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )
                            }

                            {
                                !isSearching && !hasResults && query && (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-semibold text-slate-400 mb-2">{t.noResults}</p>
                                        <p className="text-sm text-slate-600">{t.tryDifferent}</p>
                                    </div>
                                )
                            }

                            {
                                !isSearching && !hasResults && !query && (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-semibold text-slate-400 mb-2">{t.startSearch}</p>
                                        <p className="text-sm text-slate-600">{t.enterQuery}</p>
                                    </div>
                                )
                            }
                        </div >
                    </main >
                </div >
            </div >
        </div >
    );
}
