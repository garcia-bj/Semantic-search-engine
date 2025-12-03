# 🐳 Guía Docker - Desarrollo vs Producción

## 📋 Archivos Docker Disponibles

### Para Desarrollo Local (Docker Desktop)
- **`docker-compose.dev.yml`** - Solo servicios (sin backend/frontend)
- Usa código local con `npm run dev`

### Para Producción (Servidor)
- **`docker-compose.yml`** - Todo incluido (servicios + backend + frontend)
- **`backend/docker-compose.yml`** - Solo backend con servicios
- **`frontend/docker-compose.yml`** - Solo frontend

---

## 🚀 Desarrollo Local con Docker Desktop

### Paso 1: Levantar Servicios en Docker

```bash
# En la raíz del proyecto
docker-compose -f docker-compose.dev.yml up -d
```

**Servicios que levanta**:
- ✅ PostgreSQL (puerto 5433)
- ✅ Fuseki/SPARQL (puerto 3030)
- ✅ Elasticsearch (puerto 9200)
- ✅ LibreTranslate (puerto 5001)

### Paso 2: Configurar Backend

Editar `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/semantic_search
FUSEKI_URL=http://localhost:3030
FUSEKI_DATASET=semantic
ELASTICSEARCH_NODE=http://localhost:9200
LIBRETRANSLATE_URL=http://localhost:5001
```

### Paso 3: Ejecutar Backend (Local)

```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

### Paso 4: Ejecutar Frontend (Local)

```bash
cd frontend
npm install
npm run dev
```

### Paso 5: Verificar

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Fuseki: http://localhost:3030
- Elasticsearch: http://localhost:9200
- LibreTranslate: http://localhost:5001

---

## 🎯 Comandos Útiles

### Ver servicios corriendo
```bash
docker-compose -f docker-compose.dev.yml ps
```

### Ver logs
```bash
# Todos los servicios
docker-compose -f docker-compose.dev.yml logs -f

# Servicio específico
docker-compose -f docker-compose.dev.yml logs -f libretranslate
```

### Detener servicios
```bash
docker-compose -f docker-compose.dev.yml down
```

### Detener y eliminar volúmenes (⚠️ borra datos)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Reiniciar un servicio
```bash
docker-compose -f docker-compose.dev.yml restart libretranslate
```

---

## 🔧 Troubleshooting

### LibreTranslate tarda en iniciar

LibreTranslate descarga modelos la primera vez (~500MB). Puede tardar 5-10 minutos.

**Ver progreso**:
```bash
docker-compose -f docker-compose.dev.yml logs -f libretranslate
```

**Verificar cuando esté listo**:
```bash
curl http://localhost:5001/languages
```

### Puerto ya en uso

Si un puerto está ocupado:
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :5001

# Cambiar puerto en docker-compose.dev.yml
# Ejemplo: "5002:5000" en lugar de "5001:5000"
```

### Servicios no conectan

Verificar que los servicios estén corriendo:
```bash
docker-compose -f docker-compose.dev.yml ps
```

Todos deben mostrar "Up".

---

## 📊 Comparación

| Aspecto | Desarrollo (dev) | Producción (prod) |
|---------|------------------|-------------------|
| **Archivo** | `docker-compose.dev.yml` | `docker-compose.yml` |
| **Backend** | Local (npm) | Docker |
| **Frontend** | Local (npm) | Docker |
| **Servicios** | Docker | Docker |
| **Hot Reload** | ✅ Sí | ❌ No |
| **Debugging** | ✅ Fácil | ⚠️ Complejo |
| **Velocidad** | ⚡ Rápido | 🐢 Más lento |

---

## 🎯 Workflow Recomendado

### Desarrollo Diario
```bash
# 1. Levantar servicios (una vez)
docker-compose -f docker-compose.dev.yml up -d

# 2. Trabajar con código local
cd backend && npm run start:dev
cd frontend && npm run dev

# 3. Al terminar (opcional)
docker-compose -f docker-compose.dev.yml down
```

### Testing Pre-Producción
```bash
# Probar con Docker completo
docker-compose up -d --build

# Verificar
curl http://localhost:3001/health
curl http://localhost:3000
```

### Deployment Producción
```bash
# En servidor
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```

---

## 💡 Tips

1. **Desarrollo**: Usa `docker-compose.dev.yml` + código local
2. **Testing**: Usa `docker-compose.yml` completo
3. **Producción**: Usa `docker-compose.yml` en servidor

4. **Ahorra recursos**: Detén servicios cuando no los uses
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

5. **Limpia espacio**: Elimina imágenes viejas
   ```bash
   docker system prune -a
   ```

---

## 🚀 Quick Start

```bash
# 1. Levantar servicios
docker-compose -f docker-compose.dev.yml up -d

# 2. Esperar a LibreTranslate (primera vez)
docker-compose -f docker-compose.dev.yml logs -f libretranslate
# Esperar mensaje: "Running on http://0.0.0.0:5000"

# 3. Backend
cd backend
npm run start:dev

# 4. Frontend (otra terminal)
cd frontend
npm run dev

# 5. Probar
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

¡Listo para desarrollar! 🎉
