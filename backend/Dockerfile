# ============================================
# Stage 1: Build Node.js + TypeScript
# ============================================
FROM node:20-bullseye AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# ============================================
# Stage 2: Production Node.js + Python
# ============================================
FROM python:3.10-slim

WORKDIR /app

# Instalar Node.js
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs build-essential git && \
    rm -rf /var/lib/apt/lists/*

# Copiar dependencias Node.js
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias de producción Node.js
RUN npm ci --only=production

# Generar Prisma Client
RUN npx prisma generate

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Copiar scripts de Python
COPY scripts ./scripts

# Instalar owlready2 y dependencias Python
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir owlready2

# Crear directorio para uploads
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Exponer puerto
EXPOSE 3001

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3001

# Comando de inicio
CMD ["node", "dist/main"]
