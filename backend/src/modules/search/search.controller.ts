import { Controller, Get, Post, Query, Body } from "@nestjs/common";
import { SearchService, SearchPattern } from "./search.service";
import { ElasticsearchService } from "../elasticsearch/elasticsearch.service";

@Controller("search")
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly elasticsearchService: ElasticsearchService,
  ) { }

  /**
   * Búsqueda semántica simple
   * GET /search?q=term&lang=es
   */
  @Get()
  async search(@Query("query") query: string, @Query("language") language?: string) {
    if (!query) {
      return { results: [] };
    }

    const results = await this.searchService.semanticSearch(query, { language });
    return { results, count: results.length };
  }

  /**
   * Búsqueda por sujeto
   * GET /search/subject?uri=http://example.org/subject
   */
  @Get("subject")
  async searchBySubject(@Query("uri") uri: string) {
    if (!uri) {
      return { results: [] };
    }

    const results = await this.searchService.searchBySubject(uri);
    return { results, count: results.length };
  }

  /**
   * Búsqueda por predicado
   * GET /search/predicate?uri=http://example.org/predicate
   */
  @Get("predicate")
  async searchByPredicate(@Query("uri") uri: string) {
    if (!uri) {
      return { results: [] };
    }

    const results = await this.searchService.searchByPredicate(uri);
    return { results, count: results.length };
  }

  /**
   * Búsqueda por objeto
   * GET /search/object?value=someValue
   */
  @Get("object")
  async searchByObject(@Query("value") value: string) {
    if (!value) {
      return { results: [] };
    }

    const results = await this.searchService.searchByObject(value);
    return { results, count: results.length };
  }

  /**
   * Búsqueda difusa
   * GET /search/fuzzy?q=term&threshold=0.7&lang=es
   */
  @Get("fuzzy")
  async fuzzySearch(
    @Query("q") query: string,
    @Query("threshold") threshold?: string,
    @Query("lang") language?: string,
  ) {
    if (!query) {
      return { results: [] };
    }

    const thresholdValue = threshold ? parseFloat(threshold) : 0.7;
    const results = await this.searchService.fuzzySearch(
      query,
      thresholdValue,
      language,
    );
    return { results, count: results.length };
  }

  /**
   * Búsqueda por patrón SPARQL
   * POST /search/pattern
   * Body: { subject?: string, predicate?: string, object?: string, language?: string }
   */
  @Post("pattern")
  async searchByPattern(@Body() body: SearchPattern & { language?: string }) {
    const { language, ...pattern } = body;
    const results = await this.searchService.searchByPattern(pattern, language);
    return { results, count: results.length };
  }

  /**
   * Búsqueda rápida con Elasticsearch
   * GET /search/fast?q=term&lang=es
   */
  @Get("fast")
  async fastSearch(
    @Query("q") query: string,
    @Query("lang") language?: string,
  ) {
    if (!query) {
      return { results: [] };
    }

    const results = await this.elasticsearchService.search(query, language);
    return { results, count: results.length, source: 'elasticsearch' };
  }

  /**
   * Autocompletado
   * GET /search/autocomplete?q=fu
   */
  @Get("autocomplete")
  async autocomplete(@Query("q") query: string) {
    if (!query || query.length < 2) {
      return { suggestions: [] };
    }

    const suggestions = await this.elasticsearchService.autocomplete(query);
    return { suggestions };
  }
}
