# 🧠 Buscador Semántico de Series TV - Synapse Search

> **Más que un buscador: Un motor de descubrimiento inteligente.**
>
> Una plataforma avanzada que utiliza tecnologías de la Web Semántica para comprender el *significado* y el *contexto* detrás de tus consultas, permitiéndote explorar el universo de las series de televisión de una manera completamente nueva.

---

## 📑 Tabla de Contenidos

- [¿Qué es este proyecto?](#-qué-es-este-proyecto)
- [Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#️-stack-tecnológico-completo)
- [Prerrequisitos](#-prerrequisitos)
- [Guía de Inicio Rápido](#-guía-de-inicio-rápido)
- [Características PWA](#-características-pwa)
- [Uso del Sistema](#-uso-del-sistema)
- [Búsqueda Semántica Avanzada](#-búsqueda-semántica-avanzada-opcional)
- [Despliegue a Producción](#-despliegue-a-producción)
- [Solución de Problemas](#-solución-de-problemas-comunes)
- [Documentación Adicional](#-documentación-adicional)
- [Licencia](#-licencia)

---

## 💡 ¿Qué es este proyecto?

Este sistema es un **Motor de Búsqueda Semántica Híbrido** diseñado para superar las limitaciones de los buscadores tradicionales. Mientras que un buscador normal solo encuentra palabras clave coincidentes (ej: buscar "médico" y encontrar solo series con esa palabra en el título), este sistema **entiende conceptos**.

Combina la precisión de las **Ontologías OWL/RDF** (archivos de conocimiento estructurado) con la vastedad de **DBpedia** (la versión semántica de Wikipedia) para ofrecer resultados ricos y contextualizados.

### ¿Cómo funciona internamente?

A diferencia de los buscadores tradicionales basados en SQL o búsqueda de texto simple, este sistema está diseñado para comprender la **intención** y el **contexto** mediante el uso de **Grafos de Conocimiento**.

Cuando buscas "series de hospitales", el sistema:
1. **Búsqueda Léxica (Elasticsearch):** Encuentra coincidencias exactas o difusas de "hospitales"
2. **Búsqueda Semántica (Python + Embeddings):** Convierte tu consulta a un vector matemático y encuentra series similares conceptualmente (ej: "médicos", "medicina", "emergencias")
3. **Búsqueda Externa (DBpedia):** Consulta la Wikipedia semántica en tiempo real
4. **Base Offline (15,000 series):** Si no hay internet, busca en la base de datos local pre-cargada

---

## 🏗️ Arquitectura del Sistema

El sistema sigue una arquitectura de **microservicios orquestados** mediante Docker, implementando el patrón de **Persistencia Políglota** (diferentes bases de datos para diferentes necesidades).

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente Web / PWA                        │
│                  (Next.js 16 App Router)                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   NestJS API Gateway                        │
│              (Orquestador de Servicios)                     │
└─┬─────────┬─────────┬──────────┬──────────┬────────────────┘
  │         │         │          │          │
  ▼         ▼         ▼          ▼          ▼
┌────┐  ┌──────┐  ┌──────┐  ┌───────┐  ┌─────────┐
│ PG │  │Fuseki│  │Elastic│  │Python │  │DBpedia  │
│SQL │  │SPARQL│  │Search│  │  ML   │  │ (LOD)   │
└────┘  └──────┘  └──────┘  └───────┘  └─────────┘
Metadata  Grafos   Índices  Embeddings  Federado
```

### Componentes Clave

- **Frontend (Next.js 16):** SSR/CSR híbrido con PWA, i18n nativo
- **Backend (NestJS):** API modular con inyección de dependencias
- **PostgreSQL:** Metadatos de archivos y usuarios (ACID)
- **Apache Jena Fuseki:** Almacén de tripletas RDF/OWL (SPARQL 1.1)
- **Elasticsearch:** Búsqueda full-text ultra-rápida
- **Python (Flask):** Servicio de embeddings con Sentence Transformers

---

## 🚀 Características Principales

### 1. Descubrimiento Contextual
Encuentra series basándote en **conceptos y relaciones**, no solo en títulos.
- *Ejemplo*: Si buscas "Viajes en el tiempo", el sistema puede inferir y mostrarte series como *Dark* o *Doctor Who*, incluso si esas palabras no están en su descripción, gracias a las relaciones semánticas.

### 2. Gestión de Conocimiento Personalizada
Tienes el control total sobre la "inteligencia" del buscador.
- **Sube tus propias Ontologías**: Carga archivos `.owl` o `.rdf` para enseñar al sistema sobre nuevas series, géneros o relaciones específicas.
- **Persistencia de Datos**: Los archivos subidos se procesan, indexan y almacenan permanentemente, creando una base de conocimiento que crece contigo.
- **Atomic Uploads**: Si falla cualquier paso del proceso, se hace rollback automático para evitar datos inconsistentes.

### 3. Exploración Global (DBpedia)
No te limites a tus datos locales.
- **Búsqueda Federada**: Cada consulta se realiza simultáneamente en tu base de conocimiento local y en la nube de datos enlazados de DBpedia.
- **Enriquecimiento**: Obtén resúmenes, enlaces y datos adicionales de fuentes externas automáticamente.
- **Endpoints Multiidioma**: Busca en DBpedia en español (`es.dbpedia.org`), inglés (`dbpedia.org`) o portugués según tu idioma actual.

### 4. Base de Conocimiento Offline (15,000 Series)
Funciona sin conexión a internet.
- **Datos Pre-cargados**: 15,000 series de TV harvested de DBpedia (5,000 por idioma: EN, ES, PT).
- **Búsqueda Indexada**: Índice invertido en memoria RAM para búsquedas ultra-rápidas (<10ms).
- **Fallback Automático**: Si DBpedia no responde (timeout de 5s), el sistema busca automáticamente en la base offline.
- **Circuit Breaker Pattern**: Implementación de resiliencia para evitar cascadas de fallos.

### 5. Experiencia Multilingüe Fluida
Utiliza la plataforma en tu idioma preferido sin barreras.
- **Español, Inglés y Portugués**: Interfaz totalmente traducida y adaptada.
- **Rutas Inteligentes**: Navegación intuitiva (`/es/search`, `/en/search`, `/pt/search`) ideal para compartir resultados.
- **Traducción Automática**: Integración con Google Translate para traducciones en tiempo real.
- **i18n Nativo**: Implementado con `next-i18next` y middleware de detección automática.

### 6. Progressive Web App (PWA)
Instala la aplicación y úsala como una app nativa.
- **Instalable**: Funciona como app de escritorio o móvil.
- **Service Workers**: Estrategia `Stale-While-Revalidate` para contenido instantáneo.
- **Modo Offline**: Accede a páginas visitadas sin conexión.
- **Caché Inteligente**: Almacenamiento local con IndexedDB para traducciones y resultados.

---

## 🛠️ Stack Tecnológico Completo

### 🖥️ Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 16.0.4 | Framework React con App Router, SSR y SSG |
| **React** | 19.2.0 | Librería UI de componentes |
| **TypeScript** | ^5 | Tipado estático |
| **TailwindCSS** | ^4 | Framework CSS utility-first |
| **next-pwa** | ^5.6.0 | Service Worker y funcionalidades PWA |
| **i18next** | ^25.6.3 | Internacionalización |
| **react-i18next** | ^16.3.5 | Bindings de i18next para React |
| **next-i18next** | ^15.4.2 | Integración de i18next con Next.js |
| **idb** | ^8.0.3 | Wrapper para IndexedDB (caché offline) |

### ⚙️ Backend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **NestJS** | ^10.3.0 | Framework Node.js para API RESTful |
| **TypeScript** | ^5.3.3 | Tipado estático |
| **Prisma** | ^5.8.0 | ORM para PostgreSQL |
| **@elastic/elasticsearch** | ^8.12.0 | Cliente para Elasticsearch |
| **@google-cloud/translate** | ^9.3.0 | API de Google Translate |
| **rdflib** | ^2.3.0 | Parsing y manipulación de RDF/OWL |
| **n3** | ^1.17.2 | Parser RDF N3/Turtle |
| **axios** | ^1.6.5 | Cliente HTTP |
| **natural** | ^6.10.0 | NLP y procesamiento de texto |
| **compromise** | ^14.10.0 | Procesamiento de lenguaje natural |

### 🐍 Python (Servicios Auxiliares)

| Biblioteca | Versión | Uso |
|------------|---------|-----|
| **owlready2** | 0.48 | Carga y conversión de ontologías OWL/XML |
| **sentence-transformers** | 3.0.1 | Embeddings semánticos para búsqueda vectorial |
| **Flask** | 3.0.3 | Microframework para servicios de embeddings |
| **Flask-CORS** | 5.0.0 | CORS para Flask |
| **NumPy** | 1.26.4 | Operaciones numéricas |
| **PyTorch** | 2.9.1 | Backend para transformers |

### 🗄️ Infraestructura y Bases de Datos

| Servicio | Imagen Docker | Puerto | Uso |
|----------|---------------|--------|-----|
| **PostgreSQL** | `postgres:15-alpine` | 5432 | Base de datos principal (metadatos, archivos) |
| **Apache Jena Fuseki** | `stain/jena-fuseki:latest` | 3030 | Servidor SPARQL para tripletas RDF |
| **Elasticsearch** | `elasticsearch:8.11.0` | 9200 | Búsqueda de texto completo y vectorial |

---

##  Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

### Requerimientos Obligatorios

| Software | Versión Mínima | Verificar Instalación |
|----------|----------------|----------------------|
| **Node.js** | v18+ | `node --version` |
| **npm** | v9+ | `npm --version` |
| **Docker** | v20+ | `docker --version` |
| **Docker Compose** | v2+ | `docker compose version` |
| **Git** | v2+ | `git --version` |

### Requerimientos Opcionales (para desarrollo local sin Docker)

| Software | Versión Mínima | Uso |
|----------|----------------|-----|
| **Python** | 3.9+ | Scripts de conversión OWL y servicio de embeddings |
| **pip** | v21+ | Gestor de paquetes Python |

---

## ⚡ Guía de Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd BUSCADOR_SEMANTICO
```

### 2. Levantar Infraestructura con Docker

```bash
# Levantar servicios de infraestructura (PostgreSQL, Fuseki, Elasticsearch)
docker-compose up -d postgres fuseki elasticsearch

# Esperar a que los servicios estén saludables (~30 segundos)
docker-compose ps
```

### 3. Configurar y Ejecutar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Variables importantes a configurar en .env:
# - DATABASE_URL: postgresql://postgres:postgres123@localhost:5432/semantic_search
# - FUSEKI_URL: http://localhost:3030
# - FUSEKI_DATASET: semantic
# - ELASTICSEARCH_NODE: http://localhost:9200

# Generar cliente Prisma y sincronizar base de datos
npx prisma generate
npx prisma migrate deploy

# Iniciar servidor en modo desarrollo
npm run start:dev
```

*El backend estará activo en: `http://localhost:3001`*

### 4. Configurar y Ejecutar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Iniciar en modo desarrollo
npm run dev
```

*El frontend estará activo en: `http://localhost:3000`*

### 5. Crear Dataset en Fuseki

1. Accede a `http://localhost:3030`
2. Login: `admin` / `admin123`
3. Ve a "Manage datasets" → "Add new dataset"
4. Nombre: `semantic` (tipo: Persistent TDB2)

---

## 🧠 Búsqueda Semántica Avanzada (Opcional)

Para habilitar la búsqueda por *significado* (vectores matemáticos), activa el servicio de embeddings:

### ¿Por qué Python?
Aunque Node.js es rápido para I/O, Python es el estándar para ML. Usamos `Flask` para exponer el modelo `sentence-transformers` vía HTTP.

### Instalación

```bash
cd backend

# Instalar dependencias de IA
pip install -r requirements-embeddings.txt

# Ejecutar servicio de embeddings
python src/modules/embeddings/embedding-service.py
```

El servicio descargará el modelo `paraphrase-multilingual-MiniLM-L12-v2` (~500MB) la primera vez.

### Verificar

```bash
curl http://localhost:5000/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "model": "paraphrase-multilingual-MiniLM-L12-v2",
  "embedding_dim": 384
}
```

> **Nota:** Si no activas este servicio, el buscador funcionará en modo "degradado" (solo búsqueda por palabras clave). Verás un warning en los logs del backend.

---

## 📱 Características PWA

### Instalación como Aplicación

| Plataforma | Instrucciones |
|------------|---------------|
| **Desktop (Chrome/Edge)** | Clic en el ícono de instalación en la barra de direcciones |
| **Android** | Menú → "Agregar a pantalla de inicio" |
| **iOS** | Compartir → "Agregar a pantalla de inicio" |

### Funcionalidades Offline

- ✅ Páginas visitadas disponibles sin conexión
- ✅ Banner de estado offline
- ✅ Caché inteligente de recursos estáticos
- ✅ IndexedDB para almacenamiento de traducciones y resultados
- ✅ Sincronización automática al recuperar conexión

> **Nota**: Para habilitar PWA, ejecuta el build de producción:
> ```bash
> npm run build && npm start
> ```

---

## 🎯 Uso del Sistema

### Flujo Básico

1. **Acceso**: Navega a `http://localhost:3000`. Serás redirigido a `/es` (español).

2. **Carga de Datos**:
   - Ve a `/es/search`
   - En el panel lateral "Base de Conocimiento", sube archivos `.owl` o `.rdf`
   - Los archivos se procesan automáticamente y se indexan
   - **Archivo de Ejemplo**: Usa `backend/uploads/tv_series_kb.owl` (300 series, 67 géneros)

3. **Búsqueda**:
   - Ingresa términos como "drama", "HBO", "ciencia ficción"
   - El sistema buscará simultáneamente en:
     - 📁 Tu base local de conocimiento
     - 🌐 DBpedia (datos enlazados de Wikipedia)
     - 🗄️ Base offline (15,000 series)
   - Los resultados se muestran con indicadores de color:
     - 🟢 Verde: DBpedia Online
     - 🟡 Amarillo: Caché
     - 🟠 Naranja: Offline
     - 🔵 Azul: Local (tus archivos)

### Cambiar Idioma

Usa el selector de idioma en la navegación o accede directamente:
- Español: `/es/search`
- English: `/en/search`
- Português: `/pt/search`

### 10 Búsquedas de Ejemplo

| Búsqueda | Qué encontrarás |
|----------|-----------------|
| `drama` | Series dramáticas |
| `HBO` | Producciones de HBO |
| `comedia` | Series de comedia |
| `ciencia ficción` | Series de sci-fi |
| `Breaking Bad` | Información específica de la serie |
| `Netflix` | Series de Netflix |
| `animación` | Series animadas |
| `2020` | Series que empezaron en 2020 |
| `crimen` | Series policíacas |
| `romance` | Series románticas |

---

## 🚀 Despliegue a Producción

El proyecto está completamente preparado para despliegue en producción con **Docker**.

### Despliegue Completo con Docker Compose

```bash
# Opción 1: Script automatizado (Windows)
.\deploy.ps1

# Opción 2: Script automatizado (Linux/Mac)
chmod +x deploy.sh
./deploy.sh

# Opción 3: Manual
docker-compose up --build -d
```

**Servicios incluidos:**
- ✅ Frontend (Next.js)
- ✅ Backend (NestJS + Python + owlready2)
- ✅ PostgreSQL
- ✅ Apache Fuseki
- ✅ Elasticsearch

### Checklist de Seguridad para Producción

- [ ] Cambiar contraseña de Fuseki (default: `admin123`)
- [ ] Cambiar credenciales de PostgreSQL
- [ ] Habilitar autenticación en Elasticsearch
- [ ] Configurar CORS correctamente en backend
- [ ] Usar HTTPS (requerido para PWA)
- [ ] Implementar rate limiting
- [ ] Validar y sanitizar inputs

---

## 🔧 Solución de Problemas Comunes

### Backend

| Problema | Solución |
|----------|----------|
| Error al subir archivos OWL | Verifica que Python y `owlready2` estén instalados |
| Puerto 3001 ocupado | Windows: `taskkill /F /IM node.exe` / Linux: `killall node` |
| Sin resultados de DBpedia | Verifica tu conexión a internet |
| Error P1001: Can't reach database | Verifica que PostgreSQL esté corriendo: `docker ps` |
| Error 400 al subir OWL | El archivo contiene entidades XML no declaradas (el backend intenta arreglarlo automáticamente) |

### Frontend

| Problema | Solución |
|----------|----------|
| PWA no se instala | Ejecuta `npm run build && npm start` (PWA solo en producción) |
| Errores de Turbopack | El proyecto usa `--webpack` flag para compatibilidad con next-pwa |
| Puerto 3000 ocupado | Cambia el puerto o cierra otros procesos |
| Hydration failed | Verificar que no renderizamos `Date.now()` sin `useEffect` |

### Infraestructura

| Problema | Solución |
|----------|----------|
| Fuseki sin dataset | Accede a `http://localhost:3030`, login `admin/admin123`, crea dataset `semantic` |
| Elasticsearch no responde | Verifica contenedor: `docker ps` y logs: `docker logs semantic-search-elasticsearch` |
| Prisma no genera | Ejecuta `npx prisma generate` después de cambios en schema |
| Embedding service not available | Es solo un warning. El buscador funciona sin él (modo degradado) |

---

## 📚 Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| **[Backend README](./backend/README.md)** | Arquitectura NestJS, módulos, API reference |
| **[Frontend README](./frontend/README.md)** | Next.js App Router, PWA, componentes |
| **[EMBEDDINGS_DEPLOYMENT.md](./EMBEDDINGS_DEPLOYMENT.md)** | Guía de despliegue del servicio de IA |

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia **MIT**.

---

## 👨‍💻 Autor

**Desarrollado por Brandon Jr. Garcia**

---

<p align="center">
  <strong>🚀 ¡Gracias por usar Synapse Search!</strong>
</p>
