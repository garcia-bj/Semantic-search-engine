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

@Injectable()
export class DBpediaCacheService implements OnModuleInit {
    private readonly logger = new Logger(DBpediaCacheService.name);
    private readonly DBPEDIA_TIMEOUT = 8000; // 8 segundos

    // Endpoints por idioma
    private readonly DBPEDIA_ENDPOINTS: Record<string, string> = {
        'es': 'https://es.dbpedia.org/sparql',
        'en': 'https://dbpedia.org/sparql',
        'pt': 'https://dbpedia.org/sparql', // pt.dbpedia.org is often down
    };

    // Datos offline cargados en memoria
    private offlineData: Record<string, HarvestedEntry[]> = {
        'en': [],
        'es': [],
        'pt': [],
    };

    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
    ) { }

    /**
     * Cargar datos offline al iniciar el módulo
     */
    async onModuleInit() {
        await this.loadOfflineData();
    }

    /**
     * Cargar archivos JSON de datos harvested
     */
    private async loadOfflineData() {
        // Usar process.cwd() para obtener la raíz del proyecto
        const dataDir = path.join(process.cwd(), 'harvested_data');
        const languages = ['en', 'es', 'pt'];

        for (const lang of languages) {
            const filePath = path.join(dataDir, `series_${lang}.json`);
            try {
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath, 'utf-8');
                    this.offlineData[lang] = JSON.parse(data);
                    this.logger.log(`Loaded ${this.offlineData[lang].length} offline entries for ${lang.toUpperCase()}`);
                } else {
                    this.logger.warn(`Offline data file not found: ${filePath}`);
                }
            } catch (error) {
                this.logger.error(`Failed to load offline data for ${lang}: ${error.message}`);
            }
        }

        const totalEntries = Object.values(this.offlineData).reduce((sum, arr) => sum + arr.length, 0);
        this.logger.log(`Total offline knowledge base: ${totalEntries} entries`);
    }

    /**
     * Buscar en datos offline locales
     */
    private searchOfflineData(query: string, language: string): any[] {
        const data = this.offlineData[language] || [];
        const queryLower = query.toLowerCase();

        const results = data.filter(entry => {
            const labelMatch = entry.label?.toLowerCase().includes(queryLower);
            const abstractMatch = entry.abstract?.toLowerCase().includes(queryLower);
            return labelMatch || abstractMatch;
        }).slice(0, 20); // Limitar a 20 resultados

        return results.map(entry => ({
            uri: entry.uri,
            label: entry.label,
            abstract: entry.abstract,
            type: entry.genre || '',
            resource: entry.resource || entry.uri,
        }));
    }

    /**
     * Obtener endpoint según idioma
     */
    private getEndpoint(language: string): string {
        return this.DBPEDIA_ENDPOINTS[language] || this.DBPEDIA_ENDPOINTS['en'];
    }

    /**
     * Búsqueda con fallback automático (online -> cache DB -> offline JSON)
     */
    async searchWithFallback(query: string, language: string = 'es'): Promise<DBpediaSearchResult> {
        this.logger.log(`Searching for: "${query}" in language: ${language}`);

        // 1. Intentar búsqueda online primero
        try {
            const onlineResults = await this.searchDBpediaOnline(query, language);

            // Guardar en caché para uso futuro (con clave que incluye idioma)
            await this.saveToCache(query, onlineResults, language);

            return {
                source: 'online',
                results: onlineResults,
                cached: false,
                verified: true,
                timestamp: new Date(),
                language,
            };
        } catch (error) {
            this.logger.warn(`Online search failed: ${error.message}, trying cache...`);

            // 2. Usar caché de base de datos si falla la búsqueda online
            const cachedResults = await this.searchCache(query, language);

            if (cachedResults && cachedResults.results?.length > 0) {
                return {
                    source: 'cache',
                    results: cachedResults.results,
                    cached: true,
                    verified: cachedResults.verified,
                    timestamp: cachedResults.createdAt,
                    language,
                };
            }

            // 3. Buscar en datos offline (JSON harvested)
            this.logger.log(`Searching offline data for: "${query}"`);
            const offlineResults = this.searchOfflineData(query, language);

            if (offlineResults.length > 0) {
                this.logger.log(`Found ${offlineResults.length} results in offline data`);
                return {
                    source: 'offline',
                    results: offlineResults,
                    cached: true,
                    verified: false, // No verificado porque no hay conexión
                    timestamp: new Date(),
                    language,
                };
            }

            // 4. No hay resultados en ninguna fuente
            throw new Error('No results found online, in cache, or offline');
        }
    }

    /**
     * Búsqueda en DBpedia con timeout
     */
    private async searchDBpediaOnline(query: string, language: string = 'es'): Promise<any[]> {
        const sparqlQuery = this.buildSPARQLQuery(query, language);
        const endpoint = this.getEndpoint(language);

        this.logger.log(`Using DBpedia endpoint: ${endpoint}`);

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

    /**
     * Construir query SPARQL para DBpedia
     */
    private buildSPARQLQuery(query: string, language: string = 'es'): string {
        const escapedQuery = query.replace(/"/g, '\\"');

        return `
      PREFIX dbo: <http://dbpedia.org/ontology/>
      PREFIX dbr: <http://dbpedia.org/resource/>
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

    /**
     * Parsear resultados de DBpedia
     */
    private parseDBpediaResults(data: any): any[] {
        if (!data?.results?.bindings) return [];

        return data.results.bindings.map((binding: any) => ({
            uri: binding.resource?.value || '',
            label: binding.label?.value || '',
            abstract: binding.abstract?.value || '',
            type: binding.type?.value || '',
            resource: binding.resource?.value || '', // Agregar para compatibilidad con frontend
        }));
    }

    /**
     * Guardar resultados en caché
     */
    private async saveToCache(query: string, results: any[], language: string = 'es'): Promise<void> {
        try {
            const category = this.detectCategory(query, results);
            // Usar query + idioma como clave única
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

            this.logger.log(`Cached results for: "${query}" (${language})`);
        } catch (error) {
            this.logger.error(`Failed to cache results: ${error.message}`);
        }
    }

    /**
     * Buscar en caché local
     */
    private async searchCache(query: string, language: string = 'es'): Promise<any | null> {
        try {
            // Búsqueda exacta con idioma
            const cacheKey = `${query}_${language}`;
            let cached = await this.prisma.dBpediaCache.findUnique({
                where: { query: cacheKey },
            });

            // Si no hay coincidencia exacta, buscar similar
            if (!cached) {
                cached = await this.prisma.dBpediaCache.findFirst({
                    where: {
                        query: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    orderBy: {
                        lastVerified: 'desc',
                    },
                });
            }

            if (cached) {
                this.logger.log(`Cache hit for: "${query}" (${language})`);
            }

            return cached;
        } catch (error) {
            this.logger.error(`Cache search failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Detectar categoría del resultado
     */
    private detectCategory(query: string, results: any[]): string {
        const lowerQuery = query.toLowerCase();

        // Palabras clave para series de TV
        const tvKeywords = ['series', 'show', 'tv', 'television', 'episode', 'season'];
        if (tvKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'tv_series';
        }

        // Detectar por tipo de resultado
        if (results.length > 0) {
            const firstType = results[0].type?.toLowerCase() || '';
            if (firstType.includes('televisionshow') || firstType.includes('series')) {
                return 'tv_series';
            }
            if (firstType.includes('person')) {
                return 'person';
            }
            if (firstType.includes('organization')) {
                return 'organization';
            }
        }

        return 'other';
    }

    /**
     * Verificar entrada de caché contra DBpedia
     */
    async verifyEntry(id: string, language: string = 'es'): Promise<boolean> {
        try {
            const entry = await this.prisma.dBpediaCache.findUnique({
                where: { id },
            });

            if (!entry) return false;

            // Extraer query original sin el sufijo de idioma
            const originalQuery = entry.query.replace(/_[a-z]{2}$/, '');

            // Buscar en DBpedia
            const freshResults = await this.searchDBpediaOnline(originalQuery, language);

            // Comparar resultados (simple: comparar cantidad y primeros URIs)
            const isValid = this.compareResults(entry.results as any[], freshResults);

            // Actualizar estado de verificación
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

    /**
     * Comparar resultados para verificación
     */
    private compareResults(cached: any[], fresh: any[]): boolean {
        if (cached.length === 0 && fresh.length === 0) return true;
        if (Math.abs(cached.length - fresh.length) > 3) return false;

        // Comparar primeros 3 URIs
        const cachedUris = cached.slice(0, 3).map(r => r.uri);
        const freshUris = fresh.slice(0, 3).map(r => r.uri);

        const matches = cachedUris.filter(uri => freshUris.includes(uri)).length;

        // Al menos 2 de 3 deben coincidir
        return matches >= 2;
    }

    /**
     * Obtener estadísticas de caché y datos offline
     */
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
            en: this.offlineData['en'].length,
            es: this.offlineData['es'].length,
            pt: this.offlineData['pt'].length,
            total: Object.values(this.offlineData).reduce((sum, arr) => sum + arr.length, 0),
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
