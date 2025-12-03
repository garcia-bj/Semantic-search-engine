import { Injectable, Logger } from '@nestjs/common';
import { SparqlService } from '../sparql/sparql.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { TranslationService } from '../translation/translation.service';
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
  useTranslation?: boolean;
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
    private translationService: TranslationService,
    private prisma: PrismaService,
  ) {
    this.semanticRanking = new SemanticRanking();
  }

  /**
   * Búsqueda semántica mejorada con embeddings, expansión de consultas y traducción
   */
  async semanticSearch(
    query: string,
    options: SemanticSearchOptions = {},
  ): Promise<SearchResult[]> {
    const {
      language,
      useEmbeddings = true,
      useQueryExpansion = true,
      useTranslation = true,
      minScore = 0.5,
    } = options;

    try {
      const totalDocuments = await this.getTotalDocuments();
      let allResults: SearchResult[] = [];
      let searchQueries: string[] = [query]; // Incluir query original

      // 0. Traducción multiidioma (si está habilitado)
      if (useTranslation) {
        try {
          const translations = await this.translationService.translateToMultipleLanguages(query);
          searchQueries = [...new Set([...searchQueries, ...translations])];
          this.logger.log(`Searching with translations: ${searchQueries.join(', ')}`);
        } catch (error) {
          this.logger.warn(`Translation failed: ${error.message}, continuing with original query`);
        }
      }

      // Buscar con cada variante de la query (original + traducciones)
      for (const searchQuery of searchQueries) {
        // 1. Búsqueda vectorial con embeddings (si está disponible)
        if (useEmbeddings && this.embeddingsService.isAvailable()) {
          const vectorResults = await this.vectorSearch(searchQuery, language, minScore);
          allResults.push(...vectorResults);
          this.logger.log(`Vector search for "${searchQuery}" returned ${vectorResults.length} results`);
        }

        // 2. Búsqueda con expansión de consultas
        if (useQueryExpansion) {
          const expandedResults = await this.expandedSearch(searchQuery, language);
          allResults.push(...expandedResults);
          this.logger.log(`Expanded search for "${searchQuery}" returned ${expandedResults.length} results`);
        }

        // 3. Búsqueda SPARQL tradicional
        const sparqlResults = await this.sparqlService.searchTriples(searchQuery, language);
        const traditionalResults = await this.convertSparqlResults(sparqlResults);
        allResults.push(...traditionalResults);
        this.logger.log(`Traditional search for "${searchQuery}" returned ${traditionalResults.length} results`);
      }

      // 4. Eliminar duplicados
      const uniqueResults = this.deduplicateResults(allResults);

      // 5. Aplicar ranking semántico
      const rankedResults = this.semanticRanking.rankResults(
        uniqueResults,
        query,
        totalDocuments,
      );

      this.logger.log(
        `Semantic search for "${query}" (with ${searchQueries.length} variants) returned ${rankedResults.length} unique results`,
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
        this.logger.debug('No embedding generated for query');
        return [];
      }

      // Buscar en Elasticsearch por similitud
      const results = await this.elasticsearchService.searchBySimilarity(
        embeddingResult.embedding,
        minScore.toString(),
      );

      return results.map((r: any) => ({
        subject: r.subject || '',
        predicate: r.predicate || '',
        object: r.object || '',
        score: r.score || 0,
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
      const expandedResult = await this.queryExpansionService.expandQuery(query);

      // Construir query SPARQL con términos expandidos usando el método del servicio
      const sparqlQuery = this.queryExpansionService.buildExpandedSparqlQuery(expandedResult, language);

      // Ejecutar búsqueda
      const results = await this.sparqlService.query(sparqlQuery);
      return await this.convertSparqlResults(results);
    } catch (error) {
      this.logger.error(`Expanded search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Búsqueda SPARQL tradicional
   */
  private async traditionalSearch(
    query: string,
    language?: string,
  ): Promise<SearchResult[]> {
    try {
      const totalDocuments = await this.getTotalDocuments();
      const results = await this.sparqlService.searchTriples(query, language);
      const searchResults = await this.convertSparqlResults(results);

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

      return await this.convertSparqlResults(results);
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

      // Convertir y filtrar resultados
      const searchResults = await this.convertSparqlResults(results);
      const filteredResults = searchResults.filter(
        (result) => this.calculateSimilarity(term, result) >= threshold,
      );

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
   * Búsqueda semántica avanzada (alias para semanticSearch)
   */
  async advancedSemanticSearch(
    query: string,
    options: SemanticSearchOptions = {},
  ): Promise<SearchResult[]> {
    return this.semanticSearch(query, options);
  }

  /**
   * Construye una query SPARQL para búsqueda por patrón
   */
  private buildPatternQuery(
    subject?: string,
    predicate?: string,
    object?: string,
    language?: string,
  ): string {
    const subjectPattern = subject || '?subject';
    const predicatePattern = predicate || '?predicate';
    const objectPattern = object || '?object';

    return `
      SELECT DISTINCT ?subject ?predicate ?object
      WHERE {
        ${subjectPattern} ${predicatePattern} ${objectPattern} .
      }
      LIMIT 100
    `;
  }

  /**
   * Construye una query SPARQL para búsqueda difusa
   */
  private buildFuzzyQuery(term: string, language?: string): string {
    return `
      SELECT DISTINCT ?subject ?predicate ?object
      WHERE {
        ?subject ?predicate ?object .
        FILTER (
          regex(str(?subject), "${term}", "i") ||
          regex(str(?predicate), "${term}", "i") ||
          regex(str(?object), "${term}", "i")
        )
      }
      LIMIT 100
    `;
  }

  /**
   * Convierte resultados de SPARQL a SearchResult[] y enriquece con información del documento
   */
  private async convertSparqlResults(sparqlResults: any): Promise<SearchResult[]> {
    if (!sparqlResults?.results?.bindings) return [];

    const results = sparqlResults.results.bindings.map((binding: any) => ({
      subject: binding.subject?.value || '',
      predicate: binding.predicate?.value || '',
      object: binding.object?.value || '',
      language: binding.object?.['xml:lang'] || undefined,
      documentId: binding.documentId?.value || undefined,
    }));

    // Enriquecer con información del documento si está disponible
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        if (result.documentId) {
          try {
            const document = await this.prisma.document.findUnique({
              where: { id: result.documentId },
              select: { id: true, filename: true },
            });
            if (document) {
              return { ...result, document };
            }
          } catch (error) {
            this.logger.debug(`Failed to fetch document: ${error.message}`);
          }
        }
        return result;
      }),
    );

    return enrichedResults;
  }

  /**
   * Enriquece los resultados buscando individuos y sus relaciones completas
   */
  async enrichResultsWithProperties(results: SearchResult[]): Promise<any[]> {
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        // CASO 1: Si es una clase, buscar individuos de esa clase
        if (
          result.predicate.includes('rdf-syntax-ns#type') &&
          result.object.includes('owl#Class')
        ) {
          return await this.enrichWithIndividuals(result);
        }

        // CASO 2: Si es un individuo (instance), mostrar todas sus propiedades
        const individualInfo = await this.getIndividualInfo(result.subject);
        if (individualInfo) {
          return {
            ...result,
            ...individualInfo,
          };
        }

        // CASO 3: Buscar si hay individuos relacionados con este resultado
        const relatedIndividuals = await this.findRelatedIndividuals(result.subject);
        if (relatedIndividuals.length > 0) {
          return {
            ...result,
            type: 'related',
            relatedIndividuals,
            isClass: false,
            isProperty: false,
          };
        }

        return {
          ...result,
          isClass: false,
          isProperty: false,
        };
      }),
    );

    return enrichedResults;
  }

  /**
   * Enriquece un resultado de clase buscando sus individuos
   */
  private async enrichWithIndividuals(result: SearchResult): Promise<any> {
    const classUri = result.subject;

    // Buscar individuos de esta clase
    const individualsQuery = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT DISTINCT ?individual ?label
      WHERE {
        ?individual rdf:type <${classUri}> .
        OPTIONAL { ?individual rdfs:label ?label }
      }
      LIMIT 20
    `;

    try {
      const individualsResult = await this.sparqlService.query(individualsQuery);
      const individuals = individualsResult?.results?.bindings || [];

      // Para cada individuo, obtener sus propiedades
      const enrichedIndividuals = await Promise.all(
        individuals.map(async (ind: any) => {
          const individualUri = ind.individual?.value as string;
          if (!individualUri) return null;

          const individualData = await this.getIndividualInfo(individualUri);
          return {
            uri: individualUri,
            label: ind.label?.value || this.extractLocalName(individualUri),
            ...individualData,
          };
        })
      );

      return {
        ...result,
        type: 'class',
        className: this.extractLocalName(classUri),
        classUri,
        individuals: enrichedIndividuals.filter(i => i !== null),
        individualCount: enrichedIndividuals.length,
        isClass: true,
        isProperty: false,
      };
    } catch (error) {
      this.logger.debug(`Failed to fetch individuals for class: ${error.message}`);
      return {
        ...result,
        type: 'class',
        className: this.extractLocalName(classUri),
        classUri,
        individuals: [],
        isClass: true,
        isProperty: false,
      };
    }
  }

  /**
   * Obtiene información completa de un individuo
   */
  private async getIndividualInfo(individualUri: string): Promise<any | null> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      
      SELECT ?type ?property ?value ?valueLabel
      WHERE {
        <${individualUri}> rdf:type ?type .
        FILTER(?type != owl:NamedIndividual)
        OPTIONAL {
          <${individualUri}> ?property ?value .
          FILTER(?property != rdf:type)
          OPTIONAL { ?value rdfs:label ?valueLabel }
        }
      }
    `;

    try {
      const result = await this.sparqlService.query(query);
      const bindings = result?.results?.bindings || [];

      if (bindings.length === 0) return null;

      // Obtener el tipo (clase) del individuo
      const types = [...new Set(bindings.map((b: any) => b.type?.value).filter(Boolean))] as string[];

      // Agrupar propiedades
      const properties: any[] = [];
      const relations: any[] = [];

      bindings.forEach((b: any) => {
        if (!b.property || !b.value) return;

        const prop = {
          property: this.extractLocalName(b.property.value),
          propertyUri: b.property.value,
          value: b.value.value,
          valueLabel: b.valueLabel?.value || this.extractLocalName(b.value.value),
          isLiteral: b.value.type === 'literal',
        };

        if (prop.isLiteral) {
          properties.push(prop);
        } else {
          relations.push(prop);
        }
      });

      return {
        type: 'individual',
        individualName: this.extractLocalName(individualUri),
        individualUri,
        classes: types.map(t => ({
          uri: t,
          name: this.extractLocalName(t),
        })),
        properties,
        relations,
        isIndividual: true,
      };
    } catch (error) {
      this.logger.debug(`Failed to get individual info: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca individuos relacionados con un URI
   */
  private async findRelatedIndividuals(uri: string): Promise<any[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT DISTINCT ?individual ?label ?relation
      WHERE {
        {
          ?individual ?relation <${uri}> .
          ?individual rdf:type ?type .
          OPTIONAL { ?individual rdfs:label ?label }
        }
        UNION
        {
          <${uri}> ?relation ?individual .
          ?individual rdf:type ?type .
          OPTIONAL { ?individual rdfs:label ?label }
        }
      }
      LIMIT 10
    `;

    try {
      const result = await this.sparqlService.query(query);
      const bindings = result?.results?.bindings || [];

      return bindings.map((b: any) => ({
        uri: b.individual?.value,
        label: b.label?.value || this.extractLocalName(b.individual?.value || ''),
        relation: this.extractLocalName(b.relation?.value || ''),
      }));
    } catch (error) {
      this.logger.debug(`Failed to find related individuals: ${error.message}`);
      return [];
    }
  }

  /**
   * Enriquece un resultado que es una clase OWL
   */
  private async enrichClassResult(result: SearchResult): Promise<any> {
    const classUri = result.subject;

    // Buscar propiedades de datos (datatype properties)
    const dataPropertiesQuery = `
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT ?property ?label ?range ?comment
      WHERE {
        ?property a owl:DatatypeProperty .
        ?property rdfs:domain <${classUri}> .
        OPTIONAL { ?property rdfs:label ?label }
        OPTIONAL { ?property rdfs:range ?range }
        OPTIONAL { ?property rdfs:comment ?comment }
      }
    `;

    // Buscar propiedades de objetos (object properties)
    const objectPropertiesQuery = `
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT ?property ?label ?range ?comment
      WHERE {
        ?property a owl:ObjectProperty .
        ?property rdfs:domain <${classUri}> .
        OPTIONAL { ?property rdfs:label ?label }
        OPTIONAL { ?property rdfs:range ?range }
        OPTIONAL { ?property rdfs:comment ?comment }
      }
    `;

    // Buscar subclases
    const subclassesQuery = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT ?subclass ?label
      WHERE {
        ?subclass rdfs:subClassOf <${classUri}> .
        OPTIONAL { ?subclass rdfs:label ?label }
      }
    `;

    try {
      const [dataPropsResult, objectPropsResult, subclassesResult] = await Promise.all([
        this.sparqlService.query(dataPropertiesQuery),
        this.sparqlService.query(objectPropertiesQuery),
        this.sparqlService.query(subclassesQuery),
      ]);

      const dataProperties = dataPropsResult?.results?.bindings?.map((b: any) => ({
        uri: b.property?.value || '',
        label: b.label?.value || this.extractLocalName(b.property?.value || ''),
        range: this.extractLocalName(b.range?.value || ''),
        rangeUri: b.range?.value || '',
        comment: b.comment?.value || '',
      })) || [];

      const objectProperties = objectPropsResult?.results?.bindings?.map((b: any) => ({
        uri: b.property?.value || '',
        label: b.label?.value || this.extractLocalName(b.property?.value || ''),
        range: this.extractLocalName(b.range?.value || ''),
        rangeUri: b.range?.value || '',
        comment: b.comment?.value || '',
      })) || [];

      const subclasses = subclassesResult?.results?.bindings?.map((b: any) => ({
        uri: b.subclass?.value || '',
        label: b.label?.value || this.extractLocalName(b.subclass?.value || ''),
      })) || [];

      return {
        ...result,
        type: 'class',
        className: this.extractLocalName(classUri),
        classUri,
        dataProperties,
        objectProperties,
        subclasses,
        isClass: true,
        isProperty: false,
      };
    } catch (error) {
      this.logger.debug(`Failed to fetch properties for class: ${error.message}`);
      return {
        ...result,
        type: 'class',
        className: this.extractLocalName(classUri),
        classUri,
        isClass: true,
        isProperty: false,
      };
    }
  }

  /**
   * Enriquece un resultado que es una Data Property
   */
  private async enrichDataPropertyResult(result: SearchResult): Promise<any> {
    const propertyUri = result.subject;

    const propertyDetailsQuery = `
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT ?domain ?range ?label ?comment
      WHERE {
        <${propertyUri}> a owl:DatatypeProperty .
        OPTIONAL { <${propertyUri}> rdfs:domain ?domain }
        OPTIONAL { <${propertyUri}> rdfs:range ?range }
        OPTIONAL { <${propertyUri}> rdfs:label ?label }
        OPTIONAL { <${propertyUri}> rdfs:comment ?comment }
      }
    `;

    try {
      const detailsResult = await this.sparqlService.query(propertyDetailsQuery);
      const binding = detailsResult?.results?.bindings?.[0];

      if (binding) {
        const domainUri = binding.domain?.value || '';
        const domainClass = domainUri ? await this.getClassInfo(domainUri) : null;

        return {
          ...result,
          type: 'dataProperty',
          propertyName: this.extractLocalName(propertyUri),
          propertyUri,
          label: binding.label?.value || this.extractLocalName(propertyUri),
          comment: binding.comment?.value || '',
          domain: domainClass,
          range: this.extractLocalName(binding.range?.value || ''),
          rangeUri: binding.range?.value || '',
          isClass: false,
          isProperty: true,
        };
      }
    } catch (error) {
      this.logger.debug(`Failed to fetch property details: ${error.message}`);
    }

    return {
      ...result,
      type: 'dataProperty',
      propertyName: this.extractLocalName(propertyUri),
      propertyUri,
      isClass: false,
      isProperty: true,
    };
  }

  /**
   * Enriquece un resultado que es una Object Property
   */
  private async enrichObjectPropertyResult(result: SearchResult): Promise<any> {
    const propertyUri = result.subject;

    const propertyDetailsQuery = `
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT ?domain ?range ?label ?comment
      WHERE {
        <${propertyUri}> a owl:ObjectProperty .
        OPTIONAL { <${propertyUri}> rdfs:domain ?domain }
        OPTIONAL { <${propertyUri}> rdfs:range ?range }
        OPTIONAL { <${propertyUri}> rdfs:label ?label }
        OPTIONAL { <${propertyUri}> rdfs:comment ?comment }
      }
    `;

    try {
      const detailsResult = await this.sparqlService.query(propertyDetailsQuery);
      const binding = detailsResult?.results?.bindings?.[0];

      if (binding) {
        const domainUri = binding.domain?.value || '';
        const rangeUri = binding.range?.value || '';

        const [domainClass, rangeClass] = await Promise.all([
          domainUri ? this.getClassInfo(domainUri) : null,
          rangeUri ? this.getClassInfo(rangeUri) : null,
        ]);

        return {
          ...result,
          type: 'objectProperty',
          propertyName: this.extractLocalName(propertyUri),
          propertyUri,
          label: binding.label?.value || this.extractLocalName(propertyUri),
          comment: binding.comment?.value || '',
          domain: domainClass,
          range: rangeClass,
          isClass: false,
          isProperty: true,
        };
      }
    } catch (error) {
      this.logger.debug(`Failed to fetch property details: ${error.message}`);
    }

    return {
      ...result,
      type: 'objectProperty',
      propertyName: this.extractLocalName(propertyUri),
      propertyUri,
      isClass: false,
      isProperty: true,
    };
  }

  /**
   * Busca información de una propiedad por su URI
   */
  private async findPropertyInfo(uri: string): Promise<any | null> {
    const query = `
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT ?type ?domain ?range ?label ?comment
      WHERE {
        <${uri}> a ?type .
        FILTER (?type = owl:DatatypeProperty || ?type = owl:ObjectProperty)
        OPTIONAL { <${uri}> rdfs:domain ?domain }
        OPTIONAL { <${uri}> rdfs:range ?range }
        OPTIONAL { <${uri}> rdfs:label ?label }
        OPTIONAL { <${uri}> rdfs:comment ?comment }
      }
    `;

    try {
      const result = await this.sparqlService.query(query);
      const binding = result?.results?.bindings?.[0];

      if (binding) {
        const isDataProperty = binding.type?.value.includes('DatatypeProperty');
        const domainUri = binding.domain?.value || '';
        const rangeUri = binding.range?.value || '';

        const domainClass = domainUri ? await this.getClassInfo(domainUri) : null;
        const rangeClass = !isDataProperty && rangeUri ? await this.getClassInfo(rangeUri) : null;

        return {
          type: isDataProperty ? 'dataProperty' : 'objectProperty',
          propertyName: this.extractLocalName(uri),
          propertyUri: uri,
          label: binding.label?.value || this.extractLocalName(uri),
          comment: binding.comment?.value || '',
          domain: domainClass,
          range: isDataProperty ? this.extractLocalName(rangeUri) : rangeClass,
          rangeUri: rangeUri,
          isClass: false,
          isProperty: true,
        };
      }
    } catch (error) {
      this.logger.debug(`Failed to find property info: ${error.message}`);
    }

    return null;
  }

  /**
   * Obtiene información básica de una clase
   */
  private async getClassInfo(classUri: string): Promise<any> {
    const query = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT ?label ?comment
      WHERE {
        OPTIONAL { <${classUri}> rdfs:label ?label }
        OPTIONAL { <${classUri}> rdfs:comment ?comment }
      }
    `;

    try {
      const result = await this.sparqlService.query(query);
      const binding = result?.results?.bindings?.[0];

      return {
        uri: classUri,
        name: this.extractLocalName(classUri),
        label: binding?.label?.value || this.extractLocalName(classUri),
        comment: binding?.comment?.value || '',
      };
    } catch (error) {
      return {
        uri: classUri,
        name: this.extractLocalName(classUri),
        label: this.extractLocalName(classUri),
      };
    }
  }

  /**
   * Extrae el nombre local de una URI (la parte después del # o último /)
   */
  private extractLocalName(uri: string): string {
    if (!uri) return '';
    const hashIndex = uri.lastIndexOf('#');
    const slashIndex = uri.lastIndexOf('/');
    const index = Math.max(hashIndex, slashIndex);
    return index >= 0 ? uri.substring(index + 1) : uri;
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
      // Solo registrar el acceso sin actualizar campos que no existen
      this.logger.debug(`Document ${documentId} accessed`);
    } catch (error) {
      this.logger.debug(`Failed to track document access: ${error.message}`);
    }
  }
}
