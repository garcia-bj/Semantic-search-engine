# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:20-alpine AS builder

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
# Stage 2: Production Stage
# ============================================
FROM node:20-alpine AS production

# Instalar Python y pip
RUN apk add --no-cache python3 py3-pip

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Generar Prisma Client
RUN npx prisma generate

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Copiar script de Python
COPY scripts ./scripts

# Instalar owlready2 para Python
RUN pip3 install --no-cache-dir owlready2

# Crear directorio para uploads
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Comando de inicio
CMD ["node", "dist/main"]
