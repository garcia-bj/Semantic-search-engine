import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class DbpediaService {
  private readonly defaultEndpoint = "https://dbpedia.org/sparql";
  private readonly esEndpoint = "https://es.dbpedia.org/sparql";

  async searchDBpedia(query: string, language: string = "en") {
    const endpoint = language === "es" ? this.esEndpoint : this.defaultEndpoint;

    // Build SPARQL query
    const sparqlQuery = this.buildSparqlQuery(query, language);

    try {
      const response = await axios.get(endpoint, {
        params: {
          query: sparqlQuery,
          format: "json",
        },
        timeout: 10000, // 10 second timeout
      });

      return this.parseResults(response.data);
    } catch (error) {
      console.error("DBpedia query error:", error.message);
      throw new HttpException(
        "Failed to query DBpedia",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildSparqlQuery(query: string, language: string): string {
    // Simple SPARQL query to search for resources by label
    return `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX dbo: <http://dbpedia.org/ontology/>
      PREFIX dbp: <http://dbpedia.org/property/>
      
      SELECT DISTINCT ?resource ?label ?abstract ?type
      WHERE {
        ?resource rdfs:label ?label .
        FILTER(CONTAINS(LCASE(?label), LCASE("${query}")))
        FILTER(LANG(?label) = "${language}" || LANG(?label) = "")
        
        OPTIONAL { ?resource dbo:abstract ?abstract . FILTER(LANG(?abstract) = "${language}") }
        OPTIONAL { ?resource rdf:type ?type }
      }
      LIMIT 20
    `;
  }

  private parseResults(data: any) {
    if (!data.results || !data.results.bindings) {
      return [];
    }

    return data.results.bindings.map((binding: any) => ({
      resource: binding.resource?.value || "",
      label: binding.label?.value || "",
      abstract: binding.abstract?.value || "",
      type: binding.type?.value || "",
    }));
  }
}
