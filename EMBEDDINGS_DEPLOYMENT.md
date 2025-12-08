# 🐳 Guía de Deployment con Embeddings

## 📦 Servicios Incluidos

### Desarrollo (`docker-compose.dev.yml`)
- PostgreSQL (5433)
- Fuseki (3030)
- Elasticsearch (9200)
- LibreTranslate (5001)
- **Embeddings (5000)** ← NUEVO

### Producción (`backend/docker-compose.yml`)
- Todos los servicios de desarrollo
- Backend API (3001)
- **Embeddings (5000)** ← NUEVO

---

## 🚀 Deployment Desarrollo

### Paso 1: Levantar Servicios
```bash
cd B:\BUSCADOR_SEMANTICO
docker-compose -f docker-compose.dev.yml up -d --build
```

**Servicios que se levantan**:
1. PostgreSQL
2. Fuseki
3. Elasticsearch
4. LibreTranslate (descarga modelos ~500MB primera vez)
5. **Embeddings** (descarga modelo ~120MB primera vez)

### Paso 2: Verificar Embeddings
```bash
# Ver logs (primera vez tarda ~2 minutos)
docker-compose -f docker-compose.dev.yml logs -f embeddings

# Esperar mensaje:
# "Model loaded successfully. Embedding dimension: 384"
# " * Running on http://0.0.0.0:5000"
```

### Paso 3: Test Embeddings
```bash
curl http://localhost:5000/health
```

**Respuesta esperada**:
```json
{
  "status": "healthy",
  "model": "paraphrase-multilingual-MiniLM-L12-v2",
  "embedding_dim": 384
}
```

### Paso 4: Ejecutar Backend Local
```bash
cd backend
npm run start:dev
```

**Logs esperados**:
```
[EmbeddingsService] Embedding service is available at http://localhost:5000
[EmbeddingsService] Model: paraphrase-multilingual-MiniLM-L12-v2, Dimension: 384
```

### Paso 5: Ejecutar Frontend Local
```bash
cd frontend
npm run dev
```

---

## 🏭 Deployment Producción

### Paso 1: Configurar Variables
```bash
cd backend
cp .env.production .env
nano .env
```

**Agregar**:
```env
EMBEDDINGS_PORT=5000
```

### Paso 2: Levantar Todo
```bash
docker-compose up -d --build
```

**Orden de inicio**:
1. PostgreSQL ✅
2. Fuseki ✅
3. Elasticsearch ✅
4. LibreTranslate ✅ (tarda ~3-5 min primera vez)
5. **Embeddings** ✅ (tarda ~2 min primera vez)
6. Backend ✅ (espera a que todos estén healthy)

### Paso 3: Verificar Servicios
```bash
docker-compose ps
```

Todos deben mostrar "Up (healthy)".

### Paso 4: Ejecutar Migraciones
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Paso 5: Verificar Embeddings
```bash
curl http://localhost:5000/health
curl http://localhost:3001/health
```

---

## 🔧 Comandos Útiles

### Ver Logs de Embeddings
```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml logs -f embeddings

# Producción
docker-compose logs -f embeddings
```

### Reiniciar Embeddings
```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml restart embeddings

# Producción
docker-compose restart embeddings
```

### Rebuild Embeddings
```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up -d --build embeddings

# Producción
docker-compose up -d --build embeddings
```

### Ver Uso de Recursos
```bash
docker stats semantic-dev-embeddings
# o
docker stats semantic-backend-embeddings
```

---

## 📊 Volúmenes

### Embeddings Models
Los modelos se guardan en volúmenes Docker para no descargarlos cada vez:

- **Desarrollo**: `embeddings_dev_models`
- **Producción**: `embeddings_models`

**Tamaño**: ~120MB (modelo paraphrase-multilingual-MiniLM-L12-v2)

### Limpiar Volúmenes (⚠️ Borra modelos)
```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml down -v

# Producción
docker-compose down -v
```

---

## ⚠️ Troubleshooting

### Embeddings no inicia
**Ver logs**:
```bash
docker-compose logs embeddings
```

**Errores comunes**:
- "Port 5000 already in use" → Cambiar `EMBEDDINGS_PORT` en `.env`
- "Out of memory" → Aumentar RAM de Docker (mínimo 4GB)

### Backend no detecta Embeddings
**Verificar**:
```bash
# 1. Embeddings está corriendo
docker-compose ps embeddings

# 2. Health check pasa
curl http://localhost:5000/health

# 3. Backend tiene la variable
docker-compose exec backend env | grep EMBEDDINGS
```

### Embeddings muy lento
**Causa**: Primera carga del modelo.

**Solución**: Esperar ~2 minutos. Después será rápido.

### Error "Model not found"
**Causa**: Volumen corrupto.

**Solución**:
```bash
docker-compose down
docker volume rm <volume-name>
docker-compose up -d --build
```

---

## 🎯 Verificación Completa

### Checklist
- [ ] PostgreSQL: `curl http://localhost:5433` (debe conectar)
- [ ] Fuseki: `curl http://localhost:3030/$/ping`
- [ ] Elasticsearch: `curl http://localhost:9200`
- [ ] LibreTranslate: `curl http://localhost:5001/languages`
- [ ] **Embeddings**: `curl http://localhost:5000/health`
- [ ] Backend: `curl http://localhost:3001/health`

### Test End-to-End
1. Subir archivo OWL
2. Buscar: "series de televisión"
3. Ver logs del backend:
   ```
   [SearchService] Vector search for "series de televisión" returned X results
   ```

---

## 📈 Performance

### Tiempos Esperados

| Operación | Primera Vez | Subsecuentes |
|-----------|-------------|--------------|
| Iniciar Embeddings | ~2 min | ~10 seg |
| Generar Embedding | ~200ms | ~50ms (caché) |
| Búsqueda con Embeddings | ~500ms | ~200ms |

### Uso de Recursos

| Servicio | RAM | CPU |
|----------|-----|-----|
| Embeddings | ~500MB | 10-20% |
| Backend | ~200MB | 5-10% |
| PostgreSQL | ~100MB | 5% |
| Elasticsearch | ~1GB | 10-15% |

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ Búsqueda semántica con embeddings
- ✅ Traducción multiidioma
- ✅ Todo en Docker
- ✅ Desarrollo y producción separados
- ✅ Health checks automáticos
- ✅ Volúmenes persistentes

**Próximo paso**: Probar búsquedas y ver la mejora en calidad!
