# 🚀 Deployment Separado - Backend y Frontend

## 📦 Backend (Standalone)

### Ubicación
```
backend/
├── docker-compose.yml    # Compose del backend
├── .env.production       # Variables de entorno
├── Dockerfile           # Build del backend
└── ...
```

### Deploy Backend

```bash
cd backend

# 1. Configurar variables
cp .env.production .env
nano .env  # Cambiar contraseñas

# 2. Levantar servicios
docker-compose up -d --build

# 3. Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# 4. Verificar
docker-compose ps
curl http://localhost:3001/health
```

### Servicios Backend
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5433
- **Fuseki (SPARQL)**: http://localhost:3030
- **Elasticsearch**: http://localhost:9200

### Variables de Entorno Backend (.env)
```env
# Database
POSTGRES_DB=semantic_search
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_password
POSTGRES_PORT=5433

# Fuseki
FUSEKI_PASSWORD=change_this_password
FUSEKI_DATASET=semantic
FUSEKI_PORT=3030

# Elasticsearch
ELASTICSEARCH_PORT=9200

# Backend
BACKEND_PORT=3001
CORS_ORIGIN=*  # En producción: https://tudominio.com
```

---

## 🎨 Frontend (Standalone)

### Ubicación
```
frontend/
├── docker-compose.yml    # Compose del frontend
├── ENV_TEMPLATE.md       # Template de variables
├── Dockerfile           # Build del frontend
└── ...
```

### Deploy Frontend

```bash
cd frontend

# 1. Configurar variables (crear .env.local)
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
echo "FRONTEND_PORT=3000" >> .env.local

# 2. Levantar servicio
docker-compose up -d --build

# 3. Verificar
docker-compose ps
curl http://localhost:3000
```

### Variables de Entorno Frontend (.env.local)
```env
# API URL (Backend)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Para producción:
# NEXT_PUBLIC_API_URL=https://api.tudominio.com

# Frontend Port
FRONTEND_PORT=3000
```

---

## 🌐 Deployment en Producción (Separado)

### Escenario 1: Backend y Frontend en el mismo servidor

```bash
# Backend
cd backend
docker-compose up -d --build

# Frontend
cd ../frontend
# Configurar .env.local con URL del backend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
docker-compose up -d --build
```

### Escenario 2: Backend y Frontend en servidores diferentes

**Servidor 1 (Backend)**:
```bash
cd backend
# Configurar CORS_ORIGIN con URL del frontend
echo "CORS_ORIGIN=https://frontend.tudominio.com" >> .env
docker-compose up -d --build
```

**Servidor 2 (Frontend)**:
```bash
cd frontend
# Configurar URL del backend
echo "NEXT_PUBLIC_API_URL=https://api.tudominio.com" > .env.local
docker-compose up -d --build
```

---

## 🔧 Comandos Útiles

### Backend
```bash
cd backend

# Ver logs
docker-compose logs -f backend

# Reiniciar
docker-compose restart backend

# Detener
docker-compose down

# Backup DB
docker-compose exec -T postgres pg_dump -U postgres semantic_search > backup.sql
```

### Frontend
```bash
cd frontend

# Ver logs
docker-compose logs -f frontend

# Reiniciar
docker-compose restart frontend

# Detener
docker-compose down

# Reconstruir
docker-compose up -d --build
```

---

## 🏥 Health Checks

### Backend
```bash
# API Health
curl http://localhost:3001/health

# Respuesta esperada:
{
  "status": "ok",
  "timestamp": "2024-12-03T02:00:00.000Z",
  "services": {
    "database": "connected",
    "api": "running"
  }
}
```

### Frontend
```bash
curl http://localhost:3000
# Debe devolver HTML de la página
```

---

## 🔄 Actualización

### Backend
```bash
cd backend

# Backup primero
docker-compose exec -T postgres pg_dump -U postgres semantic_search > backup.sql

# Actualizar
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```

### Frontend
```bash
cd frontend

# Actualizar
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## 🌍 Nginx Configuration (Producción)

Si usas Nginx como reverse proxy:

```nginx
# Backend
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (si es necesario)
        add_header Access-Control-Allow-Origin *;
    }
}

# Frontend
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 Puertos por Defecto

### Backend
- API: 3001
- PostgreSQL: 5433
- Fuseki: 3030
- Elasticsearch: 9200

### Frontend
- Next.js: 3000

---

## ✅ Checklist de Deployment

### Backend
- [ ] Copiar `.env.production` a `.env`
- [ ] Cambiar contraseñas en `.env`
- [ ] Configurar `CORS_ORIGIN`
- [ ] Ejecutar `docker-compose up -d --build`
- [ ] Ejecutar migraciones
- [ ] Verificar health check

### Frontend
- [ ] Crear `.env.local`
- [ ] Configurar `NEXT_PUBLIC_API_URL`
- [ ] Ejecutar `docker-compose up -d --build`
- [ ] Verificar que carga correctamente

---

## 🎉 ¡Listo!

Ahora puedes deployar backend y frontend por separado, en el mismo servidor o en servidores diferentes. Cada uno tiene su propio docker-compose y configuración independiente.
