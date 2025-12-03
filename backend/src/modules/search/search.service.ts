import { Injectable, Logger } from '@nestjs/common';
import { SparqlService } from '../sparql/sparql.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QueryExpansionService } from './query-expansion.service';
import { SemanticRanking } from './ranking/semantic-ranking';
import { SearchResult } from './ranking/relevance-scoring';
import { PrismaService } from '../database/prisma.service';

export interface SearchPattern {
  subject?: string;
  predicate?: string;
  object?: string;
}

export interface SemanticSearchOptions {
  language?: string;
  useEmbeddings?: boolean;
  useQueryExpansion?: boolean;
  minScore?: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly semanticRanking: SemanticRanking;

  constructor(
    private sparqlService: SparqlService,
    private elasticsearchService: ElasticsearchService,
    private embeddingsService: EmbeddingsService,
    private queryExpansionService: QueryExpansionService,
    private prisma: PrismaService,
  ) {
    this.semanticRanking = new SemanticRanking();
  }

  /**
   * Búsqueda semántica mejorada con embeddings y expansión de consultas
   */
  async semanticSearch(
    query: string,
    options: SemanticSearchOptions = {},
  ): Promise<SearchResult[]> {
    const {
      language,
      useEmbeddings = true,
      useQueryExpansion = true,
      minScore = 0.5,
    } = options;

    try {
      const totalDocuments = await this.getTotalDocuments();
      let allResults: SearchResult[] = [];

      // 1. Búsqueda vectorial con embeddings (si está disponible)
      if (useEmbeddings && this.embeddingsService.isAvailable()) {
        const vectorResults = await this.vectorSearch(query, language, minScore);
        allResults.push(...vectorResults);
        this.logger.log(`Vector search returned ${vectorResults.length} results`);
      }

      // 2. Búsqueda con expansión de consultas
      if (useQueryExpansion) {
        const expandedResults = await this.expandedSearch(query, language);
        allResults.push(...expandedResults);
        this.logger.log(`Expanded search returned ${expandedResults.length} results`);
      }

      // 3. Búsqueda SPARQL tradicional (fallback)
      const sparqlResults = await this.sparqlService.searchTriples(query, language);
      const traditionalResults = this.convertSparqlResults(sparqlResults);
      allResults.push(...traditionalResults);
      this.logger.log(`Traditional search returned ${traditionalResults.length} results`);

      // 4. Eliminar duplicados
      const uniqueResults = this.deduplicateResults(allResults);

      // 5. Aplicar ranking semántico
      const rankedResults = this.semanticRanking.rankResults(
        uniqueResults,
        query,
        totalDocuments,
      );

      this.logger.log(
        `Semantic search for "${query}" returned ${rankedResults.length} unique results`,
      );

      return rankedResults;
    } catch (error) {
      this.logger.error(`Semantic search failed: ${error.message}`);
      // Fallback a búsqueda tradicional
      return this.traditionalSearch(query, language);
    }
  }

