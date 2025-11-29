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
}
