import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// Diccionario manual de series populares (OFFLINE)
const TV_SHOWS_DICTIONARY = {
    // Inglés -> Español
    'the money heist': 'la casa de papel',
    'money heist': 'la casa de papel',
    'breaking bad': 'breaking bad',
    'game of thrones': 'juego de tronos',
    'stranger things': 'stranger things',
    'the walking dead': 'los muertos vivientes',
    'the crown': 'the crown',
    'narcos': 'narcos',
    'dark': 'dark',
    'the witcher': 'el brujo',
    'peaky blinders': 'peaky blinders',
    'black mirror': 'black mirror',
    'the mandalorian': 'el mandaloriano',
    'the boys': 'the boys',
    'westworld': 'westworld',
    'the office': 'la oficina',
    'friends': 'friends',
    'how i met your mother': 'cómo conocí a vuestra madre',
    'the big bang theory': 'la teoría del big bang',
    'sherlock': 'sherlock',
    'doctor who': 'doctor who',
    'house of cards': 'house of cards',
    'orange is the new black': 'orange is the new black',
    'vikings': 'vikingos',
    'the handmaid\'s tale': 'el cuento de la criada',
    'chernobyl': 'chernobyl',
    'the umbrella academy': 'the umbrella academy',
    'lucifer': 'lucifer',
    'the flash': 'the flash',
    'arrow': 'arrow',
    'supergirl': 'supergirl',
    'riverdale': 'riverdale',
    '13 reasons why': 'por trece razones',
    'elite': 'élite',
    'la casa de papel': 'the money heist',
    'el marginal': 'the marginal',
    'el reino': 'the kingdom',
    'el ministerio del tiempo': 'the ministry of time',
    // Agregar más según necesites
};

export interface TranslationResult {
    original: string;
    translated: string;
    sourceLang: string;
    targetLang: string;
    source: 'dictionary' | 'cache' | 'libretranslate';
}

@Injectable()
export class TranslationService {
    private readonly logger = new Logger(TranslationService.name);
    private readonly LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5001';

    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
    ) { }

    /**
     * Traducir texto con sistema híbrido
     * 1. Buscar en diccionario manual (offline)
     * 2. Buscar en caché
     * 3. Usar LibreTranslate (online)
     */
    async translate(text: string, targetLang: 'en' | 'es' = 'es'): Promise<TranslationResult> {
        const normalizedText = text.toLowerCase().trim();

        // 1. Buscar en diccionario manual (OFFLINE)
        const dictionaryResult = this.searchDictionary(normalizedText, targetLang);
        if (dictionaryResult) {
            this.logger.log(`Dictionary hit: "${text}" -> "${dictionaryResult}"`);
            return {
                original: text,
                translated: dictionaryResult,
                sourceLang: targetLang === 'es' ? 'en' : 'es',
                targetLang,
                source: 'dictionary',
            };
        }

        // 2. Buscar en caché (OFFLINE)
        const cachedResult = await this.searchCache(text, targetLang);
        if (cachedResult) {
            this.logger.log(`Cache hit: "${text}" -> "${cachedResult.translatedText}"`);
            return {
                original: text,
                translated: cachedResult.translatedText,
                sourceLang: cachedResult.sourceLang,
                targetLang,
                source: 'cache',
            };
        }

        // 3. Usar LibreTranslate (ONLINE)
        try {
            const translated = await this.translateWithLibreTranslate(text, targetLang);

            // Guardar en caché para próxima vez
            await this.saveToCache(text, translated, 'auto', targetLang, 'libretranslate');

            this.logger.log(`LibreTranslate: "${text}" -> "${translated}"`);
            return {
                original: text,
                translated,
                sourceLang: 'auto',
                targetLang,
                source: 'libretranslate',
            };
        } catch (error) {
            this.logger.warn(`Translation failed: ${error.message}`);
            // Si falla, devolver texto original
            return {
                original: text,
                translated: text,
                sourceLang: 'auto',
                targetLang,
                source: 'dictionary',
            };
        }
    }

    /**
     * Traducir a múltiples idiomas (para búsqueda multiidioma)
     */
    async translateToMultipleLanguages(text: string): Promise<string[]> {
        const results: string[] = [text]; // Incluir texto original

        try {
            // Traducir a español
            const esResult = await this.translate(text, 'es');
            if (esResult.translated !== text) {
                results.push(esResult.translated);
            }

            // Traducir a inglés
            const enResult = await this.translate(text, 'en');
            if (enResult.translated !== text) {
                results.push(enResult.translated);
            }

            // Eliminar duplicados
            return [...new Set(results)];
        } catch (error) {
            this.logger.error(`Multi-language translation failed: ${error.message}`);
            return results;
        }
    }

    /**
     * Buscar en diccionario manual
     */
    private searchDictionary(text: string, targetLang: string): string | null {
        const normalized = text.toLowerCase().trim();

        if (targetLang === 'es') {
            // Buscar traducción al español
            return TV_SHOWS_DICTIONARY[normalized] || null;
        } else {
            // Buscar traducción al inglés (invertir diccionario)
            const entry = Object.entries(TV_SHOWS_DICTIONARY).find(
                ([_, value]) => value === normalized
            );
            return entry ? entry[0] : null;
        }
    }

    /**
     * Buscar en caché de base de datos
     */
    private async searchCache(text: string, targetLang: string): Promise<any | null> {
        try {
            return await this.prisma.translationCache.findUnique({
                where: {
                    originalText_targetLang: {
                        originalText: text,
                        targetLang,
                    },
                },
            });
        } catch (error) {
            this.logger.error(`Cache search failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Traducir usando LibreTranslate
     */
    private async translateWithLibreTranslate(text: string, targetLang: string): Promise<string> {
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.LIBRETRANSLATE_URL}/translate`, {
                    q: text,
                    source: 'auto',
                    target: targetLang,
                    format: 'text',
                }, {
                    timeout: 5000,
                })
            );

            return response.data.translatedText || text;
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('LibreTranslate service not available');
            }
            throw error;
        }
    }

    /**
     * Guardar traducción en caché
     */
    private async saveToCache(
        originalText: string,
        translatedText: string,
        sourceLang: string,
        targetLang: string,
        source: string,
    ): Promise<void> {
        try {
            await this.prisma.translationCache.upsert({
                where: {
                    originalText_targetLang: {
                        originalText,
                        targetLang,
                    },
                },
                create: {
                    originalText,
                    translatedText,
                    sourceLang,
                    targetLang,
                    source,
                },
                update: {
                    translatedText,
                    sourceLang,
                    source,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to save translation to cache: ${error.message}`);
        }
    }

    /**
     * Detectar idioma del texto
     */
    async detectLanguage(text: string): Promise<string> {
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.LIBRETRANSLATE_URL}/detect`, {
                    q: text,
                }, {
                    timeout: 3000,
                })
            );

            return response.data[0]?.language || 'auto';
        } catch (error) {
            // Si falla, intentar detectar manualmente
            const hasSpanishChars = /[áéíóúñü]/i.test(text);
            return hasSpanishChars ? 'es' : 'en';
        }
    }

    /**
     * Obtener estadísticas de caché
     */
    async getCacheStats() {
        const total = await this.prisma.translationCache.count();
        const bySource = await this.prisma.translationCache.groupBy({
            by: ['source'],
            _count: true,
        });

        return {
            total,
            dictionary: TV_SHOWS_DICTIONARY ? Object.keys(TV_SHOWS_DICTIONARY).length : 0,
            bySource: bySource.map(s => ({
                source: s.source,
                count: s._count,
            })),
        };
    }
}
