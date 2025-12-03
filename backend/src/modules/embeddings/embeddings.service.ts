import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface EmbeddingResult {
    embedding: number[];
    cached: boolean;
}

@Injectable()
export class EmbeddingsService implements OnModuleInit {
    private readonly logger = new Logger(EmbeddingsService.name);
    private embeddingServiceUrl: string;
    private isServiceAvailable = false;
    private readonly EMBEDDING_MODEL = 'paraphrase-multilingual-MiniLM-L12-v2';

    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
        private configService: ConfigService,
    ) {
        this.embeddingServiceUrl = this.configService.get<string>(
            'EMBEDDING_SERVICE_URL',
            'http://localhost:5000',
        );
    }

    async onModuleInit() {
        // Verificar disponibilidad del servicio de embeddings
        await this.checkServiceHealth();

        if (!this.isServiceAvailable) {
            this.logger.warn(
                `⚠️  Embedding service not available. Semantic search will work with query expansion only.`,
            );
            this.logger.warn(
                `   To enable vector search, start: python src/modules/embeddings/embedding-service.py`,
            );
        }
    }

    /**
     * Verifica si el servicio de embeddings está disponible
     */
    async checkServiceHealth(): Promise<boolean> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.embeddingServiceUrl}/health`, {
                    timeout: 5000,
                }),
            );

            this.isServiceAvailable = response.status === 200;

            if (this.isServiceAvailable) {
                this.logger.log(
                    `✅ Embedding service is available at ${this.embeddingServiceUrl}`,
                );
                this.logger.log(`   Model: ${response.data.model}, Dimension: ${response.data.embedding_dim}`);
            }

            return this.isServiceAvailable;
        } catch (error) {
            this.isServiceAvailable = false;
            return false;
        }
    }

    /**
     * Genera embedding para un texto
     */
    async generateEmbedding(text: string): Promise<EmbeddingResult | null> {
        if (!text || text.trim().length === 0) {
            return null;
        }

        if (!this.isServiceAvailable) {
            return null;
        }

        const normalizedText = text.trim();

        try {
            // 1. Buscar en caché
            const cached = await this.prisma.embedding.findUnique({
                where: {
                    text_model: {
                        text: normalizedText,
                        model: this.EMBEDDING_MODEL,
                    }
                },
            });

            if (cached) {
                return {
                    embedding: cached.embedding,
                    cached: true,
                };
            }

            // 2. Generar nuevo embedding
            const response = await firstValueFrom(
                this.httpService.post(`${this.embeddingServiceUrl}/embed`, {
                    texts: [normalizedText],
                    normalize: true,
                }),
            );

            const embedding = response.data.embeddings[0];

            // 3. Guardar en caché
            try {
                await this.prisma.embedding.create({
                    data: {
                        text: normalizedText,
                        embedding,
                        model: this.EMBEDDING_MODEL,
                    },
                });
            } catch (cacheError) {
                // Ignorar errores de caché
            }

            return {
                embedding,
                cached: false,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Genera embeddings para múltiples textos
     */
    async generateEmbeddings(texts: string[]): Promise<Map<string, number[]>> {
        const results = new Map<string, number[]>();

        if (!texts || texts.length === 0 || !this.isServiceAvailable) {
            return results;
        }

        const normalizedTexts = texts
            .map(t => t?.trim())
            .filter(t => t && t.length > 0);

        if (normalizedTexts.length === 0) {
            return results;
        }

        try {
            // 1. Buscar en caché
            const cached = await this.prisma.embedding.findMany({
                where: {
                    text: { in: normalizedTexts },
                    model: this.EMBEDDING_MODEL,
                },
            });

            const cachedMap = new Map(cached.map(c => [c.text, c.embedding]));

            // 2. Identificar textos sin caché
            const uncachedTexts = normalizedTexts.filter(t => !cachedMap.has(t));

            // 3. Generar embeddings faltantes
            if (uncachedTexts.length > 0) {
                const response = await firstValueFrom(
                    this.httpService.post(`${this.embeddingServiceUrl}/embed`, {
                        texts: uncachedTexts,
                        normalize: true,
                    }),
                );

                const newEmbeddings = response.data.embeddings;

                // 4. Guardar en caché
                const embeddingsToCache = uncachedTexts.map((text, idx) => ({
                    text,
                    embedding: newEmbeddings[idx],
                    model: this.EMBEDDING_MODEL,
                }));

                try {
                    await this.prisma.embedding.createMany({
                        data: embeddingsToCache,
                        skipDuplicates: true,
                    });
                } catch (cacheError) {
                    // Ignorar errores de caché
                }

                // 5. Agregar a resultados
                uncachedTexts.forEach((text, idx) => {
                    results.set(text, newEmbeddings[idx]);
                });
            }

            // 6. Agregar embeddings cacheados
            cachedMap.forEach((embedding, text) => {
                results.set(text, embedding);
            });

            return results;
        } catch (error) {
            return results;
        }
    }

    /**
     * Verifica si el servicio de embeddings está disponible
     */
    isAvailable(): boolean {
        return this.isServiceAvailable;
    }
}
