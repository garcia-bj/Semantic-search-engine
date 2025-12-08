import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
const { Translate } = require('@google-cloud/translate').v2;

// Diccionario manual de traducciones (OFFLINE)
const TRANSLATION_DICTIONARY = {
    // ===== PALABRAS COMUNES =====

    // Español -> Inglés (palabras comunes)
    'un grupo de ladrones organiza un gran atraco en españa': 'a group of thieves organizes a great heist in spain',
    'grupo de ladrones': 'group of thieves',
    'atraco': 'heist',
    'ladrones': 'thieves',
    'ladrón': 'thief',
    'finalizada': 'finished',
    'acción': 'action',
    'español': 'spanish',
    'serie de televisión': 'tv series',
    'temporadas': 'seasons',
    'episodios': 'episodes',
    'descripción': 'description',
    'título': 'title',
    'género': 'genre',
    'drama': 'drama',
    'comedia': 'comedy',
    'suspenso': 'thriller',
    'ciencia ficción': 'science fiction',
    'fantasía': 'fantasy',
    'terror': 'horror',
    'aventura': 'adventure',
    'crimen': 'crime',
    'misterio': 'mystery',
    'romance': 'romance',
    'documental': 'documentary',

    // Inglés -> Español (palabras comunes)
    'a group of thieves organizes a great heist in spain': 'un grupo de ladrones organiza un gran atraco en españa',
    'group of thieves': 'grupo de ladrones',
    'heist': 'atraco',
    'thieves': 'ladrones',
    'thief': 'ladrón',
    'finished': 'finalizada',
    'action': 'acción',
    'spanish': 'español',
    'tv series': 'serie de televisión',
    'seasons': 'temporadas',
    'episodes': 'episodios',
    'description': 'descripción',
    'title': 'título',
    'genre': 'género',
    'comedy': 'comedia',
    'thriller': 'suspenso',
    'science fiction': 'ciencia ficción',
    'fantasy': 'fantasía',
    'horror': 'terror',
    'adventure': 'aventura',
    'crime': 'crimen',
    'mystery': 'misterio',
    'documentary': 'documental',

    // Portugués -> Español (palabras comunes)
    'um grupo de ladrões organiza um grande assalto na espanha': 'un grupo de ladrones organiza un gran atraco en españa',
    'grupo de ladrões': 'grupo de ladrones',
    'assalto': 'atraco',
    'ladrões': 'ladrones',
    'ladrão': 'ladrón',
    'finalizado': 'finalizada',
    'ação': 'acción',
    'espanhol': 'español',
    'série de televisão': 'serie de televisión',
    'episódios': 'episodios',
    'descrição': 'descripción',
    'gênero': 'género',

    // ===== SERIES DE TV =====

    // Inglés -> Español
    'the money heist': 'la casa de papel',
    'money heist': 'la casa de papel',
    'game of thrones': 'juego de tronos',
    'the walking dead': 'los muertos vivientes',
    'the witcher': 'el brujo',
    'the mandalorian': 'el mandaloriano',
    'the office': 'la oficina',
    'how i met your mother': 'cómo conocí a vuestra madre',
    'the big bang theory': 'la teoría del big bang',
    'the handmaid\'s tale': 'el cuento de la criada',
    '13 reasons why': 'por trece razones',

    // Español -> Inglés
    'la casa de papel': 'the money heist',
    'el marginal': 'the marginal',
    'el reino': 'the kingdom',
    'el ministerio del tiempo': 'the ministry of time',
    'juego de tronos': 'game of thrones',
    'los muertos vivientes': 'the walking dead',
    'el brujo': 'the witcher',
    'el mandaloriano': 'the mandalorian',
    'la oficina': 'the office',
    'cómo conocí a vuestra madre': 'how i met your mother',
    'la teoría del big bang': 'the big bang theory',
    'el cuento de la criada': 'the handmaid\'s tale',
    'por trece razones': '13 reasons why',
    'vikingos': 'vikings',
    'élite': 'elite',

    // Portugués -> Español
    'o roubo de dinheiro': 'la casa de papel',
    'a casa de papel': 'la casa de papel',
    'a guerra dos tronos': 'juego de tronos',
    'os mortos-vivos': 'los muertos vivientes',
    'o bruxo': 'el brujo',
    'o mandaloriano': 'el mandaloriano',
    'o escritório': 'la oficina',
    'lúcifer': 'lucifer',

    // Series que se mantienen igual
    'breaking bad': 'breaking bad',
    'stranger things': 'stranger things',
    'the crown': 'the crown',
    'narcos': 'narcos',
    'dark': 'dark',
    'peaky blinders': 'peaky blinders',
    'black mirror': 'black mirror',
    'the boys': 'the boys',
    'westworld': 'westworld',
    'friends': 'friends',
    'sherlock': 'sherlock',
    'doctor who': 'doctor who',
    'house of cards': 'house of cards',
    'orange is the new black': 'orange is the new black',
    'vikings': 'vikings',
    'chernobyl': 'chernobyl',
    'the umbrella academy': 'the umbrella academy',
    'lucifer': 'lucifer',
    'the flash': 'the flash',
    'arrow': 'arrow',
    'supergirl': 'supergirl',
    'riverdale': 'riverdale',
    'elite': 'elite',
};

