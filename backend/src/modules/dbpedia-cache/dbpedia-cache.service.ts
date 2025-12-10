import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

export interface DBpediaSearchResult {
    source: 'online' | 'cache' | 'offline';
    results: any[];
    cached: boolean;
    verified?: boolean;
    timestamp?: Date;
    language?: string;
}

interface HarvestedEntry {
    uri: string;
    label: string;
    abstract: string;
    genre: string;
    network: string;
    startDate: string;
    resource: string;
}

interface IndexedEntry extends HarvestedEntry {
    labelLower: string;
    abstractLower: string;
    keywords: string[];
}

@Injectable()
export class DBpediaCacheService implements OnModuleInit {
    private readonly logger = new Logger(DBpediaCacheService.name);
    private readonly DBPEDIA_TIMEOUT = 5000; // Reducido a 5 segundos para respuesta más rápida

    // Endpoints por idioma
    private readonly DBPEDIA_ENDPOINTS: Record<string, string> = {
        'es': 'https://es.dbpedia.org/sparql',
        'en': 'https://dbpedia.org/sparql',
        'pt': 'https://dbpedia.org/sparql',
    };

    // Datos offline indexados en memoria para búsqueda rápida
    private indexedData: Record<string, IndexedEntry[]> = {
        'en': [],
        'es': [],
        'pt': [],
    };

