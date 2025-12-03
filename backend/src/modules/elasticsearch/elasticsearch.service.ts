import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { elasticsearchConfig } from '../../config/elasticsearch.config';

export interface TripleDocument {
    subject: string;
    predicate: string;
    object: string;
    language?: string;
    documentId?: string;
    text: string; // Campo combinado para búsqueda full-text
    embedding?: number[]; // Vector embedding para búsqueda semántica
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
    private readonly logger = new Logger(ElasticsearchService.name);
    private readonly client: Client;
    private readonly indexName = elasticsearchConfig.indices.triples;

    constructor() {
        this.client = new Client({ node: elasticsearchConfig.node });
    }

    async onModuleInit() {
        await this.createIndexIfNotExists();
    }

    /**
     * Crear índice si no existe
     */
    private async createIndexIfNotExists() {
        try {
            const exists = await this.client.indices.exists({ index: this.indexName });

            if (!exists) {
                await this.client.indices.create({
                    index: this.indexName,
                    body: {
                        mappings: {
                            properties: {
                                subject: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                                predicate: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                                object: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                                language: { type: 'keyword' },
                                documentId: { type: 'keyword' },
                                text: { type: 'text' },
                                embedding: {
                                    type: 'dense_vector',
                                    dims: 384, // Dimensión del modelo paraphrase-multilingual-MiniLM-L12-v2
                                    index: true,
                                    similarity: 'cosine',
                                },
                                suggest: {
                                    type: 'completion',
                                    analyzer: 'simple',
                                    search_analyzer: 'simple',
                                },
                            },
                        },
                    },
                });

                this.logger.log(`Index ${this.indexName} created successfully`);
            }
        } catch (error) {
            this.logger.error(`Failed to create index: ${error.message}`);
        }
    }

    /**
     * Indexar una tripleta
     */
    async indexTriple(triple: TripleDocument): Promise<void> {
        try {
            const text = `${triple.subject} ${triple.predicate} ${triple.object}`;

            await this.client.index({
                index: this.indexName,
                document: {
                    ...triple,
                    text,
                    suggest: {
                        input: [triple.subject, triple.predicate, triple.object],
                        weight: 1,
                    },
                },
            });
        } catch (error) {
            this.logger.error(`Failed to index triple: ${error.message}`);
            throw error;
        }
    }

