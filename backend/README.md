# 🧠 Backend - NestJS API Gateway & Semantic Core

> **Documentación Técnica Completa del Backend**

Este es el núcleo de Synapse Search. Una aplicación **NestJS** modular que orquesta la lógica de búsqueda semántica, gestión de ontologías RDF/OWL e integración con servicios externos (DBpedia, Elasticsearch, Python ML).

---

## 📑 Tabla de Contenidos

- [Arquitectura del Backend](#️-arquitectura-del-backend)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Estructura de Módulos](#-estructura-de-módulos-nestjs)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Variables de Entorno](#-variables-de-entorno)
- [API Reference](#-api-reference)
- [Servicio de Embeddings (Python)](#-servicio-de-embeddings-python)
- [Scripts Utilitarios](#-scripts-utilitarios)
- [Flujos Clave del Sistema](#-flujos-clave-del-sistema)
- [Troubleshooting](#-troubleshooting-técnico)

---

## 🏗️ Arquitectura del Backend

El backend implementa una **Arquitectura Hexagonal simplificada** con **Domain-Driven Design (DDD)**, separando la lógica de negocio de la infraestructura.

```
┌─────────────────────────────────────────────────────────┐
│                    NestJS API Gateway                   │
│                  (Puerto 3001 - REST)                   │
└────────┬──────────┬──────────┬──────────┬──────────────┘
         │          │          │          │
    ┌────▼────┐ ┌──▼────┐ ┌───▼────┐ ┌───▼────┐
    │Ontology │ │Search │ │DBpedia │ │Embeddings│
    │ Module  │ │Module │ │ Cache  │ │ Module  │
    └────┬────┘ └──┬────┘ └───┬────┘ └───┬────┘
         │         │          │          │
    ┌────▼────┐ ┌──▼────┐ ┌───▼────┐ ┌───▼────┐
    │ SPARQL  │ │Elastic│ │Offline │ │Python  │
    │ Service │ │Search │ │15K DB  │ │Flask   │
    └────┬────┘ └──┬────┘ └────────┘ └────────┘
         │         │
    ┌────▼────┐ ┌──▼────┐
    │ Fuseki  │ │Elastic│
    │  :3030  │ │ :9200 │
    └─────────┘ └───────┘
```

### Patrón de Persistencia Políglota

Utilizamos **3 bases de datos diferentes** para aprovechar las fortalezas de cada una:

| Base de Datos | Tipo | Uso | Por qué |
|---------------|------|-----|---------|
| **PostgreSQL** | Relacional | Metadatos de archivos, usuarios | Integridad referencial (ACID) |
| **Apache Jena Fuseki** | Grafo (RDF) | Tripletas semánticas | Consultas inferenciales SPARQL |
| **Elasticsearch** | Documento/Búsqueda | Índice invertido | Búsqueda full-text ultra-rápida |

---

## 🛠️ Stack Tecnológico

### Core Framework

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NestJS** | ^10.3.0 | Framework principal (Express bajo el capó) |
| **TypeScript** | ^5.3.3 | Tipado estático y decoradores |
| **Node.js** | 18+ | Runtime JavaScript |

### ORMs y Clientes de BD

| Librería | Versión | Base de Datos |
|----------|---------|---------------|
| **Prisma** | ^5.8.0 | PostgreSQL (ORM moderno) |
| **@elastic/elasticsearch** | ^8.12.0 | Elasticsearch (Cliente oficial) |
| **axios** | ^1.6.5 | Fuseki (HTTP client para SPARQL) |

### Procesamiento Semántico

| Librería | Versión | Uso |
|----------|---------|-----|
| **rdflib** | ^2.3.0 | Parsing RDF/XML, Turtle, N-Triples |
| **n3** | ^1.17.2 | Parser RDF alternativo (más rápido) |
| **natural** | ^6.10.0 | NLP: tokenización, stemming |
| **compromise** | ^14.10.0 | NLP: análisis sintáctico |

### Servicios Externos

| Librería | Versión | Servicio |
|----------|---------|----------|
| **@google-cloud/translate** | ^9.3.0 | Google Translate API |
| **@nestjs/axios** | ^3.0.1 | HTTP requests a DBpedia |

### Validación y Transformación

| Librería | Versión | Uso |
|----------|---------|-----|
| **class-validator** | ^0.14.0 | Validación de DTOs |
| **class-transformer** | ^0.5.1 | Serialización/Deserialización |

---

## 📦 Estructura de Módulos (NestJS)

El backend está organizado en **módulos desacoplados** siguiendo el principio de **Single Responsibility**.

### Módulos Principales (`src/modules/`)

#### 1. 🗂️ **OntologyModule**
**Responsabilidad:** Gestión completa del ciclo de vida de archivos OWL/RDF.

**Servicios:**
- `OntologyService`: Lógica de negocio
- `OntologyController`: Endpoints REST

**Funcionalidades Clave:**
- ✅ **Upload Atómico**: Si falla Fuseki, hace rollback en Postgres
- ✅ **Preprocesamiento XML**: Expande entidades (`&xsd;`, `&rdf;`) antes de parsear
- ✅ **Conversión OWL/XML**: Usa Python `owlready2` para convertir formatos incompatibles
- ✅ **Inyección de Metadata**: Añade tripletas `hasDocumentId` vía SPARQL INSERT

**Flujo de Upload:**
```
1. Recibir archivo → 2. Validar formato → 3. Convertir (si es OWL/XML)
→ 4. Parsear RDF → 5. Guardar metadata (Postgres) → 6. Subir RDF (Fuseki)
→ 7. Insertar metadata triples (SPARQL) → 8. Indexar (Elasticsearch)
```

#### 2. 🕸️ **SparqlModule**
**Responsabilidad:** Comunicación con Apache Jena Fuseki.

**Servicios:**
- `SparqlService`: Wrapper de SPARQL

**Métodos Principales:**
```typescript
query(sparql: string): Promise<any[]>           // SELECT queries
update(sparql: string): Promise<void>           // INSERT/DELETE
uploadRdf(content: string, format: string)      // Subir RDF crudo
insertTriples(triples: Triple[])                // INSERT DATA batch
deleteTriplesByDocumentId(docId: string)        // DELETE WHERE
```

**Seguridad:**
- Autenticación Basic Auth (`admin:admin123` por defecto)
- Sanitización de inputs para prevenir SPARQL injection

#### 3. 🔎 **SearchModule**
**Responsabilidad:** Orquestador de búsqueda híbrida.

**Servicios:**
- `SearchService`: Coordina búsqueda en múltiples fuentes
- `SearchController`: Endpoint `/search`

**Estrategia de Búsqueda:**
1. **Búsqueda Local (Elasticsearch):** Índice de archivos subidos
2. **Búsqueda Semántica (Python):** Si está activo, re-ranking por similitud vectorial
3. **Fusión de Resultados:** Deduplicación y ordenamiento por score

#### 4. 💾 **DbpediaCacheModule**
**Responsabilidad:** Resiliencia y fallback offline.

**Servicios:**
- `DbpediaCacheService`: Implementa Circuit Breaker pattern

**Características:**
- ✅ **Base Offline:** 15,000 series en JSON (5,000 por idioma)
- ✅ **Índice Invertido en RAM:** Búsqueda <10ms
- ✅ **Timeout Configurable:** 5 segundos para DBpedia
- ✅ **Fallback Automático:** Si DBpedia falla, usa offline
- ✅ **Caché de Resultados:** Guarda respuestas de DBpedia en memoria

**Flujo de Búsqueda:**
```
Query → DBpedia (5s timeout) → Success? → Return
                             ↓ Fail
                          Offline DB → Return
```

#### 5. 🤖 **EmbeddingsModule**
**Responsabilidad:** Puente con el servicio Python de ML.

**Servicios:**
- `EmbeddingsService`: Cliente HTTP hacia Flask

**Métodos:**
```typescript
isAvailable(): boolean                          // Health check
generateEmbedding(text: string): Promise<number[]>  // Vectorizar texto
```

**Degradación Graceful:**
Si el servicio Python no está disponible, el sistema funciona en "modo degradado" (solo búsqueda léxica).

---

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Configurar Base de Datos

```bash
# Copiar configuración de ejemplo
cp .env.example .env

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy
```

### 3. Iniciar Servicios Docker

```bash
# Desde la raíz del proyecto
docker-compose up -d postgres fuseki elasticsearch
```

### 4. Iniciar Backend

```bash
# Modo desarrollo (hot-reload)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

---

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz de `backend/`:

```env
# ========================================
# BASE DE DATOS PRINCIPAL (PostgreSQL)
# ========================================
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/semantic_search?schema=public"

# ========================================
# FUSEKI (Servidor SPARQL)
# ========================================
FUSEKI_URL=http://localhost:3030
FUSEKI_DATASET=semantic
FUSEKI_USERNAME=admin
FUSEKI_PASSWORD=admin123

# ========================================
# ELASTICSEARCH
# ========================================
ELASTICSEARCH_NODE=http://localhost:9200
# ELASTICSEARCH_USERNAME=elastic  # Si tienes auth habilitado
# ELASTICSEARCH_PASSWORD=changeme

# ========================================
# SERVICIO DE EMBEDDINGS (Python)
# ========================================
PYTHON_SERVICE_URL=http://localhost:5000

# ========================================
# SERVIDOR
# ========================================
PORT=3001
NODE_ENV=development

# ========================================
# GOOGLE TRANSLATE (Opcional)
# ========================================
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### Descripción de Variables Críticas

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | String de conexión Postgres (Prisma) | `postgresql://postgres:postgres123@localhost:5432/semantic_search` |
| `FUSEKI_URL` | URL base del servidor Fuseki | `http://localhost:3030` |
| `FUSEKI_DATASET` | Nombre del dataset TDB2 en Fuseki | `semantic` |
| `FUSEKI_USERNAME` | Usuario admin de Fuseki | `admin` |
| `FUSEKI_PASSWORD` | Contraseña de Fuseki | `admin123` |
| `ELASTICSEARCH_NODE` | URL del nodo Elasticsearch | `http://localhost:9200` |
| `PYTHON_SERVICE_URL` | URL del servicio Flask de embeddings | `http://localhost:5000` |

---

## 📡 API Reference

### 🔍 Búsqueda

#### `GET /search`
Búsqueda en la base de conocimiento local (archivos subidos).

**Query Parameters:**
```typescript
{
  query: string;      // Término de búsqueda (requerido)
  language?: string;  // Código ISO: 'es' | 'en' | 'pt' (default: 'es')
  semantic?: boolean; // Forzar búsqueda vectorial (default: auto)
}
```

**Response (200 OK):**
```json
[
  {
    "id": "doc-uuid-123",
    "title": "Breaking Bad",
    "abstract": "Un profesor de química...",
    "source": "local",
    "score": 0.95,
    "metadata": {
      "genre": "Drama",
      "network": "AMC"
    }
  }
]
```

#### `GET /dbpedia-cache/search`
Búsqueda federada en DBpedia + Fallback offline.

**Query Parameters:**
```typescript
{
  q: string;     // Término de búsqueda (requerido)
  lang: string;  // 'es' | 'en' | 'pt' (requerido)
}
```

**Response (200 OK):**
```json
{
  "results": [...],
  "source": "online" | "cache" | "offline",
  "count": 42
}
```

### 📤 Gestión de Ontologías

#### `POST /ontology/upload`
Sube un archivo OWL/RDF.

**Request:**
```http
POST /ontology/upload
Content-Type: multipart/form-data

file: [binary data]
```

**Response (201 Created):**
```json
{
  "id": "doc-uuid-456",
  "filename": "tv_series.owl",
  "tripleCount": 1523,
  "uploadedAt": "2025-12-10T00:00:00Z"
}
```

#### `GET /ontology/documents`
Lista todos los documentos subidos.

**Response (200 OK):**
```json
[
  {
    "id": "doc-uuid-456",
    "filename": "tv_series.owl",
    "tripleCount": 1523,
    "createdAt": "2025-12-10T00:00:00Z"
  }
]
```

#### `DELETE /ontology/:id`
Elimina un documento y todas sus tripletas.

**Response (200 OK):**
```json
{
  "message": "Document deleted successfully"
}
```

---

## 🐍 Servicio de Embeddings (Python)

### ¿Qué hace?

Convierte texto a vectores matemáticos de 384 dimensiones usando el modelo `paraphrase-multilingual-MiniLM-L12-v2`.

### Instalación

```bash
# Instalar dependencias
pip install -r requirements-embeddings.txt

# Ejecutar servicio
python src/modules/embeddings/embedding-service.py
```

### Endpoints del Servicio Python

#### `GET /health`
```json
{
  "status": "healthy",
  "model": "paraphrase-multilingual-MiniLM-L12-v2",
  "embedding_dim": 384
}
```

#### `POST /embed`
```json
{
  "text": "Breaking Bad es una serie de drama"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, 0.789, ...]  // 384 números
}
```

### Integración con NestJS

El `EmbeddingsService` hace polling cada 30s para verificar si Python está activo:

```typescript
@Injectable()
export class EmbeddingsService {
  private available = false;

  async onModuleInit() {
    setInterval(() => this.checkHealth(), 30000);
  }

  async checkHealth() {
    try {
      await axios.get('http://localhost:5000/health');
      this.available = true;
    } catch {
      this.available = false;
    }
  }
}
```

---

## 🧪 Scripts Utilitarios

En `backend/scripts/` encontrarás herramientas de mantenimiento:

### `harvest_dbpedia.py`
Crawler que descarga datos masivos de DBpedia.

```bash
python scripts/harvest_dbpedia.py
```

**Configuración:**
- Descarga 5,000 series por idioma (ES, EN, PT)
- Guarda en `harvested_data/series_{lang}.json`
- Usa paginación (LIMIT/OFFSET) para evitar timeouts

### `generate_owl.py`
Genera archivos OWL de prueba con datos reales.

```bash
python scripts/generate_owl.py
```

**Output:** `uploads/tv_series_kb.owl` (300 series, 67 géneros)

### `wipe_db.js`
⚠️ **PELIGRO:** Borra TODA la base de datos.

```bash
node scripts/wipe_db.js
```

---

## 🔄 Flujos Clave del Sistema

### Flujo de Upload Atómico

```typescript
async saveDocument(filename, content, triples) {
  // 1. Guardar metadata en Postgres
  const doc = await this.prisma.document.create({...});
  
  try {
    // 2. Subir RDF crudo a Fuseki
    await this.sparqlService.uploadRdf(content);
    
    // 3. Inyectar metadata vía SPARQL
    await this.sparqlService.insertTriples(metadataTriples);
    
    // 4. Indexar en Elasticsearch
    await this.elasticsearchService.index(doc);
    
  } catch (error) {
    // ROLLBACK: Borrar de Postgres si algo falla
    await this.prisma.document.delete({ where: { id: doc.id } });
    throw error;
  }
}
```

### Flujo de Búsqueda Híbrida

```typescript
async search(query: string, lang: string) {
  const results = [];
  
  // 1. Búsqueda local (Elasticsearch)
  const localResults = await this.elasticsearchService.search(query);
  results.push(...localResults);
  
  // 2. Búsqueda semántica (si Python está activo)
  if (this.embeddingsService.isAvailable()) {
    const embedding = await this.embeddingsService.generateEmbedding(query);
    const semanticResults = await this.elasticsearchService.vectorSearch(embedding);
    results.push(...semanticResults);
  }
  
  // 3. Deduplicar y ordenar
  return this.deduplicateAndSort(results);
}
```

---

## 🐛 Troubleshooting Técnico

### Error: `P1001: Can't reach database server`
**Causa:** PostgreSQL no está corriendo.

**Solución:**
```bash
docker restart semantic-search-postgres-1
# O verificar logs
docker logs semantic-search-postgres-1
```

### Error: `400 Bad Request` al subir OWL
**Causa:** El archivo RDF/XML contiene entidades no declaradas (ej: `&xsd;anyURI`).

**Solución:**
El backend ya incluye `preprocessRdfContent()` que expande automáticamente:
- `&xsd;` → `http://www.w3.org/2001/XMLSchema#`
- `&rdf;` → `http://www.w3.org/1999/02/22-rdf-syntax-ns#`
- `&rdfs;` → `http://www.w3.org/2000/01/rdf-schema#`
- `&owl;` → `http://www.w3.org/2002/07/owl#`

Si persiste, valida tu RDF con [RDF Validator](http://www.w3.org/RDF/Validator/).

### Error: `ECONNREFUSED 127.0.0.1:3030`
**Causa:** Fuseki no está corriendo o el dataset no existe.

**Solución:**
```bash
# Verificar contenedor
docker ps | grep fuseki

# Acceder a Fuseki UI
# http://localhost:3030
# Login: admin / admin123
# Crear dataset "semantic" (TDB2)
```

### Error: `Heap Out Of Memory` (Node.js)
**Causa:** Carga de archivos OWL masivos (>500MB).

**Solución:**
```bash
# Aumentar memoria de Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run start:dev
```

### Warning: `Embedding service not available`
**Causa:** El servicio Python no está corriendo.

**Solución:**
```bash
python src/modules/embeddings/embedding-service.py
```

**Nota:** Es solo un warning. El backend funciona sin él (modo degradado).

---

## 📚 Recursos Adicionales

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Apache Jena Fuseki](https://jena.apache.org/documentation/fuseki2/)
- [SPARQL 1.1 Query Language](https://www.w3.org/TR/sparql11-query/)
- [RDF 1.1 Primer](https://www.w3.org/TR/rdf11-primer/)

