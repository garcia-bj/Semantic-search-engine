# Buscador Semántico - Motor de Búsqueda Avanzado

Sistema completo de búsqueda semántica para bases de conocimiento OWL/RDF con capacidades avanzadas de indexación, búsqueda multilingüe, y funcionalidad offline.

## 🌟 Características Principales

### 🔍 Búsqueda Avanzada
- **6 tipos de búsqueda SPARQL**: Simple, por sujeto/predicado/objeto, por patrón, difusa
- **Elasticsearch integrado**: Búsquedas 10-20x más rápidas
- **Autocompletado inteligente**: Sugerencias mientras escribes
- **Ranking semántico**: TF-IDF + BM25 para resultados relevantes
- **WebSocket**: Resultados en tiempo real

### 🌍 Multilingüe
- **Español** (por defecto)
- **Inglés**
- Detección automática del navegador
- Fácil agregar más idiomas

### 📱 PWA (Progressive Web App)
- **Funciona offline**: Sin conexión a internet
- **Instalable**: Como app nativa en dispositivos
- **Sincronización automática**: Al reconectar
- **Service Worker**: Caché inteligente

### 🗄️ Almacenamiento Híbrido
- **PostgreSQL**: Metadatos de documentos
- **Apache Fuseki**: Triple store nativo para RDF
- **Elasticsearch**: Índice full-text optimizado
- **IndexedDB**: Almacenamiento local offline

---

## 🏗️ Arquitectura

```
┌─────────────────────────────┐
│      Frontend (PWA)         │
│  ┌────────────────────────┐ │
│  │   Service Worker       │ │
│  │   IndexedDB            │ │
│  │   i18n (ES/EN)         │ │
│  └────────────────────────┘ │
└──────────────┬──────────────┘
               │ HTTP + WebSocket
               ▼
┌──────────────────────────────┐
│       Backend (NestJS)       │
│  ┌────────────────────────┐  │
│  │  SearchService         │  │
│  │  - Semantic Ranking    │  │
│  │  - SPARQL Queries      │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  OntologyService       │  │
│  │  - RDF Parsing         │  │
│  │  - Auto-indexing       │  │
│  └────────────────────────┘  │
└──────────┬───────────────────┘
           │
    ┌──────┴──────┬──────────────┬──────────────┐
    │             │              │              │
    ▼             ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌──────────────┐  ┌──────────┐
│Postgres │  │ Fuseki  │  │Elasticsearch │  │IndexedDB │
│(Meta)   │  │(Triples)│  │(Full-text)   │  │(Offline) │
└─────────┘  └─────────┘  └──────────────┘  └──────────┘
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- **Node.js** v18 o superior
- **Docker** y Docker Compose
- **npm** o **yarn**

### Paso 1: Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd BUSCADOR_SEMANTICO
```

### Paso 2: Iniciar Servicios con Docker
```bash
cd backend
docker-compose up -d
```

Esto iniciará:
- **PostgreSQL** (puerto 5433)
- **Apache Fuseki** (puerto 3030)
- **Elasticsearch** (puerto 9200)

### Paso 3: Configurar Fuseki
1. Accede a http://localhost:3030
2. Usuario: `admin`, Contraseña: `admin123`
3. Click en "Manage datasets" → "Add new dataset"
4. Dataset name: `semantic-search`
5. Dataset type: "Persistent (TDB2)"
6. Click "Create dataset"

### Paso 4: Configurar Backend
```bash
cd backend
npm install

# Configurar variables de entorno
# El archivo .env.example contiene las configuraciones necesarias
# Copiar y ajustar si es necesario:
# cp .env.example .env

# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migración de base de datos
npx prisma db push

# Iniciar servidor de desarrollo
npm run start:dev
```

El backend estará disponible en http://localhost:3001

> **Nota importante**: Si encuentras el error "tripleCount no existe en el tipo DocumentCreateInput", ejecuta `npx prisma generate` para regenerar el cliente de Prisma.

### Paso 5: Configurar Frontend
```bash
cd ../frontend
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en http://localhost:3000

---

## 🔧 Solución de Problemas Comunes

### Error: "tripleCount no existe en el tipo DocumentCreateInput"
**Causa**: El cliente de Prisma está desactualizado.

**Solución**:
```bash
cd backend
npx prisma generate
```

### Error: "Port 3001 is already in use"
**Causa**: Ya hay un proceso usando el puerto 3001.

**Solución**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Error al iniciar Docker
**Causa**: Docker no está corriendo o hay conflictos de puertos.

**Solución**:
1. Verifica que Docker Desktop esté corriendo
2. Verifica que los puertos 5433, 3030 y 9200 estén disponibles
3. Reinicia los contenedores:
```bash
cd backend
docker-compose down
docker-compose up -d
```

### El backend no se conecta a Fuseki
**Causa**: El dataset no está creado en Fuseki.

**Solución**:
1. Accede a http://localhost:3030
2. Verifica que exista el dataset `semantic-search`
3. Si no existe, créalo siguiendo el Paso 3 de instalación

---

## 📚 API Endpoints

### Búsqueda

#### Búsqueda Simple
```bash
GET /search?q=term&lang=es
```

#### Búsqueda Rápida (Elasticsearch)
```bash
GET /search/fast?q=term&lang=es
```

#### Autocompletado
```bash
GET /search/autocomplete?q=fu
```

#### Búsqueda por Sujeto
```bash
GET /search/subject?uri=http://example.org/subject
```

#### Búsqueda por Predicado
```bash
GET /search/predicate?uri=http://example.org/predicate
```

#### Búsqueda por Objeto
```bash
GET /search/object?value=someValue
```

#### Búsqueda Difusa
```bash
GET /search/fuzzy?q=term&threshold=0.7&lang=es
```

#### Búsqueda por Patrón
```bash
POST /search/pattern
Content-Type: application/json