    /**
     * Indexar múltiples tripletas (bulk)
     */
    async indexTriples(triples: TripleDocument[]): Promise<void> {
        try {
            const operations = triples.flatMap((triple) => {
                const text = `${triple.subject} ${triple.predicate} ${triple.object}`;
                return [
                    { index: { _index: this.indexName } },
                    {
                        ...triple,
                        text,
                        suggest: {
                            input: [triple.subject, triple.predicate, triple.object],
                            weight: 1,
                        },
                    },
                ];
            });

            const result = await this.client.bulk({ operations });

            if (result.errors) {
                this.logger.warn('Some documents failed to index');
            } else {
                this.logger.log(`Indexed ${triples.length} triples successfully`);
            }
        } catch (error) {
            this.logger.error(`Bulk indexing failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Búsqueda full-text rápida
     */
    async search(query: string, language?: string): Promise<any[]> {
        try {
            const must: any[] = [
                {
                    multi_match: {
                        query,
                        fields: ['subject^3', 'predicate^2', 'object', 'text'],
                        fuzziness: elasticsearchConfig.search.fuzziness,
                        minimum_should_match: elasticsearchConfig.search.minimumShouldMatch,
                    },
                },
            ];

            if (language) {
                must.push({ term: { language } });
            }

            const result = await this.client.search({
                index: this.indexName,
                body: {
                    query: { bool: { must } },
                    size: elasticsearchConfig.search.maxResults,
                },
            });

            return result.hits.hits.map((hit: any) => hit._source);
        } catch (error) {
            this.logger.error(`Search failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Autocompletado
     */
    async autocomplete(prefix: string): Promise<string[]> {
        try {
            const result = await this.client.search({
                index: this.indexName,
                body: {
                    suggest: {
                        suggestions: {
                            prefix,
                            completion: {
                                field: 'suggest',
                                size: elasticsearchConfig.autocomplete.maxSuggestions,
                                fuzzy: {
                                    fuzziness: elasticsearchConfig.autocomplete.fuzziness,
                                },
                            },
                        },
                    },
                },
            });

            const suggestions = (result.suggest?.suggestions as any)?.[0]?.options || [];
            return suggestions.map((option: any) => option.text);
        } catch (error) {
            this.logger.error(`Autocomplete failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Verificar salud de Elasticsearch
     */
    async healthCheck(): Promise<boolean> {
        try {
            const health = await this.client.cluster.health();
            return health.status !== 'red';
        } catch (error) {
            this.logger.error(`Health check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Eliminar todas las tripletas de un documento
     */
    async deleteByDocumentId(documentId: string): Promise<void> {
        try {
            await this.client.deleteByQuery({
                index: this.indexName,
                body: {
                    query: {
                        term: { documentId },
                    },
                },
            });

            this.logger.log(`Deleted triples for document ${documentId}`);
        } catch (error) {
            this.logger.error(`Failed to delete triples: ${error.message}`);
            throw error;
        }
    }

    /**
     * Indexar tripletas con embeddings para búsqueda vectorial
     */
    async indexTriplesWithEmbeddings(
        triples: TripleDocument[],
        embeddings: Map<string, number[]>,
    ): Promise<void> {
        try {
            const operations = triples.flatMap((triple) => {
                const text = `${triple.subject} ${triple.predicate} ${triple.object}`;
                const embedding = embeddings.get(text);

                return [
                    { index: { _index: this.indexName } },
                    {
                        ...triple,
                        text,
                        embedding,
                        suggest: {
                            input: [triple.subject, triple.predicate, triple.object],
                            weight: 1,
                        },
                    },
                ];
            });

            const result = await this.client.bulk({ operations });

            if (result.errors) {
                this.logger.warn('Some documents with embeddings failed to index');
            } else {
                this.logger.log(
                    `Indexed ${triples.length} triples with embeddings successfully`,
                );
            }
        } catch (error) {
            this.logger.error(`Bulk indexing with embeddings failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Búsqueda por similitud vectorial usando embeddings
     */
    async searchBySimilarity(
        queryEmbedding: number[],
        language?: string,
        minScore: number = 0.7,
    ): Promise<any[]> {
        try {
            const filter: any[] = [];

            if (language) {
                filter.push({ term: { language } });
            }

            const result = await this.client.search({
                index: this.indexName,
                body: {
                    query: {
                        script_score: {
                            query: filter.length > 0 ? { bool: { filter } } : { match_all: {} },
                            script: {
                                source:
                                    "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                                params: {
                                    query_vector: queryEmbedding,
                                },
                            },
                        },
                    },
                    min_score: minScore + 1.0, // +1.0 porque el script suma 1
                    size: elasticsearchConfig.search.maxResults,
                },
            });

            return result.hits.hits.map((hit: any) => ({
                ...hit._source,
                score: hit._score - 1.0, // Restar 1 para obtener el score real
            }));
        } catch (error) {
            this.logger.error(`Vector search failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Búsqueda híbrida: combina búsqueda full-text y vectorial
     */
    async hybridSearch(
        query: string,
        queryEmbedding: number[],
        language?: string,
    ): Promise<any[]> {
        try {
            const filter: any[] = [];

            if (language) {
                filter.push({ term: { language } });
            }

            const result = await this.client.search({
                index: this.indexName,
                body: {
                    query: {
                        bool: {
                            should: [
                                // Búsqueda full-text (30% del peso)
                                {
                                    multi_match: {
                                        query,
                                        fields: ['subject^3', 'predicate^2', 'object', 'text'],
                                        fuzziness: elasticsearchConfig.search.fuzziness,
                                        boost: 0.3,
                                    },
                                },
                                // Búsqueda vectorial (70% del peso)
                                {
                                    script_score: {
                                        query: { match_all: {} },
                                        script: {
                                            source:
                                                "cosineSimilarity(params.query_vector, 'embedding') * 0.7",
                                            params: {
                                                query_vector: queryEmbedding,
                                            },
                                        },
                                    },
                                },
                            ],
                            filter,
                            minimum_should_match: 1,
                        },
                    },
                    size: elasticsearchConfig.search.maxResults,
                },
            });

            return result.hits.hits.map((hit: any) => ({
                ...hit._source,
                score: hit._score,
            }));
        } catch (error) {
            this.logger.error(`Hybrid search failed: ${error.message}`);
            return [];
        }
    }
}
