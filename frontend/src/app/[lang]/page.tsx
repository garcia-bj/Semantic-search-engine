import { Locale, getDictionary } from '@/lib/i18n';
import Link from 'next/link';
import LanguageSelector from '@/components/LanguageSelector';

export default async function Home({ params }: { params: Promise<{ lang: Locale }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white selection:bg-purple-500 selection:text-white">
            {/* Language Selector */}
            <div className="absolute top-4 right-4 z-50">
                <LanguageSelector currentLang={lang} />
            </div>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                {/* Animated background effects */}
                <div className="absolute inset-0 overflow-hidden -z-10">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />
                </div>

                <div className="space-y-2 mb-6 animate-fade-in">
                    <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-300 mb-4">
                        ✨ {dict.home.subtitle}
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 animate-gradient">
                        {dict.home.title}
                    </h1>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
                        {lang === 'es' ? 'de Series TV' : 'for TV Series'}
                    </h2>
                </div>

                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mb-12 leading-relaxed">
                    {lang === 'es'
                        ? 'Descubre tu próxima serie favorita con el poder del significado. A diferencia de las búsquedas tradicionales por palabras clave, nuestro motor comprende el '
                        : 'Discover your next favorite series with the power of meaning. Unlike traditional keyword searches, our engine understands the '}
                    <span className="text-purple-400 font-semibold">{lang === 'es' ? 'contexto' : 'context'}</span>
                    {lang === 'es' ? ' y las ' : ' and '}
                    <span className="text-pink-400 font-semibold">{lang === 'es' ? 'relaciones' : 'relationships'}</span>
                    {lang === 'es' ? ' dentro de los datos de series de TV.' : ' within TV series data.'}
                </p>

                <div className="flex gap-6 mb-16">
                    <Link
                        href={`/${lang}/search`}
                        className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold transition-all shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transform duration-300"
                    >
                        <span className="flex items-center gap-2">
                            {dict.home.getStarted}
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl text-left">
                    <div className="group p-8 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-700/50 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-purple-300">
                            {lang === 'es' ? 'Comprensión Contextual' : 'Contextual Understanding'}
                        </h3>
                        <p className="text-slate-400 leading-relaxed">
                            {lang === 'es'
                                ? 'Encuentra resultados basados en el significado, no solo en coincidencias de palabras. Pregunta "series sobre viajes en el tiempo" y obtén resultados relevantes.'
                                : 'Find results based on meaning, not just word matches. Ask "series about time travel" and get relevant results.'}
                        </p>
                    </div>

                    <div className="group p-8 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-700/50 backdrop-blur-xl hover:border-pink-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20">
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-pink-500/50 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-pink-300">{dict.knowledge.title}</h3>
                        <p className="text-slate-400 leading-relaxed">
                            {lang === 'es'
                                ? 'Sube tus propios archivos OWL/RDF para expandir el conocimiento del motor de búsqueda sobre series específicas.'
                                : 'Upload your own OWL/RDF files to expand the search engine knowledge about specific series.'}
                        </p>
                    </div>

                    <div className="group p-8 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-700/50 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-blue-300">
                            {lang === 'es' ? 'Inferencias Inteligentes' : 'Smart Inferences'}
                        </h3>
                        <p className="text-slate-400 leading-relaxed">
                            {lang === 'es'
                                ? 'El motor infiere nuevas relaciones, ayudándote a descubrir joyas ocultas que podrías haber pasado por alto.'
                                : 'The engine infers new relationships, helping you discover hidden gems you might have overlooked.'}
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-800/50">
                <p>
                    {lang === 'es'
                        ? 'Buscador Semántico de Series TV • Potenciado por Ontologías OWL/RDF'
                        : 'TV Series Semantic Search • Powered by OWL/RDF Ontologies'}
                </p>
            </footer>
        </div>
    );
}
