import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
    fusekiConfig,
    getFusekiQueryUrl,
    getFusekiUpdateUrl,
    getFusekiDataUrl,
} from '../../config/fuseki.config';

@Injectable()
export class SparqlService {
    private readonly logger = new Logger(SparqlService.name);
    private readonly httpClient: AxiosInstance;

    constructor() {
        this.httpClient = axios.create({
            timeout: fusekiConfig.timeout,
            auth: {
                username: fusekiConfig.username,
                password: fusekiConfig.password,
            },
        });
    }

    /**
     * Ejecuta una query SPARQL SELECT
     */
    async query(sparqlQuery: string): Promise<any> {
        try {
            const response = await this.httpClient.post(
                getFusekiQueryUrl(),
                `query=${encodeURIComponent(sparqlQuery)}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'application/sparql-results+json',
                    },
                },
            );

            return response.data;
        } catch (error) {
            this.logger.error(`SPARQL Query failed: ${error.message}`);
            throw new Error(`Failed to execute SPARQL query: ${error.message}`);
        }
    }

    /**
     * Ejecuta una actualización SPARQL (INSERT, DELETE, etc.)
     */
    async update(sparqlUpdate: string): Promise<void> {
        try {
            await this.httpClient.post(
                getFusekiUpdateUrl(),
                `update=${encodeURIComponent(sparqlUpdate)}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            this.logger.log('SPARQL update executed successfully');
        } catch (error) {
            this.logger.error(`SPARQL Update failed: ${error.message}`);
            throw new Error(`Failed to execute SPARQL update: ${error.message}`);
        }
    }

    /**
     * Inserta tripletas RDF en Fuseki
     */
    async insertTriples(triples: Array<{ subject: string; predicate: string; object: string; language?: string }>): Promise<void> {
        const triplesData = triples.map((triple) => {
            const objectValue = triple.language
                ? `"${this.escapeString(triple.object)}"@${triple.language}`
                : this.isUri(triple.object)
                    ? `<${triple.object}>`
                    : `"${this.escapeString(triple.object)}"`;

            return `<${triple.subject}> <${triple.predicate}> ${objectValue} .`;
        }).join('\n');

        const sparqlUpdate = `
      INSERT DATA {
        ${triplesData}
      }
    `;

        await this.update(sparqlUpdate);
    }

    /**
     * Sube datos RDF directamente a Fuseki
     */
    async uploadRdf(rdfContent: string, contentType: string = 'application/rdf+xml'): Promise<void> {
        try {
            await this.httpClient.post(getFusekiDataUrl(), rdfContent, {
                headers: {
                    'Content-Type': contentType,
                },
            });

            this.logger.log('RDF data uploaded successfully');
        } catch (error) {
            this.logger.error(`RDF upload failed: ${error.message}`);
            throw new Error(`Failed to upload RDF data: ${error.message}`);
        }
    }

    /**
     * Busca tripletas que coincidan con el patrón
     */
    async searchTriples(searchTerm: string, language?: string): Promise<any> {
        const languageFilter = language ? `FILTER(lang(?object) = "${language}")` : '';

        const sparqlQuery = `
      ${this.getPrefixes()}
      
      SELECT ?subject ?predicate ?object
      WHERE {
        ?subject ?predicate ?object .
        FILTER(
          regex(str(?subject), "${this.escapeString(searchTerm)}", "i") ||
          regex(str(?predicate), "${this.escapeString(searchTerm)}", "i") ||
          regex(str(?object), "${this.escapeString(searchTerm)}", "i")
        )
        ${languageFilter}
      }
      LIMIT 50
    `;

        return this.query(sparqlQuery);
    }

    /**
     * Verifica la conexión con Fuseki
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.httpClient.get(`${fusekiConfig.baseUrl}/$/ping`);
            return response.status === 200;
        } catch (error) {
            this.logger.error(`Fuseki health check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Genera los prefijos SPARQL comunes
     */
    private getPrefixes(): string {
        return Object.entries(fusekiConfig.prefixes)
            .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
            .join('\n');
    }

    /**
     * Escapa caracteres especiales en strings para SPARQL
     */
    private escapeString(str: string): string {
        return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }

    /**
     * Verifica si un string es una URI
     */
    private isUri(str: string): boolean {
        return str.startsWith('http://') || str.startsWith('https://');
    }
}