    // Índice invertido para búsqueda por palabras clave
    private keywordIndex: Record<string, Map<string, Set<number>>> = {
        'en': new Map(),
        'es': new Map(),
        'pt': new Map(),
    };

    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
    ) { }

    async onModuleInit() {
        await this.loadAndIndexOfflineData();
    }

    /**
     * Cargar y crear índice de datos offline para búsqueda rápida
     */
    private async loadAndIndexOfflineData() {
        const dataDir = path.join(process.cwd(), 'harvested_data');
        const languages = ['en', 'es', 'pt'];
        const startTime = Date.now();

        for (const lang of languages) {
            const filePath = path.join(dataDir, `series_${lang}.json`);
            try {
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath, 'utf-8');
                    const entries: HarvestedEntry[] = JSON.parse(data);

                    // Indexar cada entrada
                    this.indexedData[lang] = entries.map((entry, idx) => {
                        const labelLower = (entry.label || '').toLowerCase();
                        const abstractLower = (entry.abstract || '').toLowerCase();

                        // Extraer palabras clave del label
                        const keywords = this.extractKeywords(labelLower);

                        // Agregar al índice invertido
                        keywords.forEach(keyword => {
                            if (!this.keywordIndex[lang].has(keyword)) {
                                this.keywordIndex[lang].set(keyword, new Set());
                            }
                            this.keywordIndex[lang].get(keyword)!.add(idx);
                        });

                        return {
                            ...entry,
                            labelLower,
                            abstractLower,
                            keywords,
                        };
                    });

                    this.logger.log(`Indexed ${this.indexedData[lang].length} entries for ${lang.toUpperCase()}`);
                } else {
                    this.logger.warn(`Offline data file not found: ${filePath}`);
                }
            } catch (error) {
                this.logger.error(`Failed to load offline data for ${lang}: ${error.message}`);
            }
        }

        const totalEntries = Object.values(this.indexedData).reduce((sum, arr) => sum + arr.length, 0);
        const elapsed = Date.now() - startTime;
        this.logger.log(`Indexed ${totalEntries} total entries in ${elapsed}ms`);
    }

    /**
     * Extraer palabras clave de un texto
     */
    private extractKeywords(text: string): string[] {
        return text
            .split(/[\s\-_:,.()\[\]]+/)
            .filter(word => word.length >= 3)
            .slice(0, 10); // Limitar a 10 palabras clave por entrada
    }

    /**
     * Búsqueda optimizada en datos offline usando índice invertido
     */
    private searchOfflineData(query: string, language: string): any[] {
        const data = this.indexedData[language] || [];
        if (data.length === 0) return [];

        const queryLower = query.toLowerCase();
        const queryWords = this.extractKeywords(queryLower);

        // Buscar usando índice invertido para palabras exactas
        const candidateIndices = new Set<number>();

        for (const word of queryWords) {
            const indices = this.keywordIndex[language].get(word);
            if (indices) {
                indices.forEach(idx => candidateIndices.add(idx));
            }
        }

        // Si hay candidatos del índice, filtrar entre ellos
        let results: IndexedEntry[];

        if (candidateIndices.size > 0) {
            // Buscar solo entre candidatos (mucho más rápido)
            results = Array.from(candidateIndices)
                .map(idx => data[idx])
                .filter(entry =>
                    entry.labelLower.includes(queryLower) ||
                    entry.abstractLower.includes(queryLower)
                );
        } else {
            // Fallback: búsqueda lineal para queries sin palabras exactas
            results = data.filter(entry =>
                entry.labelLower.includes(queryLower) ||
                entry.abstractLower.includes(queryLower)
            );
        }

        // Ordenar por relevancia (coincidencia en label primero)
        results.sort((a, b) => {
            const aLabelMatch = a.labelLower.includes(queryLower) ? 1 : 0;
            const bLabelMatch = b.labelLower.includes(queryLower) ? 1 : 0;
            return bLabelMatch - aLabelMatch;
        });

        return results.slice(0, 20).map(entry => ({
            uri: entry.uri,
            label: entry.label,
            abstract: entry.abstract,
            type: entry.genre || '',
            resource: entry.resource || entry.uri,
        }));
    }

    private getEndpoint(language: string): string {
        return this.DBPEDIA_ENDPOINTS[language] || this.DBPEDIA_ENDPOINTS['en'];
    }

    /**
     * Búsqueda con fallback automático (online -> cache DB -> offline JSON)
     */
    async searchWithFallback(query: string, language: string = 'es'): Promise<DBpediaSearchResult> {
        const startTime = Date.now();
        this.logger.log(`Searching for: "${query}" in language: ${language}`);

        // 1. Intentar búsqueda online primero (con timeout corto)
        try {
            const onlineResults = await this.searchDBpediaOnline(query, language);

            // Guardar en caché para uso futuro
            await this.saveToCache(query, onlineResults, language);

            const elapsed = Date.now() - startTime;
            this.logger.log(`Online search completed in ${elapsed}ms`);

            return {
                source: 'online',
                results: onlineResults,
                cached: false,
                verified: true,
                timestamp: new Date(),
                language,
            };
        } catch (error) {
            this.logger.warn(`Online search failed: ${error.message}`);

            // 2. Buscar en caché de base de datos
            const cachedResults = await this.searchCache(query, language);

            if (cachedResults && cachedResults.results?.length > 0) {
                const elapsed = Date.now() - startTime;
                this.logger.log(`Cache search completed in ${elapsed}ms`);

                return {
                    source: 'cache',
                    results: cachedResults.results,
                    cached: true,
                    verified: cachedResults.verified,
                    timestamp: cachedResults.createdAt,
                    language,
                };
            }

            // 3. Buscar en datos offline (más rápido ahora con índice)
            const offlineStart = Date.now();
            const offlineResults = this.searchOfflineData(query, language);
            const offlineElapsed = Date.now() - offlineStart;

            if (offlineResults.length > 0) {
                this.logger.log(`Offline search found ${offlineResults.length} results in ${offlineElapsed}ms`);
                return {
                    source: 'offline',
                    results: offlineResults,
                    cached: true,
                    verified: false,
                    timestamp: new Date(),
                    language,
                };
            }

            throw new Error('No results found online, in cache, or offline');
        }
    }

    private async searchDBpediaOnline(query: string, language: string = 'es'): Promise<any[]> {
        const sparqlQuery = this.buildSPARQLQuery(query, language);
        const endpoint = this.getEndpoint(language);

        try {
            const response = await firstValueFrom(
                this.httpService.get(endpoint, {
                    params: {
                        query: sparqlQuery,
                        format: 'json',
                    },
                    timeout: this.DBPEDIA_TIMEOUT,
                })
            );

            return this.parseDBpediaResults(response.data);
        } catch (error) {
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                throw new Error('DBpedia request timeout');
            }
            throw error;
        }
    }

    private buildSPARQLQuery(query: string, language: string = 'es'): string {
        const escapedQuery = query.replace(/"/g, '\\"');

        return `
      PREFIX dbo: <http://dbpedia.org/ontology/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT DISTINCT ?resource ?label ?abstract ?type
      WHERE {
        ?resource rdfs:label ?label .
        FILTER(regex(?label, "${escapedQuery}", "i"))
        FILTER(lang(?label) = '${language}' || lang(?label) = '')
        OPTIONAL { 
          ?resource dbo:abstract ?abstract .
          FILTER(lang(?abstract) = '${language}' || lang(?abstract) = '')
        }
        OPTIONAL { ?resource rdf:type ?type }
      }
      LIMIT 10
    `;
    }

    private parseDBpediaResults(data: any): any[] {
        if (!data?.results?.bindings) return [];

        return data.results.bindings.map((binding: any) => ({
            uri: binding.resource?.value || '',
            label: binding.label?.value || '',
            abstract: binding.abstract?.value || '',
            type: binding.type?.value || '',
            resource: binding.resource?.value || '',
        }));
    }

    private async saveToCache(query: string, results: any[], language: string = 'es'): Promise<void> {
        try {
            const category = this.detectCategory(query, results);
            const cacheKey = `${query}_${language}`;

            await this.prisma.dBpediaCache.upsert({
                where: { query: cacheKey },
                create: {
                    query: cacheKey,
                    results: results as any,
                    category,
                    verified: true,
                    confidence: 1.0,
                    lastVerified: new Date(),
                },
                update: {
                    results: results as any,
                    verified: true,
                    lastVerified: new Date(),
                    updatedAt: new Date(),
                },
            });
        } catch (error) {
            this.logger.error(`Failed to cache results: ${error.message}`);
        }
    }

    private async searchCache(query: string, language: string = 'es'): Promise<any | null> {
        try {
            const cacheKey = `${query}_${language}`;
            let cached = await this.prisma.dBpediaCache.findUnique({
                where: { query: cacheKey },
            });

            if (!cached) {
                cached = await this.prisma.dBpediaCache.findFirst({
                    where: {
                        query: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    orderBy: { lastVerified: 'desc' },
                });
            }

            return cached;
        } catch (error) {
            this.logger.error(`Cache search failed: ${error.message}`);
            return null;
        }
    }

    private detectCategory(query: string, results: any[]): string {
        const lowerQuery = query.toLowerCase();
        const tvKeywords = ['series', 'show', 'tv', 'television', 'episode', 'season'];

        if (tvKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'tv_series';
        }

        if (results.length > 0) {
            const firstType = results[0].type?.toLowerCase() || '';
            if (firstType.includes('televisionshow') || firstType.includes('series')) {
                return 'tv_series';
            }
            if (firstType.includes('person')) return 'person';
            if (firstType.includes('organization')) return 'organization';
        }

        return 'other';
    }

    async verifyEntry(id: string, language: string = 'es'): Promise<boolean> {
        try {
            const entry = await this.prisma.dBpediaCache.findUnique({
                where: { id },
            });

            if (!entry) return false;

            const originalQuery = entry.query.replace(/_[a-z]{2}$/, '');
            const freshResults = await this.searchDBpediaOnline(originalQuery, language);
            const isValid = this.compareResults(entry.results as any[], freshResults);

            await this.prisma.dBpediaCache.update({
                where: { id },
                data: {
                    verified: isValid,
                    lastVerified: new Date(),
                    results: isValid ? (freshResults as any) : entry.results,
                },
            });

            return isValid;
        } catch (error) {
            this.logger.error(`Verification failed: ${error.message}`);
            return false;
        }
    }

    private compareResults(cached: any[], fresh: any[]): boolean {
        if (cached.length === 0 && fresh.length === 0) return true;
        if (Math.abs(cached.length - fresh.length) > 3) return false;

        const cachedUris = cached.slice(0, 3).map(r => r.uri);
        const freshUris = fresh.slice(0, 3).map(r => r.uri);
        const matches = cachedUris.filter(uri => freshUris.includes(uri)).length;

        return matches >= 2;
    }

    async getCacheStats() {
        const total = await this.prisma.dBpediaCache.count();
        const verified = await this.prisma.dBpediaCache.count({
            where: { verified: true },
        });
        const byCategory = await this.prisma.dBpediaCache.groupBy({
            by: ['category'],
            _count: true,
        });

        const offlineStats = {
            en: this.indexedData['en'].length,
            es: this.indexedData['es'].length,
            pt: this.indexedData['pt'].length,
            total: Object.values(this.indexedData).reduce((sum, arr) => sum + arr.length, 0),
        };

        return {
            cache: {
                total,
                verified,
                unverified: total - verified,
                byCategory: byCategory.map(c => ({
                    category: c.category,
                    count: c._count,
                })),
            },
            offline: offlineStats,
        };
    }
}
