# 🧠 Buscador Semántico de Series TV - Synapse Search

> **Más que un buscador: Un motor de descubrimiento inteligente.**
>
> Una plataforma avanzada que utiliza tecnologías de la Web Semántica para comprender el *significado* y el *contexto* detrás de tus consultas, permitiéndote explorar el universo de las series de televisión de una manera completamente nueva.

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
- **Español e Inglés**: Interfaz totalmente traducida y adaptada.
- **Rutas Inteligentes**: Navegación intuitiva (`/es/search`, `/en/search`) ideal para compartir resultados.

### 5. Progressive Web App (PWA)
Instala la aplicación y úsala como una app nativa.
- **Instalable**: Funciona como app de escritorio o móvil.
- **Modo Offline**: Accede a páginas visitadas sin conexión.
- **Rápida**: Caché inteligente para carga instantánea.

---

## 🛠️ Arquitectura Técnica

Este proyecto implementa una arquitectura moderna y robusta:

| Componente | Tecnología | Función |
|------------|------------|---------|
| **Frontend** | **Next.js 15** (App Router) | Interfaz reactiva, SSR, PWA y optimización SEO. |
| **Backend** | **NestJS** | API RESTful, orquestación de servicios y lógica de negocio. |
| **Semántica** | **Apache Fuseki** & **rdflib** | Almacenamiento de tripletas RDF y razonamiento. |
| **Búsqueda** | **Elasticsearch** | Búsqueda de texto completo de alto rendimiento. |
| **Datos** | **PostgreSQL** | Gestión de metadatos y persistencia de archivos. |
| **Procesamiento** | **Python** | Scripts auxiliares para conversión avanzada de ontologías. |
| **PWA** | **next-pwa** & **Workbox** | Service Worker, caché offline, instalabilidad. |

---

## ⚡ Guía de Inicio Rápido

### Prerrequisitos
- Node.js v18+
- Docker & Docker Compose
- Python 3.x (con `owlready2` instalado: `pip install owlready2`)

### 1. Instalación del Entorno

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd BUSCADOR_SEMANTICO

# Levantar servicios de infraestructura (PostgreSQL, Fuseki, Elasticsearch)
cd backend
docker-compose up -d
```

### 2. Configuración del Backend

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL, Fuseki, etc.

# Sincronizar base de datos
npx prisma generate
npx prisma db push

# Iniciar servidor
npm run start:dev
```
*El backend estará activo en: `http://localhost:3001`*

### 3. Configuración del Frontend

```bash
cd frontend
npm install

# Configurar variables de entorno
# Crear .env.local con:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Modo desarrollo
npm run dev

# O build de producción (para PWA)
npm run build
npm start
```
*Accede a la aplicación en: `http://localhost:3000`*

---

## � Características PWA

### Instalación
- **Desktop**: Chrome/Edge → Ícono de instalación en barra de direcciones
- **Mobile**: Menú → "Agregar a pantalla de inicio"

### Funcionalidades Offline
- Páginas visitadas disponibles sin conexión
- Banner de estado offline
- Caché inteligente de recursos
- IndexedDB para almacenamiento local

---

## �🔧 Solución de Problemas Comunes

### Backend
- **Error al subir archivos OWL**: Asegúrate de tener Python y `owlready2` instalados.
- **Puerto 3001 ocupado**: Libera el proceso con `taskkill /F /IM node.exe` (Windows) o `killall node` (Linux/Mac).
- **Sin resultados en DBpedia**: Verifica tu conexión a internet.

### Frontend
- **PWA no se instala**: Usa `npm run build && npm start` (PWA deshabilitado en desarrollo).
- **Errores de Turbopack**: El proyecto usa webpack con `--webpack` flag para compatibilidad con next-pwa.

### Infraestructura
- **Fuseki sin dataset**: Accede a `http://localhost:3030`, login `admin/admin123`, crea dataset `semantic-search`.
- **Elasticsearch no responde**: Verifica que el contenedor esté corriendo con `docker ps`.

---

## 📚 Documentación Adicional

- **Backend**: Ver `backend/README.md` para arquitectura detallada
- **Frontend**: Ver `frontend/README.md` para componentes y rutas
- **PWA**: Walkthrough completo en `.gemini/antigravity/brain/*/walkthrough.md`

---

## 🎯 Uso del Sistema

1. **Acceso**: Navega a `http://localhost:3000`. Serás redirigido a `/es` (español).
2. **Carga de Datos**:
   - Ve a `/es/search`
   - Sube archivos `.owl` o `.rdf` en el panel lateral "Base de Conocimiento"
3. **Búsqueda**:
   - Ingresa términos como "Person", "Series", o conceptos abstractos
   - El sistema buscará en tu base local **Y** en DBpedia simultáneamente
   - Resultados se muestran en dos columnas (DBpedia | Local)

---

## 🔒 Seguridad y Producción

**Para producción, asegúrate de**:
- Cambiar contraseñas por defecto (Fuseki: `admin123`, PostgreSQL)
- Habilitar autenticación en Elasticsearch
- Configurar CORS adecuadamente en el backend
- Usar HTTPS (requerido para PWA)
- Implementar rate limiting
- Validar y sanitizar inputs

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia **MIT**.

---

**Desarrollado por Brandon Jr. Garcia**
