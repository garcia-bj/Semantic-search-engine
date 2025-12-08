export const fusekiConfig = {
    baseUrl: process.env.FUSEKI_URL || 'http://localhost:3030',
    dataset: process.env.FUSEKI_DATASET || 'semantic', // Cambiado para coincidir con docker-compose
    username: process.env.FUSEKI_USERNAME || 'admin',
    password: process.env.FUSEKI_PASSWORD || 'admin123',

    // Endpoints
    endpoints: {
        query: '/query',
        update: '/update',
        data: '/data',
        upload: '/upload',
    },

    // Timeout en milisegundos
    timeout: 30000,

    // Prefijos comunes para queries SPARQL
    prefixes: {
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
        owl: 'http://www.w3.org/2002/07/owl#',
        xsd: 'http://www.w3.org/2001/XMLSchema#',
        dc: 'http://purl.org/dc/elements/1.1/',
        dcterms: 'http://purl.org/dc/terms/',
        foaf: 'http://xmlns.com/foaf/0.1/',
        skos: 'http://www.w3.org/2004/02/skos/core#',
    },
};

export const getFusekiDatasetUrl = () => {
    return `${fusekiConfig.baseUrl}/${fusekiConfig.dataset}`;
};

export const getFusekiQueryUrl = () => {
    return `${getFusekiDatasetUrl()}${fusekiConfig.endpoints.query}`;
};

export const getFusekiUpdateUrl = () => {
    return `${getFusekiDatasetUrl()}${fusekiConfig.endpoints.update}`;
};

export const getFusekiDataUrl = () => {
    return `${getFusekiDatasetUrl()}${fusekiConfig.endpoints.data}`;
};
