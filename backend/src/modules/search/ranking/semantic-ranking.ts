import { Injectable } from '@nestjs/common';
import {
    SearchResult,
    ScoringFactors,
    RelevanceScoring,
} from './relevance-scoring';

@Injectable()
export class SemanticRanking {
    /**
     * Ordena resultados por relevancia semántica
     */
    rankResults(
        results: SearchResult[],
        searchTerm: string,
        totalDocuments: number,
    ): SearchResult[] {
        if (results.length === 0) return results;

        // Calcular longitud promedio de documentos
        const averageLength = this.calculateAverageLength(results);

        // Calcular score para cada resultado
        const scoredResults = results.map((result) => {
            const factors = this.extractScoringFactors(result, searchTerm, results);
            const score = RelevanceScoring.calculateFinalScore(
                factors,
                totalDocuments,
                averageLength,
            );

            return { ...result, score };
        });

        // Normalizar scores
        const normalizedResults = RelevanceScoring.normalizeScores(scoredResults);

        // Ordenar por score descendente
        return normalizedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    /**
     * Extrae factores de scoring de un resultado
     */
    private extractScoringFactors(
        result: SearchResult,
        searchTerm: string,
        allResults: SearchResult[],
    ): ScoringFactors {
        const normalizedTerm = searchTerm.toLowerCase();

        // Determinar posición del match
        const matchPosition = this.findMatchPosition(result, normalizedTerm);

        // Determinar tipo de match
        const matchType = this.determineMatchType(result, normalizedTerm);

        // Calcular frecuencia del término
        const termFrequency = this.calculateTermFrequency(result, normalizedTerm);

        // Calcular frecuencia de documento
        const documentFrequency = this.calculateDocumentFrequency(
            allResults,
            normalizedTerm,
        );

        // Longitud del resultado
        const resultLength = this.calculateResultLength(result);

        return {
            matchType,
            matchPosition,
            termFrequency,
            documentFrequency,
            resultLength,
        };
    }

    /**
     * Encuentra la posición del match (subject, predicate, object)
     */
    private findMatchPosition(
        result: SearchResult,
        term: string,
    ): 'subject' | 'predicate' | 'object' {
        if (result.subject.toLowerCase().includes(term)) return 'subject';
        if (result.predicate.toLowerCase().includes(term)) return 'predicate';
        return 'object';
    }

    /**
     * Determina el tipo de match (exact, partial, fuzzy)
     */
    private determineMatchType(
        result: SearchResult,
        term: string,
    ): 'exact' | 'partial' | 'fuzzy' {
        const values = [
            result.subject.toLowerCase(),
            result.predicate.toLowerCase(),
            result.object.toLowerCase(),
        ];

        // Exact match
        if (values.some((v) => v === term)) return 'exact';

        // Partial match (contiene el término completo)
        if (values.some((v) => v.includes(term))) return 'partial';

        // Fuzzy match
        return 'fuzzy';
    }

    /**
     * Calcula la frecuencia del término en el resultado
     */
    private calculateTermFrequency(result: SearchResult, term: string): number {
        const text = `${result.subject} ${result.predicate} ${result.object}`.toLowerCase();
        const matches = text.match(new RegExp(term, 'g'));
        return matches ? matches.length : 0;
    }

    /**
     * Calcula en cuántos documentos aparece el término
     */
    private calculateDocumentFrequency(
        results: SearchResult[],
        term: string,
    ): number {
        return results.filter((result) => {
            const text = `${result.subject} ${result.predicate} ${result.object}`.toLowerCase();
            return text.includes(term);
        }).length;
    }

    /**
     * Calcula la longitud del resultado
     */
    private calculateResultLength(result: SearchResult): number {
        return (
            result.subject.length +
            result.predicate.length +
            result.object.length
        );
    }

    /**
     * Calcula la longitud promedio de los resultados
     */
    private calculateAverageLength(results: SearchResult[]): number {
        if (results.length === 0) return 0;

        const totalLength = results.reduce(
            (sum, result) => sum + this.calculateResultLength(result),
            0,
        );

        return totalLength / results.length;
    }
}
