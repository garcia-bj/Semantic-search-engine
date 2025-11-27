# Buscador Semántico

Este proyecto es un motor de búsqueda semántico avanzado diseñado para gestionar y consultar bases de conocimiento en formato OWL/RDF. Permite a los usuarios subir archivos de ontologías, procesarlos para extraer tripletas (sujeto, predicado, objeto) y realizar búsquedas semánticas sobre estos datos.

## Características Principales

### 1. Gestión de Base de Conocimiento
- **Carga de Archivos OWL/RDF**: Sube tus archivos de ontología directamente desde la interfaz web.
- **Procesamiento Automático**: El sistema parsea automáticamente los archivos subidos (soporta RDF/XML) y almacena las tripletas en una base de datos relacional optimizada.
- **Listado de Documentos**: Visualiza todos los archivos subidos y gestiona tu base de conocimiento.
- **Eliminación de Archivos**: Elimina documentos y sus tripletas asociadas cuando ya no sean necesarios.

### 2. Búsqueda Semántica
- **Buscador Inteligente**: Realiza consultas sobre los datos almacenados.
- **Integración con DBpedia**: (En desarrollo) Capacidad para extender las búsquedas a la base de conocimiento de DBpedia.

### 3. Interfaz Moderna
- **Diseño Responsivo**: Interfaz de usuario construida con Next.js y TailwindCSS, ofreciendo una experiencia fluida y moderna.
- **Multilenguaje**: Soporte nativo para español.

## Tecnologías Utilizadas

### Backend
- **NestJS**: Framework de Node.js para construir aplicaciones del lado del servidor eficientes y escalables.
- **Prisma**: ORM de próxima generación para Node.js y TypeScript.
- **PostgreSQL**: Sistema de gestión de bases de datos relacional de objetos.
- **rdflib**: Librería para el procesamiento y manejo de datos RDF (soporte para RDF/XML).
- **Docker**: Contenerización de la base de datos para un despliegue sencillo.

### Frontend
- **Next.js 16**: Framework de React para producción.
- **React 19**: Biblioteca de JavaScript para construir interfaces de usuario.
- **TailwindCSS 4**: Framework de CSS de utilidad primero para un diseño rápido y personalizado.
- **TypeScript**: Superset tipado de JavaScript.

## Configuración e Instalación

### Requisitos Previos
- Node.js (v18 o superior)
- Docker y Docker Compose
- npm

### Pasos para Ejecutar

1.  **Clonar el repositorio**
    ```bash
    git clone <url-del-repositorio>
    cd BUSCADOR_SEMANTICO
    ```

2.  **Configurar el Backend**
    ```bash
    cd backend
    npm install
    # Asegúrate de tener el archivo .env configurado con la URL de tu base de datos
    # Iniciar la base de datos con Docker
    docker-compose up -d
    # Ejecutar migraciones de Prisma
    npx prisma migrate dev
    # Iniciar el servidor de desarrollo
    npm run start:dev
    ```

3.  **Configurar el Frontend**
    ```bash
    cd ../frontend
    npm install
    # Iniciar el servidor de desarrollo
    npm run dev
    ```

4.  **Acceder a la Aplicación**
    - Abre tu navegador y visita `http://localhost:3000`.

## Uso

1.  Ve a la sección de **Base de Conocimiento**.
2.  Haz clic en **Subir OWL/RDF** y selecciona tu archivo `.owl`.
3.  Una vez procesado, puedes ir al **Buscador** e ingresar términos para explorar las relaciones semánticas extraídas de tu ontología.
