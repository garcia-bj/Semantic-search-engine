export interface SearchResult {
    subject: string;
    predicate: string;
    object: string;
    language?: string;
    score?: number;
}

export interface ScoringFactors {
    matchType: 'exact' | 'partial' | 'fuzzy';
    matchPosition: 'subject' | 'predicate' | 'object';
    termFrequency: number;
    documentFrequency: number;
    resultLength: number;
}

export class RelevanceScoring {
    /**
     * Calcula el score TF-IDF para un resultado
     */
    static calculateTfIdf(
        termFrequency: number,
        documentFrequency: number,
        totalDocuments: number,
    ): number {
        if (documentFrequency === 0) return 0;

        const tf = Math.log(1 + termFrequency);
        const idf = Math.log(totalDocuments / documentFrequency);

        return tf * idf;
    }

    /**
     * Calcula el score BM25
     */
    static calculateBM25(
        termFrequency: number,
        documentLength: number,
        averageDocumentLength: number,
        documentFrequency: number,
        totalDocuments: number,
        k1: number = 1.5,
        b: number = 0.75,
    ): number {
        const idf = Math.log(
            (totalDocuments - documentFrequency + 0.5) / (documentFrequency + 0.5),
        );

        const numerator = termFrequency * (k1 + 1);
        const denominator =
            termFrequency +
            k1 * (1 - b + b * (documentLength / averageDocumentLength));

        return idf * (numerator / denominator);
    }

    /**
     * Aplica boost basado en el tipo de match
     */
    static getMatchTypeBoost(matchType: 'exact' | 'partial' | 'fuzzy'): number {
        const boosts = {
            exact: 2.0,
            partial: 1.0,
            fuzzy: 0.5,
        };
        return boosts[matchType];
    }

    /**
     * Aplica boost basado en la posición del match
     */
    static getPositionBoost(
        position: 'subject' | 'predicate' | 'object',
    ): number {
        const boosts = {
            subject: 1.5,
            predicate: 1.2,
            object: 1.0,
        };
        return boosts[position];
    }

    /**
     * Calcula score final combinando todos los factores
     */
    static calculateFinalScore(
        factors: ScoringFactors,
        totalDocuments: number,
        averageDocumentLength: number,
    ): number {
        // BM25 base score
        const bm25Score = this.calculateBM25(
            factors.termFrequency,
            factors.resultLength,
            averageDocumentLength,
            factors.documentFrequency,
            totalDocuments,
        );

        // Apply boosts
        const matchTypeBoost = this.getMatchTypeBoost(factors.matchType);
        const positionBoost = this.getPositionBoost(factors.matchPosition);

        return bm25Score * matchTypeBoost * positionBoost;
    }

    /**
     * Normaliza scores a rango 0-1
     */
    static normalizeScores(results: SearchResult[]): SearchResult[] {
        if (results.length === 0) return results;

        const maxScore = Math.max(...results.map((r) => r.score || 0));
        if (maxScore === 0) return results;

        return results.map((result) => ({
            ...result,
            score: (result.score || 0) / maxScore,
        }));
    }
}
