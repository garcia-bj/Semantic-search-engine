export const elasticsearchConfig = {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',

    // Índices
    indices: {
        triples: 'semantic-triples',
    },

    // Configuración de búsqueda
    search: {
        maxResults: 100,
        fuzziness: 'AUTO',
        minimumShouldMatch: '75%',
    },

    // Configuración de autocompletado
    autocomplete: {
        maxSuggestions: 10,
        fuzziness: 2,
    },
};

export const getElasticsearchClient = () => {
    const { Client } = require('@elastic/elasticsearch');
    return new Client({ node: elasticsearchConfig.node });
};