{
  "subject": "http://example.org/Subject",
  "predicate": "http://example.org/predicate",
  "object": "value",
  "language": "es"
}
```

### WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// Enviar búsqueda
socket.emit('search:query', {
  query: 'fuego',
  language: 'es',
  type: 'simple'
});

// Recibir progreso
socket.on('search:progress', (data) => {
  console.log(data.message);
});

// Recibir resultados
socket.on('search:results', (data) => {
  console.log(data.results);
});

// Búsqueda completada
socket.on('search:complete', (data) => {
  console.log(data.message);
});
```

### Gestión de Documentos

#### Subir Documento OWL/RDF
```bash
POST /upload
Content-Type: multipart/form-data

file: <archivo.owl>
```

#### Listar Documentos
```bash
GET /upload/documents
```

#### Eliminar Documento
```bash
DELETE /upload/:id
```

---

## 🌐 Uso

### 1. Subir Base de Conocimiento
1. Ve a la sección **Base de Conocimiento**
2. Click en **Subir OWL/RDF**
3. Selecciona tu archivo `.owl` o `.rdf`
4. El sistema automáticamente:
   - Parsea el archivo (rdflib)
   - Guarda metadatos en PostgreSQL
   - Almacena tripletas en Fuseki
   - Indexa en Elasticsearch

### 2. Realizar Búsquedas
1. Ve al **Buscador**
2. Escribe tu consulta
3. Selecciona idioma (opcional)
4. Obtén resultados ordenados por relevancia

### 3. Cambiar Idioma
- Click en el selector de idioma (🇪🇸/🇬🇧)
- O navega a `/es` o `/en`

### 4. Usar Offline
1. Visita la aplicación online
2. Desconecta internet
3. La app sigue funcionando
4. Los cambios se sincronizan al reconectar

### 5. Instalar como App
1. Chrome: Click en "Instalar Buscador Semántico"
2. La app se abre como aplicación nativa
3. Funciona offline

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **NestJS** - Framework Node.js
- **Apache Fuseki** - Triple store RDF
- **Elasticsearch** - Motor de búsqueda
- **SPARQL** - Lenguaje de consulta RDF
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **rdflib** - Parser RDF/OWL
- **Socket.io** - WebSocket
- **nestjs-i18n** - Internacionalización

### Frontend
- **Next.js 16** - Framework React
- **React 19** - Biblioteca UI
- **TailwindCSS 4** - Estilos
- **TypeScript** - Tipado estático
- **next-i18next** - i18n
- **idb** - IndexedDB
- **Socket.io-client** - WebSocket

### Infraestructura
- **Docker** - Contenerización
- **Docker Compose** - Orquestación

---

## ⚙️ Configuración Avanzada

### Variables de Entorno (Backend)

Crea un archivo `.env` en el directorio `backend` con el siguiente contenido:

```env
# Base de datos
DATABASE_URL="postgresql://semantic_user:semantic_password@localhost:5433/semantic_search"

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

### Variables de Entorno (Frontend)

Crea un archivo `.env.local` en el directorio `frontend` con el siguiente contenido:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📊 Performance

| Operación | Tiempo | Notas |
|-----------|--------|-------|
| Búsqueda SPARQL | 200-500ms | Fuseki |
| Búsqueda Elasticsearch | 10-50ms | 10-20x más rápido |
| Autocompletado | 5-15ms | Ultra-rápido |
| Upload OWL | 1-5s | Depende del tamaño |
| Indexación | 100-500ms | Automática |

---

## 🔒 Seguridad

### Producción
- Cambiar contraseñas por defecto
- Configurar CORS apropiadamente
- Usar HTTPS
- Implementar autenticación
- Rate limiting en API

### Desarrollo
- Contraseñas en `.env`
- No commitear secrets
- Usar variables de entorno

---

## 📱 PWA - Funcionalidad Offline

### Características
- **Service Worker**: Caché inteligente
- **IndexedDB**: Almacenamiento local
- **Sync Manager**: Sincronización automática
- **Manifest**: Instalable como app

### Uso Offline
1. La app cachea automáticamente
2. Búsquedas usan caché local
3. Uploads se guardan en IndexedDB
4. Al reconectar, sincroniza automáticamente

---

## 🌍 Internacionalización (i18n)

### Idiomas Soportados
- 🇪🇸 **Español** (por defecto)
- 🇬🇧 **Inglés**

### Agregar Nuevo Idioma

**Backend**:
1. Crear `src/i18n/fr/messages.json`
2. Traducir todos los mensajes

**Frontend**:
1. Crear `public/locales/fr/common.json`
2. Traducir todas las claves
3. Actualizar `next-i18next.config.js`:
```javascript
locales: ['es', 'en', 'fr']
```

---

## 🧪 Testing

```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

---

## 📦 Build para Producción

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

---

## 🔄 Flujo de Trabajo de Desarrollo

### Desarrollo Típico
1. Inicia Docker: `cd backend && docker-compose up -d`
2. Inicia backend: `cd backend && npm run start:dev`
3. Inicia frontend: `cd frontend && npm run dev`
4. Accede a http://localhost:3000

### Después de Cambios en el Schema de Prisma
```bash
cd backend
npx prisma generate  # Regenerar cliente
npx prisma db push   # Aplicar cambios a la BD
```

### Limpieza de Archivos Temporales
Los archivos subidos temporalmente se limpian automáticamente después de ser procesados. Si necesitas limpiar manualmente:
```bash
cd backend
rm -rf uploads/*
```

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 👥 Autores

- **Brandon Garcia** - Desarrollo completo
