import { Injectable, Logger } from '@nestjs/common';
import { SparqlService } from '../sparql/sparql.service';
import * as natural from 'natural';
import nlp from 'compromise';

export interface ExpandedQuery {
    original: string;
    expanded: string[];
    entities: string[];
    concepts: string[];
}

@Injectable()
export class QueryExpansionService {
    private readonly logger = new Logger(QueryExpansionService.name);
    private readonly tokenizer: natural.WordTokenizer;
    private readonly stemmer = natural.PorterStemmerEs; // Stemmer en español

    // Sinónimos comunes para búsqueda semántica
    private readonly synonyms: Map<string, string[]> = new Map([
        ['doctor', ['médico', 'physician', 'profesional de la salud', 'doctor']],
        ['médico', ['doctor', 'physician', 'profesional de la salud', 'médico']],
        ['serie', ['show', 'programa', 'serie de tv', 'serie']],
        ['show', ['serie', 'programa', 'serie de tv', 'show']],
        ['familia', ['family', 'parientes', 'familiares', 'familia']],
        ['family', ['familia', 'parientes', 'familiares', 'family']],
        ['tiempo', ['time', 'temporal', 'tiempo']],
        ['time', ['tiempo', 'temporal', 'time']],
        ['viaje', ['travel', 'journey', 'trip', 'viaje']],
        ['travel', ['viaje', 'journey', 'trip', 'travel']],
        ['crimen', ['crime', 'delito', 'criminal', 'crimen']],
        ['crime', ['crimen', 'delito', 'criminal', 'crime']],
    ]);

    constructor(private sparqlService: SparqlService) {
        this.tokenizer = new natural.WordTokenizer();
    }

    /**
     * Expande una consulta con sinónimos y términos relacionados
     */
    async expandQuery(query: string): Promise<ExpandedQuery> {
        const normalizedQuery = query.trim().toLowerCase();

        try {
            // 1. Extraer entidades y conceptos usando NLP
            const doc = nlp(query);
            const entities = this.extractEntities(doc);
            const concepts = this.extractConcepts(normalizedQuery);

            // 2. Tokenizar y obtener sinónimos
            const tokens = this.tokenizer.tokenize(normalizedQuery) || [];
            const expandedTerms = new Set<string>([normalizedQuery]);

            // 3. Añadir sinónimos conocidos
            for (const token of tokens) {
                const synonymList = this.synonyms.get(token.toLowerCase());
                if (synonymList) {
                    synonymList.forEach(syn => expandedTerms.add(syn));
                }
            }

            // 4. Buscar términos relacionados en la ontología
            const ontologyTerms = await this.findRelatedTermsInOntology(normalizedQuery);
            ontologyTerms.forEach(term => expandedTerms.add(term));

            // 5. Añadir variaciones con stemming
            const stemmedTerms = this.generateStemmedVariations(tokens);
            stemmedTerms.forEach(term => expandedTerms.add(term));

            const result: ExpandedQuery = {
                original: query,
                expanded: Array.from(expandedTerms).filter(t => t !== normalizedQuery),
                entities,
                concepts,
            };

            this.logger.log(
                `Query expansion: "${query}" -> ${result.expanded.length} additional terms`,
            );

            return result;
        } catch (error) {
            this.logger.error(`Query expansion failed: ${error.message}`);
            return {
                original: query,
                expanded: [],
                entities: [],
                concepts: [],
            };
        }
    }

    /**
     * Extrae entidades nombradas del texto
     */
    private extractEntities(doc: any): string[] {
        const entities: string[] = [];

        try {
            // Personas
            const people = doc.people().out('array');
            entities.push(...people);

            // Lugares
            const places = doc.places().out('array');
            entities.push(...places);

            // Organizaciones
            const organizations = doc.organizations().out('array');
            entities.push(...organizations);
        } catch (error) {
            // Ignorar errores de extracción
        }

        return entities.filter((e, i, arr) => arr.indexOf(e) === i); // Únicos
    }

    /**
     * Extrae conceptos clave del texto
     */
    private extractConcepts(text: string): string[] {
        const concepts: string[] = [];

        // Palabras clave comunes en búsquedas semánticas
        const conceptPatterns = [
            /viaj(e|es|ar) (en|a través|por) (el )?tiempo/i,
            /máquina (del|de) tiempo/i,
            /paradoja temporal/i,
            /serie (de|sobre) (crímenes|detectives|policía)/i,
            /drama familiar/i,
            /ciencia ficción/i,
            /comedia romántica/i,
        ];

        for (const pattern of conceptPatterns) {
            const match = text.match(pattern);
            if (match) {
                concepts.push(match[0]);
            }
        }

        return concepts;
    }

    /**
     * Busca términos relacionados en la ontología usando SPARQL
     */
    private async findRelatedTermsInOntology(term: string): Promise<string[]> {
        try {
            const query = `
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX owl: <http://www.w3.org/2002/07/owl#>
        
        SELECT DISTINCT ?relatedLabel
        WHERE {
          {
            ?subject rdfs:label ?label .
            FILTER(regex(str(?label), "${this.escapeRegex(term)}", "i"))
            ?subject ?relation ?related .
            ?related rdfs:label ?relatedLabel .
            FILTER(?relation IN (skos:related, owl:sameAs, rdfs:seeAlso))
          }
          UNION
          {
            ?subject rdfs:label ?label .
            FILTER(regex(str(?label), "${this.escapeRegex(term)}", "i"))
            ?related ?relation ?subject .
            ?related rdfs:label ?relatedLabel .
            FILTER(?relation IN (skos:related, owl:sameAs, rdfs:seeAlso))
          }
        }
        LIMIT 10
      `;

            const results = await this.sparqlService.query(query);

            if (results?.results?.bindings) {
                return results.results.bindings
                    .map((binding: any) => binding.relatedLabel?.value)
                    .filter((label: string) => label && label.trim().length > 0);
            }

            return [];
        } catch (error) {
            this.logger.debug(`Ontology term search failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Genera variaciones usando stemming
     */
    private generateStemmedVariations(tokens: string[]): string[] {
        const variations: string[] = [];

        for (const token of tokens) {
            try {
                const stem = this.stemmer.stem(token);
                if (stem && stem !== token) {
                    variations.push(stem);
                }
            } catch (error) {
                // Ignorar errores de stemming
            }
        }

        return variations;
    }

    /**
     * Escapa caracteres especiales para regex en SPARQL
     */
    private escapeRegex(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Añade sinónimos personalizados
     */
    addSynonym(word: string, synonyms: string[]): void {
        const normalizedWord = word.toLowerCase();
        const existing = this.synonyms.get(normalizedWord) || [];
        this.synonyms.set(normalizedWord, [...existing, ...synonyms]);

        this.logger.log(`Added synonyms for "${word}": ${synonyms.join(', ')}`);
    }

    /**
     * Construye una query SPARQL expandida
     */
    buildExpandedSparqlQuery(expandedQuery: ExpandedQuery, language?: string): string {
        const allTerms = [expandedQuery.original, ...expandedQuery.expanded];
        const regexPattern = allTerms.map(t => this.escapeRegex(t)).join('|');

        const languageFilter = language ? `FILTER(lang(?object) = "${language}")` : '';

        return `
      SELECT DISTINCT ?subject ?predicate ?object
      WHERE {
        ?subject ?predicate ?object .
        FILTER(
          regex(str(?subject), "${regexPattern}", "i") ||
          regex(str(?predicate), "${regexPattern}", "i") ||
          regex(str(?object), "${regexPattern}", "i")
        )
        ${languageFilter}
      }
      LIMIT 100
    `;
    }
}
