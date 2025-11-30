const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DBpediaResult {
    resource: string;
    label: string;
    abstract: string;
    type: string;
}

export const searchDBpedia = async (query: string, lang: string = 'es'): Promise<DBpediaResult[]> => {
    try {
        const response = await fetch(`${API_URL}/dbpedia/search?q=${encodeURIComponent(query)}&lang=${lang}`);

        if (!response.ok) {
            // Silently return empty array if DBpedia endpoint is not available
            console.warn('DBpedia endpoint not available, skipping external search');
            return [];
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        // Silently handle network errors
        console.warn('DBpedia search unavailable:', error instanceof Error ? error.message : 'Unknown error');
        return [];
    }
};
