# 🧠 Buscador Semántico de Series TV - Synapse Search

> **Más que un buscador: Un motor de descubrimiento inteligente.**
>
> Una plataforma avanzada que utiliza tecnologías de la Web Semántica para comprender el *significado* y el *contexto* detrás de tus consultas, permitiéndote explorar el universo de las series de televisión de una manera completamente nueva.

---

## 📑 Tabla de Contenidos

- [¿Qué es este proyecto?](#-qué-es-este-proyecto)
- [Características Principales](#-qué-puedes-hacer-con-él)
- [Stack Tecnológico](#-stack-tecnológico-completo)
- [Prerrequisitos](#-prerrequisitos)
- [Guía de Inicio Rápido](#-guía-de-inicio-rápido)
- [Características PWA](#-características-pwa)
- [Uso del Sistema](#-uso-del-sistema)
- [Despliegue a Producción](#-despliegue-a-producción)
- [Solución de Problemas](#-solución-de-problemas-comunes)
- [Documentación Adicional](#-documentación-adicional)
- [Licencia](#-licencia)

---

## 💡 ¿Qué es este proyecto?

Este sistema es un **Motor de Búsqueda Semántica Híbrido** diseñado para superar las limitaciones de los buscadores tradicionales. Mientras que un buscador normal solo encuentra palabras clave coincidentes (ej: buscar "médico" y encontrar solo series con esa palabra en el título), este sistema **entiende conceptos**.

Combina la precisión de las **Ontologías OWL/RDF** (archivos de conocimiento estructurado) con la vastedad de **DBpedia** (la versión semántica de Wikipedia) para ofrecer resultados ricos y contextualizados.

---

## 🚀 ¿Qué puedes hacer con él?

### 1. Descubrimiento Contextual
Encuentra series basándote en **conceptos y relaciones**, no solo en títulos.
- *Ejemplo*: Si buscas "Viajes en el tiempo", el sistema puede inferir y mostrarte series como *Dark* o *Doctor Who*, incluso si esas palabras no están en su descripción, gracias a las relaciones semánticas.

### 2. Gestión de Conocimiento Personalizada
Tienes el control total sobre la "inteligencia" del buscador.
- **Sube tus propias Ontologías**: Carga archivos `.owl` o `.rdf` para enseñar al sistema sobre nuevas series, géneros o relaciones específicas.
- **Persistencia de Datos**: Los archivos subidos se procesan, indexan y almacenan permanentemente, creando una base de conocimiento que crece contigo.

### 3. Exploración Global (DBpedia)
No te limites a tus datos locales.
- **Búsqueda Federada**: Cada consulta se realiza simultáneamente en tu base de conocimiento local y en la nube de datos enlazados de DBpedia.
- **Enriquecimiento**: Obtén resúmenes, enlaces y datos adicionales de fuentes externas automáticamente.

### 4. Experiencia Multilingüe Fluida
Utiliza la plataforma en tu idioma preferido sin barreras.
- **Español, Inglés y Portugués**: Interfaz totalmente traducida y adaptada.
- **Rutas Inteligentes**: Navegación intuitiva (`/es/search`, `/en/search`, `/pt/search`) ideal para compartir resultados.
- **Traducción Automática**: Integración con Google Translate para traducciones en tiempo real.

### 5. Progressive Web App (PWA)
Instala la aplicación y úsala como una app nativa.
- **Instalable**: Funciona como app de escritorio o móvil.
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
| **Workbox** | - | Estrategias de caché para PWA |

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
| **nestjs-i18n** | ^10.5.1 | Internacionalización en backend |
| **Socket.io** | ^4.8.1 | WebSockets para comunicación en tiempo real |
| **class-validator** | ^0.14.0 | Validación de DTOs |
| **class-transformer** | ^0.5.1 | Transformación de objetos |

### 🐍 Python (Servicios Auxiliares)

| Biblioteca | Versión | Uso |
|------------|---------|-----|
| **owlready2** | 0.48 | Carga y conversión de ontologías OWL/XML |
| **sentence-transformers** | 3.0.1 | Embeddings semánticos para búsqueda vectorial |
| **Flask** | 3.0.3 | Microframework para servicios de embeddings |
| **Flask-CORS** | 5.0.0 | CORS para Flask |
| **NumPy** | 1.26.4 | Operaciones numéricas |
| **PyTorch** | 2.0.1 | Backend para transformers |

### 🗄️ Infraestructura y Bases de Datos

| Servicio | Imagen Docker | Uso |
|----------|---------------|-----|
| **PostgreSQL** | `postgres:15-alpine` | Base de datos principal (metadatos, archivos) |
| **Apache Jena Fuseki** | `stain/jena-fuseki:latest` | Servidor SPARQL para tripletas RDF |
| **Elasticsearch** | `elasticsearch:8.11.0` | Búsqueda de texto completo y vectorial |

### 🧪 Testing y Desarrollo

| Herramienta | Uso |
|-------------|-----|
| **Jest** | Testing unitario y E2E |
| **ESLint** | Linting de código |
| **Prettier** | Formateo de código |
| **ts-jest** | Jest para TypeScript |
| **Supertest** | Testing de APIs HTTP |

### 📦 DevOps y Despliegue

| Herramienta | Uso |
|-------------|-----|
| **Docker** | Containerización de servicios |
| **Docker Compose** | Orquestación de contenedores |
| **Git** | Control de versiones |

---

## 📋 Prerrequisitos

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

### Instalación de Dependencias Python (Opcional)

```bash
# Instalar owlready2 (requerido para conversión OWL/XML)
pip install owlready2

# Para el servicio de embeddings semánticos
pip install sentence-transformers flask flask-cors numpy torch
```

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
# Copia y edita el archivo .env con tus configuraciones
cp .env.example .env

# Variables importantes a configurar:
# - DATABASE_URL: Conexión a PostgreSQL
# - FUSEKI_URL: URL del servidor Fuseki (default: http://localhost:3030)
# - ELASTICSEARCH_NODE: URL de Elasticsearch (default: http://localhost:9200)

# Generar cliente Prisma y sincronizar base de datos
npx prisma generate
npx prisma db push

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
# Crear archivo .env.local con:
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Iniciar en modo desarrollo
npm run dev
```

*El frontend estará activo en: `http://localhost:3000`*

### 5. Crear Dataset en Fuseki

1. Accede a `http://localhost:3030`
2. Login: `admin` / `admin123`
3. Ve a "Manage datasets" → "Add new dataset"
4. Nombre: `semantic-search` (tipo: Persistent TDB2)

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

3. **Búsqueda**:
   - Ingresa términos como "Person", "Series", o conceptos abstractos
   - El sistema buscará simultáneamente en:
     - 📁 Tu base local de conocimiento
     - 🌐 DBpedia (datos enlazados de Wikipedia)
   - Los resultados se muestran en dos columnas

### Cambiar Idioma

Usa el selector de idioma en la navegación o accede directamente:
- Español: `/es/search`
- English: `/en/search`
- Português: `/pt/search`

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

### Opciones de Plataforma

| Plataforma | Dificultad | Costo | Ideal Para |
|------------|------------|-------|------------|
| **[Railway](./docs/RAILWAY.md)** | ⭐ Fácil | ~$7-15/mes | Principiantes, deploy rápido |
| **[Dokploy](./docs/DOKPLOY.md)** | ⭐⭐⭐ Medio | ~$6-12/mes | Producción, control total |

📖 **[Ver Comparativa Detallada](./docs/COMPARATIVA.md)**

---

## 🔧 Solución de Problemas Comunes

### Backend

| Problema | Solución |
|----------|----------|
| Error al subir archivos OWL | Verifica que Python y `owlready2` estén instalados |
| Puerto 3001 ocupado | Windows: `taskkill /F /IM node.exe` / Linux: `killall node` |
| Sin resultados de DBpedia | Verifica tu conexión a internet |
| Error de conexión a DB | Verifica que PostgreSQL esté corriendo: `docker ps` |

### Frontend

| Problema | Solución |
|----------|----------|
| PWA no se instala | Ejecuta `npm run build && npm start` (PWA solo en producción) |
| Errores de Turbopack | El proyecto usa `--webpack` flag para compatibilidad con next-pwa |
| Puerto 3000 ocupado | Cambia el puerto o cierra otros procesos |

### Infraestructura

| Problema | Solución |
|----------|----------|
| Fuseki sin dataset | Accede a `http://localhost:3030`, login `admin/admin123`, crea dataset `semantic-search` |
| Elasticsearch no responde | Verifica contenedor: `docker ps` y logs: `docker logs semantic-search-elasticsearch` |
| Prisma no genera | Ejecuta `npx prisma generate` después de cambios en schema |

---

## 📚 Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| **[Backend README](./backend/README.md)** | Arquitectura detallada del backend |
| **[Frontend README](./frontend/README.md)** | Componentes y rutas del frontend |
| **[Guía de Instalación](./backend/INSTALLATION.md)** | Instalación paso a paso |
| **[Guía de Búsqueda Semántica](./backend/SEMANTIC_SEARCH_GUIDE.md)** | Cómo funciona la búsqueda |
| **[Despliegue con Docker](./DOCKER_GUIDE.md)** | Guía completa de Docker |
| **[Paso a Paso](./PASO_A_PASO.md)** | Tutorial completo |

---

## 🔒 Seguridad en Producción

**Checklist para producción:**

- [ ] Cambiar contraseña de Fuseki (default: `admin123`)
- [ ] Cambiar credenciales de PostgreSQL
- [ ] Habilitar autenticación en Elasticsearch
- [ ] Configurar CORS correctamente en backend
- [ ] Usar HTTPS (requerido para PWA)
- [ ] Implementar rate limiting
- [ ] Validar y sanitizar inputs

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
