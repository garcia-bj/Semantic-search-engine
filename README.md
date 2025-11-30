# 🧠 Buscador Semántico de Series TV

> **Más que un buscador: Un motor de descubrimiento inteligente.**
>
> Una plataforma avanzada que utiliza tecnologías de la Web Semántica para comprender el *significado* y el *contexto* detrás de tus consultas, permitiéndote explorar el universo de las series de televisión de una manera completamente nueva.

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

---

## 🛠️ Arquitectura Técnica

Este proyecto implementa una arquitectura moderna y robusta:

| Componente | Tecnología | Función |
|------------|------------|---------|
| **Frontend** | **Next.js 15** (App Router) | Interfaz reactiva, SSR, y optimización SEO. |
| **Backend** | **NestJS** | API RESTful, orquestación de servicios y lógica de negocio. |
| **Semántica** | **Apache Fuseki** & **rdflib** | Almacenamiento de tripletas RDF y razonamiento. |
| **Búsqueda** | **Elasticsearch** | Búsqueda de texto completo de alto rendimiento. |
| **Datos** | **PostgreSQL** | Gestión de metadatos y persistencia de archivos. |
| **Procesamiento** | **Python** | Scripts auxiliares para conversión avanzada de ontologías. |

---

## ⚡ Guía de Inicio Rápido

### Prerrequisitos
- Node.js v18+
- Docker & Docker Compose
- Python 3.x (con `owlready2` instalado)

### 1. Instalación del Entorno

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd BUSCADOR_SEMANTICO

# Levantar servicios de infraestructura (Base de datos, Fuseki, Elastic)
cd backend
docker-compose up -d
```

### 2. Configuración del Backend

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env

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

# Iniciar aplicación web
npm run dev
```
*Accede a la aplicación en: `http://localhost:3000`*

---

## 🔧 Solución de Problemas Comunes

- **Error al subir archivos OWL**: Si el sistema no reconoce el formato, asegúrate de tener Python y `owlready2` instalados, ya que el sistema intentará convertir automáticamente formatos complejos.
- **Puerto 3001 ocupado**: Si el backend no inicia, verifica que no haya procesos "zombie" de Node.js ejecutándose (`taskkill /F /IM node.exe` en Windows).
- **Sin resultados en DBpedia**: Verifica tu conexión a internet, ya que estas consultas se realizan en tiempo real contra los servidores públicos de DBpedia.

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia **MIT**.

---
**Desarrollado por Brandon Jr. Garcia**