  /**
   * Búsqueda vectorial usando embeddings
   */
  private async vectorSearch(
    query: string,
    language?: string,
    minScore: number = 0.5,
  ): Promise<SearchResult[]> {
    try {
      // Generar embedding de la consulta
      const embeddingResult = await this.embeddingsService.generateEmbedding(query);

      if (!embeddingResult) {
        this.logger.debug('Could not generate embedding for query');
        return [];
      }

      // Buscar por similitud en Elasticsearch
      const results = await this.elasticsearchService.searchBySimilarity(
        embeddingResult.embedding,
        language,
        minScore,
      );

      return results.map(r => ({
        subject: r.subject,
        predicate: r.predicate,
        object: r.object,
        language: r.language,
        score: r.score,
      }));
    } catch (error) {
      this.logger.error(`Vector search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Búsqueda con expansión de consultas
   */
  private async expandedSearch(
    query: string,
    language?: string,
  ): Promise<SearchResult[]> {
    try {
      // Expandir la consulta
      const expandedQuery = await this.queryExpansionService.expandQuery(query);

      this.logger.debug(
        `Query expanded: ${expandedQuery.expanded.length} additional terms`,
      );

      // Construir query SPARQL expandida
      const sparqlQuery = this.queryExpansionService.buildExpandedSparqlQuery(
        expandedQuery,
        language,
      );

      // Ejecutar búsqueda
      const results = await this.sparqlService.query(sparqlQuery);
      return this.convertSparqlResults(results);
    } catch (error) {
      this.logger.error(`Expanded search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Búsqueda tradicional SPARQL (fallback)
   */
  private async traditionalSearch(
    query: string,
    language?: string,
  ): Promise<SearchResult[]> {
    try {
      const totalDocuments = await this.getTotalDocuments();
      const results = await this.sparqlService.searchTriples(query, language);
      const searchResults = this.convertSparqlResults(results);

      return this.semanticRanking.rankResults(
        searchResults,
        query,
        totalDocuments,
      );
    } catch (error) {
      this.logger.error(`Traditional search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Elimina resultados duplicados
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

    for (const result of results) {
      const key = `${result.subject}|${result.predicate}|${result.object}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    return unique;
  }

  /**
   * Búsqueda avanzada por patrón (sujeto, predicado, objeto)
   */
  async searchByPattern(
    pattern: SearchPattern,
    language?: string,
  ): Promise<SearchResult[]> {
    try {
      const { subject, predicate, object } = pattern;

      const sparqlQuery = this.buildPatternQuery(subject, predicate, object, language);
      const results = await this.sparqlService.query(sparqlQuery);

      return this.convertSparqlResults(results);
    } catch (error) {
      this.logger.error(`Pattern search failed: ${error.message}`);
      throw new Error(`Failed to execute pattern search: ${error.message}`);
    }
  }

  /**
   * Búsqueda por sujeto
   */
  async searchBySubject(subjectUri: string): Promise<SearchResult[]> {
    return this.searchByPattern({ subject: subjectUri });
  }

  /**
   * Búsqueda por predicado
   */
  async searchByPredicate(predicateUri: string): Promise<SearchResult[]> {
    return this.searchByPattern({ predicate: predicateUri });
  }

  /**
   * Búsqueda por objeto
   */
  async searchByObject(objectValue: string): Promise<SearchResult[]> {
    return this.searchByPattern({ object: objectValue });
  }

  /**
   * Búsqueda difusa (fuzzy search)
   */
  async fuzzySearch(
    term: string,
    threshold: number = 0.7,
    language?: string,
  ): Promise<SearchResult[]> {
    try {
      const totalDocuments = await this.getTotalDocuments();

      // Construir query SPARQL con regex para fuzzy matching
      const sparqlQuery = this.buildFuzzyQuery(term, language);
      const results = await this.sparqlService.query(sparqlQuery);

      const searchResults = this.convertSparqlResults(results);

      // Filtrar por threshold de similitud
      const filteredResults = searchResults.filter((result) => {
        const similarity = this.calculateSimilarity(term, result);
        return similarity >= threshold;
      });

      // Aplicar ranking
      return this.semanticRanking.rankResults(
        filteredResults,
        term,
        totalDocuments,
      );
    } catch (error) {
      this.logger.error(`Fuzzy search failed: ${error.message}`);
      throw new Error(`Failed to execute fuzzy search: ${error.message}`);
    }
  }

  /**
   * Búsqueda semántica avanzada (alias para compatibilidad)
   */
  async advancedSemanticSearch(
    query: string,
    language?: string,
  ): Promise<SearchResult[]> {
    return this.semanticSearch(query, { language });
  }

  /**
   * Construye query SPARQL para búsqueda por patrón
   */
  private buildPatternQuery(
    subject?: string,
    predicate?: string,
    object?: string,
    language?: string,
  ): string {
    const subjectPattern = subject ? `<${subject}>` : '?subject';
    const predicatePattern = predicate ? `<${predicate}>` : '?predicate';
    const objectPattern = object ? `"${object}"` : '?object';

    const languageFilter = language ? `FILTER(lang(?object) = "${language}")` : '';

    return `
      SELECT ?subject ?predicate ?object
      WHERE {
        ${subjectPattern} ${predicatePattern} ${objectPattern} .
        ${languageFilter}
      }
      LIMIT 100
    `;
  }

  /**
   * Construye query SPARQL para búsqueda difusa
   */
  private buildFuzzyQuery(term: string, language?: string): string {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const languageFilter = language ? `FILTER(lang(?object) = "${language}")` : '';

    return `
      SELECT ?subject ?predicate ?object
      WHERE {
        ?subject ?predicate ?object .
        FILTER(
          regex(str(?subject), "${escapedTerm}", "i") ||
          regex(str(?predicate), "${escapedTerm}", "i") ||
          regex(str(?object), "${escapedTerm}", "i")
        )
        ${languageFilter}
      }
      LIMIT 100
    `;
  }

  /**
   * Convierte resultados de SPARQL a SearchResult[]
   */
  private convertSparqlResults(sparqlResults: any): SearchResult[] {
    if (!sparqlResults?.results?.bindings) return [];

    return sparqlResults.results.bindings.map((binding: any) => ({
      subject: binding.subject?.value || '',
      predicate: binding.predicate?.value || '',
      object: binding.object?.value || '',
      language: binding.object?.['xml:lang'] || undefined,
    }));
  }

  /**
   * Calcula similitud entre término de búsqueda y resultado
   */
  private calculateSimilarity(term: string, result: SearchResult): number {
    const normalizedTerm = term.toLowerCase();
    const text = `${result.subject} ${result.predicate} ${result.object}`.toLowerCase();

    // Similitud simple basada en coincidencias de caracteres
    const matches = text.split('').filter((char) => normalizedTerm.includes(char)).length;
    const maxLength = Math.max(normalizedTerm.length, text.length);

    return matches / maxLength;
  }

  /**
   * Obtiene el número total de documentos
   */
  private async getTotalDocuments(): Promise<number> {
    const count = await this.prisma.document.count();
    return count || 1; // Evitar división por cero
  }

  /**
   * Incrementa el contador de accesos de un documento
   */
  async trackDocumentAccess(documentId: string): Promise<void> {
    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          accessCount: { increment: 1 },
          lastAccess: new Date(),
        },
      });
    } catch (error) {
      this.logger.debug(`Failed to track document access: ${error.message}`);
    }
  }
}