// Diccionario específico para traducciones al Portugués
const PORTUGUESE_DICTIONARY: { [key: string]: string } = {
    // Español -> Portugués (palabras comunes)
    'finalizada': 'finalizado',
    'acción': 'ação',
    'español': 'espanhol',
    'españa': 'espanha',
    'descripción': 'descrição',
    'título': 'título',
    'género': 'gênero',
    'drama': 'drama',
    'comedia': 'comédia',
    'suspenso': 'suspense',
    'ciencia ficción': 'ficção científica',
    'fantasía': 'fantasia',
    'terror': 'terror',
    'aventura': 'aventura',
    'crimen': 'crime',
    'misterio': 'mistério',
    'documental': 'documentário',
    'romance': 'romance',
    'temporadas': 'temporadas',
    'episodios': 'episódios',
    'serie de televisión': 'série de televisão',
    'estados unidos': 'estados unidos',
    'en emision': 'em exibição',
    'inglés': 'inglês',

    // Español -> Portugués (títulos de series)
    'juego de tronos': 'a guerra dos tronos',
    'la casa de papel': 'a casa de papel',
    'los muertos vivientes': 'os mortos-vivos',
    'el brujo': 'o bruxo',
    'el mandaloriano': 'o mandaloriano',
    'la oficina': 'o escritório',
    'la teoría del big bang': 'a teoria do big bang',
    'cómo conocí a vuestra madre': 'como conheci vossa mãe',
    'el cuento de la criada': 'o conto da ama',
    'por trece razones': 'os 13 porquês',
    'game of thrones': 'a guerra dos tronos',

    // Descripciones comunes
    'un grupo de ladrones organiza un gran atraco en españa': 'um grupo de ladrões organiza um grande assalto na espanha',
    'grupo de ladrones': 'grupo de ladrões',
    'atraco': 'assalto',
    'ladrones': 'ladrões',
    'ladrón': 'ladrão',
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
    private readonly translateClient: any;

    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
    ) {
        // Inicializar Google Translate si hay API key
        if (process.env.GOOGLE_TRANSLATE_API_KEY) {
            this.translateClient = new Translate({
                key: process.env.GOOGLE_TRANSLATE_API_KEY
            });
            this.logger.log('Google Translate API initialized');
        } else {
            this.translateClient = null;
            this.logger.warn('Google Translate API key not found. Translation will use dictionary and cache only.');
        }
    }

    /**
     * Traducir texto con sistema híbrido
     * 1. Buscar en diccionario manual (offline)
     * 2. Buscar en caché
     * 3. Usar Google Translate (online)
     */
    async translate(text: string, targetLang: 'en' | 'es' | 'pt' = 'es'): Promise<TranslationResult> {
        const normalizedText = text.toLowerCase().trim();

        // Para traducciones a portugués, buscar primero en diccionario portugués
        if (targetLang === 'pt') {
            // Buscar en diccionario portugués
            const ptDictResult = PORTUGUESE_DICTIONARY[normalizedText];
            if (ptDictResult) {
                this.logger.log(`Portuguese dictionary hit: "${text}" -> "${ptDictResult}"`);
                return {
                    original: text,
                    translated: ptDictResult,
                    sourceLang: 'es',
                    targetLang,
                    source: 'dictionary',
                };
            }
            // Si no está en diccionario portugués, ir a Google Translate
        } else {
            // 1. Buscar en diccionario manual (OFFLINE) - solo para EN/ES
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

            // 2. Buscar en caché (OFFLINE) - solo para EN/ES
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
        }

        // 3. Usar Google Translate (ONLINE)
        if (this.translateClient) {
            try {
                const translated = await this.translateWithGoogle(text, targetLang);

                // Guardar en caché solo para inglés/español
                if (targetLang !== 'pt') {
                    await this.saveToCache(text, translated, 'auto', targetLang, 'google');
                }

                this.logger.log(`Google Translate: "${text}" -> "${translated}"`);
                return {
                    original: text,
                    translated,
                    sourceLang: 'auto',
                    targetLang,
                    source: 'dictionary',
                };
            } catch (error) {
                this.logger.warn(`Google Translate failed: ${error.message}`);
            }
        }

        // Si todo falla, devolver texto original
        this.logger.warn(`No translation available for: "${text}"`);
        return {
            original: text,
            translated: text,
            sourceLang: 'auto',
            targetLang,
            source: 'dictionary',
        };
    }

    /**
     * Traducir a múltiples idiomas (para búsqueda multiidioma)
     */
    async translateToMultipleLanguages(text: string): Promise<string[]> {
        const results: string[] = [text]; // Incluir texto original

        try {
            // Traducir a español (con manejo de errores individual)
            try {
                const esResult = await this.translate(text, 'es');
                if (esResult.translated !== text && esResult.translated) {
                    results.push(esResult.translated);
                }
            } catch (error) {
                this.logger.warn(`Spanish translation failed: ${error.message}`);
            }

            // Traducir a inglés (con manejo de errores individual)
            try {
                const enResult = await this.translate(text, 'en');
                if (enResult.translated !== text && enResult.translated) {
                    results.push(enResult.translated);
                }
            } catch (error) {
                this.logger.warn(`English translation failed: ${error.message}`);
            }

            // Traducir a portugués (con manejo de errores individual)
            try {
                const ptResult = await this.translate(text, 'pt');
                if (ptResult.translated !== text && ptResult.translated) {
                    results.push(ptResult.translated);
                }
            } catch (error) {
                this.logger.warn(`Portuguese translation failed: ${error.message}`);
            }

            // Eliminar duplicados
            return [...new Set(results)];
        } catch (error) {
            this.logger.error(`Multi-language translation failed: ${error.message}`);
            // Siempre devolver al menos el texto original
            return [text];
        }
    }

    /**
     * Buscar en diccionario manual
     */
    private searchDictionary(text: string, targetLang: string): string | null {
        const normalized = text.toLowerCase().trim();

        // Para traducciones a portugués, usar Google Translate en lugar del diccionario
        // ya que el diccionario actual está optimizado para español↔inglés
        if (targetLang === 'pt') {
            return null; // Dejar que Google Translate maneje las traducciones al portugués
        }

        // Buscar directamente en el diccionario (coincidencia exacta)
        const directMatch = TRANSLATION_DICTIONARY[normalized];
        if (directMatch) {
            return directMatch;
        }

        // Solo buscar coincidencias parciales para textos cortos (palabras sueltas)
        // No usar coincidencias parciales para textos largos (descripciones)
        if (normalized.length <= 50) {
            for (const [key, value] of Object.entries(TRANSLATION_DICTIONARY)) {
                // Solo coincidir si la clave es una palabra completa dentro del texto
                const wordBoundaryRegex = new RegExp(`\\b${key}\\b`, 'i');
                if (wordBoundaryRegex.test(normalized) && key.length > 3) {
                    return value;
                }
            }
        }

        return null;
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
     * Traducir usando Google Translate API
     */
    private async translateWithGoogle(text: string, targetLang: string): Promise<string> {
        if (!this.translateClient) {
            throw new Error('Google Translate client not initialized');
        }

        try {
            const [translation] = await this.translateClient.translate(text, targetLang);
            return translation;
        } catch (error) {
            this.logger.error(`Google Translate API error: ${error.message}`);
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
     * Detectar idioma del texto (simple heurística)
     */
    async detectLanguage(text: string): Promise<string> {
        // Detectar basándose en caracteres especiales
        const hasSpanishChars = /[áéíóúñü]/i.test(text);
        const hasPortugueseChars = /[ãõâêôç]/i.test(text);

        if (hasPortugueseChars) return 'pt';
        if (hasSpanishChars) return 'es';
        return 'en';
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
            dictionary: TRANSLATION_DICTIONARY ? Object.keys(TRANSLATION_DICTIONARY).length : 0,
            bySource: bySource.map(s => ({
                source: s.source,
                count: s._count,
            })),
        };
    }
}
