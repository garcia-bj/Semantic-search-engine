# Semantic Search Engine

A semantic search engine built with Nest.js and Next.js that allows you to upload OWL/RDF files, perform ontological queries, and integrate with DBpedia.

## Tech Stack

- **Backend**: Nest.js, Prisma, PostgreSQL
- **Frontend**: Next.js, Shadcn UI, Tailwind CSS
- **Database**: PostgreSQL (Docker)
- **ORM**: Prisma
- **RDF Parser**: n3

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BUSCADOR_SEMANTICO
```

### 2. Start the Database

Start PostgreSQL and pgAdmin using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on `localhost:5432`
- **pgAdmin** on `http://localhost:5050`



### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev --name init

# Start the backend
npm run start:dev
```

The backend will be available at `http://localhost:3001`

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Database Management



### Prisma Studio

You can also use Prisma Studio to view and edit your database:

```bash
cd backend
npx prisma studio
```

## Features

- ✅ Upload OWL/RDF files as knowledge base
- ✅ Perform semantic/ontological queries
- ✅ DBpedia integration for ontology population
- ✅ Multilingual support

## Project Structure

```
BUSCADOR_SEMANTICO/
├── backend/              # Nest.js backend
│   ├── src/
│   │   ├── upload/      # File upload service
│   │   ├── search/      # Semantic search service
│   │   ├── dbpedia/     # DBpedia integration
│   │   └── prisma/      # Database service
│   └── prisma/
│       └── schema.prisma
├── frontend/            # Next.js frontend
│   └── src/
│       └── app/
└── docker-compose.yml   # Database setup
```

## Development

### Backend Commands

```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Tests
npm run test
```

### Frontend Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start
```

## License

MIT
