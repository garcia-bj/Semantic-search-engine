# 🔧 Backend - Arquitectura y Documentación Técnica

## 📋 Índice
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Infraestructura (Docker Compose)](#infraestructura-docker-compose)
- [Estructura de Directorios](#estructura-de-directorios)
- [Módulos Principales](#módulos-principales)
- [Flujo de Datos](#flujo-de-datos)
- [Comandos y Scripts](#comandos-y-scripts)

---

## 📖 Descripción General

El backend es una aplicación **NestJS** que actúa como el cerebro del sistema de búsqueda semántica. Coordina múltiples servicios (PostgreSQL, Fuseki, Elasticsearch) y proporciona una API RESTful para el frontend.

**Responsabilidades principales:**
- Procesamiento y almacenamiento de archivos OWL/RDF
- Ejecución de consultas SPARQL contra Apache Fuseki
- Indexación y búsqueda en Elasticsearch
- Integración con DBpedia para enriquecimiento de datos
- Conversión automática de formatos de ontologías

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (NestJS)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Layer (Controllers)                         │   │
│  │  - OntologyController: Upload OWL/RDF            │   │
│  │  - SearchController: Búsquedas semánticas        │   │
│  │  - DbpediaController: Integración externa        │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Business Logic (Services)                       │   │
│  │  - OntologyService: Procesamiento RDF            │   │
│  │  - SearchService: Orquestación de búsquedas      │   │
│  │  - SparqlService: Generación de queries         │   │
│  │  - ElasticsearchService: Indexación             │   │
│  └──────────────────────────────────────────────────┘   │
└───┬─────────┬──────────────┬──────────────────────────┘
    │         │              │
    ▼         ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐
│PostgreSQL│ │  Fuseki  │ │Elasticsearch │
│(Metadata)│ │(Triples) │ │(Full-text)   │
└─────────┘ └──────────┘ └──────────────┘
```

---

## 🐳 Infraestructura (Docker Compose)

El archivo `docker-compose.yml` define la infraestructura de servicios externos necesarios para el backend.

### Servicios Definidos

#### 1. **Elasticsearch** (`semantic-search-es`)
```yaml
image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
ports: 9200:9200
```

**Propósito**: Motor de búsqueda de texto completo de alto rendimiento.

**Configuración clave**:
- `discovery.type=single-node`: Modo de nodo único (desarrollo)
- `xpack.security.enabled=false`: Seguridad deshabilitada (solo desarrollo)
- `ES_JAVA_OPTS=-Xms512m -Xmx512m`: Límite de memoria JVM

**Volumen persistente**: `es_data` → `/usr/share/elasticsearch/data`

**Uso en el backend**:
- Indexación automática de tripletas RDF para búsqueda rápida
- Búsqueda de texto completo con ranking BM25
- Autocompletado de términos

---

#### 2. **Apache Fuseki** (`semantic-search-fuseki`)
```yaml
image: stain/jena-fuseki
ports: 3030:3030
```

**Propósito**: Triple store nativo para almacenar y consultar datos RDF mediante SPARQL.

**Configuración clave**:
- `ADMIN_PASSWORD=admin123`: Contraseña del administrador
- Dataset: `/semantic-search` (debe crearse manualmente en primera ejecución)

**Volumen persistente**: `fuseki_data` → `/fuseki`

**Uso en el backend**:
- Almacenamiento de todas las tripletas extraídas de archivos OWL/RDF
- Ejecución de consultas SPARQL complejas
- Razonamiento semántico sobre ontologías

**⚠️ Configuración inicial requerida**:
1. Acceder a `http://localhost:3030`
2. Login: `admin` / `admin123`
3. Crear dataset `semantic-search` (tipo: Persistent TDB2)

---

#### 3. **Red Docker** (`semantic-net`)
Red bridge personalizada para comunicación entre contenedores.

---

## 📂 Estructura de Directorios

```
backend/
├── src/
│   ├── modules/           # Módulos funcionales de NestJS
│   │   ├── database/      # Prisma ORM (PostgreSQL)
│   │   ├── dbpedia/       # Integración con DBpedia
│   │   ├── elasticsearch/ # Cliente de Elasticsearch
│   │   ├── ontology/      # Procesamiento de OWL/RDF
│   │   ├── search/        # Lógica de búsqueda
│   │   └── sparql/        # Generación de queries SPARQL
│   ├── config/            # Configuraciones de servicios
│   ├── i18n/              # Traducciones (es/en)
│   ├── app.module.ts      # Módulo raíz de NestJS
│   └── main.ts            # Punto de entrada
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
├── scripts/
│   └── convert_owl.py     # Conversión de ontologías (Python)
├── uploads/               # Archivos OWL/RDF subidos
├── docker-compose.yml     # Definición de infraestructura
├── .env                   # Variables de entorno
└── package.json           # Dependencias Node.js
```

---

## 🧩 Módulos Principales

### 1. **`modules/database/`** - Prisma ORM
**Archivos**:
- `prisma.module.ts`: Módulo NestJS
- `prisma.service.ts`: Servicio singleton de Prisma Client

**Responsabilidad**:
- Conexión a PostgreSQL
- Gestión de transacciones
- Acceso a modelos de datos (`Document`)

**Modelo de datos** (`prisma/schema.prisma`):
```prisma
model Document {
  id          String   @id @default(uuid())
  filename    String
  filePath    String?   // Ruta del archivo en uploads/
  tripleCount Int      @default(0)
  createdAt   DateTime @default(now())
}
```

---

### 2. **`modules/ontology/`** - Procesamiento de Ontologías
**Archivos**:
- `ontology.controller.ts`: Endpoints de carga/eliminación
- `ontology.service.ts`: Lógica de procesamiento
- `ontology.module.ts`: Configuración del módulo

**Flujo de procesamiento**:
1. **Recepción**: Multer guarda archivo en `uploads/`
2. **Detección de formato**: Verifica si es OWL/XML o RDF/XML
3. **Conversión** (si es necesario):
   - Ejecuta `scripts/convert_owl.py` con Python
   - Utiliza `owlready2` para convertir a RDF/XML
4. **Parsing**: `rdflib.js` extrae tripletas (sujeto, predicado, objeto)
5. **Almacenamiento**:
   - Metadatos → PostgreSQL (vía Prisma)
   - Tripletas → Fuseki (vía SPARQL INSERT)
   - Índice → Elasticsearch

**Endpoints**:
- `POST /upload`: Subir archivo OWL/RDF
- `GET /upload/documents`: Listar documentos
- `DELETE /upload/:id`: Eliminar documento

---

### 3. **`modules/search/`** - Motor de Búsqueda
**Archivos**:
- `search.controller.ts`: Endpoints de búsqueda
- `search.service.ts`: Orquestación de búsquedas
- `search.module.ts`: Configuración

**Tipos de búsqueda implementados**:
1. **Búsqueda simple** (`GET /search?q=term`):
   - Busca en Fuseki (SPARQL) y Elasticsearch en paralelo
   - Combina y rankea resultados

2. **Búsqueda rápida** (`GET /search/fast?q=term`):
   - Solo Elasticsearch (10-20x más rápido)

3. **Autocompletado** (`GET /search/autocomplete?q=fu`):
   - Sugerencias en tiempo real

4. **Búsqueda por componente**:
   - Por sujeto: `GET /search/subject?uri=...`
   - Por predicado: `GET /search/predicate?uri=...`
   - Por objeto: `GET /search/object?value=...`

**Algoritmo de ranking**:
- TF-IDF para relevancia textual
- BM25 en Elasticsearch
- Boost por coincidencia exacta

---

### 4. **`modules/sparql/`** - Generación de Queries SPARQL
**Archivos**:
- `sparql.service.ts`: Generador de queries
- `sparql.module.ts`: Configuración

**Responsabilidad**:
- Construir queries SPARQL dinámicamente según tipo de búsqueda
- Ejecutar queries contra Fuseki
- Parsear resultados JSON

**Ejemplo de query generada**:
```sparql
SELECT ?subject ?predicate ?object
WHERE {
  ?subject ?predicate ?object .
  FILTER(
    CONTAINS(LCASE(STR(?subject)), "person") ||
    CONTAINS(LCASE(STR(?object)), "person")
  )
}
LIMIT 100
```

---

### 5. **`modules/elasticsearch/`** - Indexación
**Archivos**:
- `elasticsearch.service.ts`: Cliente de Elasticsearch
- `elasticsearch.module.ts`: Configuración

**Responsabilidad**:
- Crear índice `semantic-triples` al inicio
- Indexar tripletas automáticamente al subir archivos
- Ejecutar búsquedas de texto completo

**Estructura del índice**:
```json
{
  "subject": "http://example.org/Person",
  "predicate": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  "object": "http://xmlns.com/foaf/0.1/Person",
  "documentId": "uuid-123"
}
```

---

### 6. **`modules/dbpedia/`** - Integración Externa
**Archivos**:
- `dbpedia.controller.ts`: Endpoint de búsqueda
- `dbpedia.service.ts`: Cliente HTTP a DBpedia
- `dbpedia.module.ts`: Configuración

**Responsabilidad**:
- Ejecutar búsquedas en DBpedia Lookup API
- Enriquecer resultados locales con datos externos
- Cachear respuestas (opcional)

**Endpoint**:
- `GET /dbpedia/search?q=term&lang=es`

---

## 🔄 Flujo de Datos Completo

### Carga de Archivo
```
Usuario → Frontend → POST /upload
                        ↓
                   OntologyController
                        ↓
                   OntologyService
                   ├─→ Detectar formato
                   ├─→ Convertir (Python) si es necesario
                   ├─→ Parsear RDF (rdflib)
                   ├─→ Guardar metadatos (Prisma → PostgreSQL)
                   ├─→ Insertar tripletas (SPARQL → Fuseki)
                   └─→ Indexar (Elasticsearch)
```

### Búsqueda
```
Usuario → Frontend → GET /search?q=term
                        ↓
                   SearchController
                        ↓
                   SearchService
                   ├─→ SparqlService → Fuseki (SPARQL)
                   └─→ ElasticsearchService → Elasticsearch
                        ↓
                   Combinar y rankear resultados
                        ↓
                   Retornar JSON al frontend
```

---

## 🚀 Comandos y Scripts

### Infraestructura
```bash
# Iniciar servicios Docker
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reiniciar un servicio específico
docker-compose restart fuseki
```

### Base de Datos
```bash
# Generar cliente Prisma (después de cambios en schema.prisma)
npx prisma generate

# Sincronizar esquema con PostgreSQL
npx prisma db push

# Abrir Prisma Studio (GUI)
npx prisma studio
```

### Desarrollo
```bash
# Instalar dependencias
npm install

# Modo desarrollo (hot-reload)
npm run start:dev

# Build para producción
npm run build

# Ejecutar producción
npm run start:prod
```

### Scripts Python
```bash
# Instalar dependencias Python
pip install owlready2

# Ejecutar conversión manual
python scripts/convert_owl.py path/to/file.owl
```

---

## 🔧 Variables de Entorno (`.env`)

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/semantic_search"

# Fuseki
FUSEKI_URL="http://localhost:3030"
FUSEKI_DATASET="semantic-search"
FUSEKI_USERNAME="admin"
FUSEKI_PASSWORD="admin123"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# Servidor
PORT=3001
```

---

## 📦 Dependencias Clave

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@nestjs/core` | ^10.0.0 | Framework principal |
| `@prisma/client` | ^5.0.0 | ORM para PostgreSQL |
| `rdflib` | ^2.2.0 | Parser RDF/OWL |
| `@elastic/elasticsearch` | ^8.0.0 | Cliente Elasticsearch |
| `axios` | ^1.0.0 | HTTP client (DBpedia) |
| `multer` | ^1.4.0 | Upload de archivos |

---

## 🛡️ Seguridad y Producción

**Para producción, asegúrate de**:
- Cambiar contraseñas por defecto (Fuseki, PostgreSQL)
- Habilitar autenticación en Elasticsearch
- Configurar CORS adecuadamente
- Usar HTTPS
- Implementar rate limiting
- Validar y sanitizar inputs

---

**Desarrollado con ❤️ usando NestJS y tecnologías de la Web Semántica.**
