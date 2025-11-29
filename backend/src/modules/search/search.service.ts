import { Injectable, Logger } from "@nestjs/common";
import { SparqlService } from "../sparql/sparql.service";
import { SemanticRanking } from "./ranking/semantic-ranking";
import { SearchResult } from "./ranking/relevance-scoring";
import { PrismaService } from "../database/prisma.service";

export interface SearchPattern {
  subject?: string;
  predicate?: string;
  object?: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly semanticRanking: SemanticRanking;

  constructor(
    private sparqlService: SparqlService,
    private prisma: PrismaService,
  ) {
    this.semanticRanking = new SemanticRanking();
  }

  /**
   * Búsqueda semántica simple (texto libre)
   */
  async semanticSearch(query: string, language?: string): Promise<SearchResult[]> {
    try {
      const totalDocuments = await this.getTotalDocuments();

      // Ejecutar búsqueda SPARQL
      const results = await this.sparqlService.searchTriples(query, language);

      // Convertir resultados de SPARQL a SearchResult
      const searchResults = this.convertSparqlResults(results);

      // Aplicar ranking semántico
      const rankedResults = this.semanticRanking.rankResults(
        searchResults,
        query,
        totalDocuments,
      );

      this.logger.log(`Search for "${query}" returned ${rankedResults.length} results`);

      return rankedResults;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw new Error(`Failed to execute search: ${error.message}`);
    }
  }

  /**
   * Búsqueda avanzada por patrón (sujeto, predicado, objeto)
   */
  async searchByPattern(pattern: SearchPattern, language?: string): Promise<SearchResult[]> {
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
  async fuzzySearch(term: string, threshold: number = 0.7, language?: string): Promise<SearchResult[]> {
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
  async advancedSemanticSearch(query: string, language?: string): Promise<SearchResult[]> {
    return this.semanticSearch(query, language);
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
}
