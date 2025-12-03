# Guía de Inicio Rápido: Búsqueda Semántica

## Inicio Rápido (5 minutos)

### 1. Instalar Dependencias Python

```bash
cd backend
pip install -r requirements.txt
```

**Nota**: La primera vez descargará el modelo de embeddings (~120MB).

### 2. Iniciar Servicio de Embeddings

En una terminal separada:

```bash
cd backend/src/modules/embeddings
python embedding-service.py
```

Deberías ver:
```
Loading embedding model: paraphrase-multilingual-MiniLM-L12-v2
Model loaded successfully. Embedding dimension: 384
Starting embedding service on port 5000
```

### 3. Actualizar Base de Datos

```bash
cd backend
npx prisma db push
```

### 4. Iniciar Backend

```bash
npm run start:dev
```

### 5. ¡Probar!

El buscador ahora entiende contexto:

- Buscar "doctor" encontrará "médico", "physician"
- Buscar "viajes en el tiempo" encontrará "máquina del tiempo"
- Buscar "serie sobre crímenes" encontrará series policiales

---

## Configuración Avanzada

### Variables de Entorno

Agregar a `.env`:

```env
# Servicio de embeddings
EMBEDDING_SERVICE_URL=http://localhost:5000
EMBEDDING_MODEL=paraphrase-multilingual-MiniLM-L12-v2

# Búsqueda semántica
ENABLE_SEMANTIC_SEARCH=true
SEMANTIC_SEARCH_MIN_SCORE=0.5
```

### Modelos Alternativos

Para cambiar el modelo de embeddings, editar `embedding-service.py`:

```python
# Modelo actual (multilingüe, español + inglés)
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'

# Alternativas:
# Solo inglés, más rápido:
# MODEL_NAME = 'all-MiniLM-L6-v2'

# Mejor calidad, más lento:
# MODEL_NAME = 'paraphrase-multilingual-mpnet-base-v2'
```

---

## Solución de Problemas

### El servicio de embeddings no inicia

**Error**: `ModuleNotFoundError: No module named 'sentence_transformers'`

**Solución**:
```bash
pip install sentence-transformers
```

### El modelo no se descarga

**Error**: `HTTPError: 404 Client Error`

**Solución**: Verificar conexión a internet. El modelo se descarga de HuggingFace.

### Elasticsearch no indexa con embeddings

**Error**: `mapper_parsing_exception: failed to parse field [embedding]`

**Solución**: Recrear el índice de Elasticsearch:
```bash
# Desde el backend
curl -X DELETE http://localhost:9200/semantic-triples
# Reiniciar el backend para que recree el índice
```

### La búsqueda es lenta

**Solución**: El caché de embeddings mejora el rendimiento. Después de las primeras búsquedas, debería ser más rápido.

---

## Testing

### Casos de Prueba Semánticos

1. **Sinónimos**:
   - Buscar: "doctor"
   - Debe encontrar: "médico", "physician", "profesional de la salud"

2. **Conceptos**:
   - Buscar: "viajes en el tiempo"
   - Debe encontrar: "máquina del tiempo", "paradoja temporal"

3. **Multilingüe**:
   - Buscar en español: "familia"
   - Buscar en inglés: "family"
   - Ambos deben dar resultados similares

### Verificar Servicio de Embeddings

```bash
curl http://localhost:5000/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "model": "paraphrase-multilingual-MiniLM-L12-v2",
  "embedding_dim": 384
}
```

### Generar Embedding de Prueba

```bash
curl -X POST http://localhost:5000/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["doctor", "médico"]}'
```

---

## Producción

### Docker

Para producción, el servicio de embeddings debe correr en el mismo contenedor del backend.

Agregar al `Dockerfile`:

```dockerfile
# Instalar Python y dependencias
RUN apt-get update && apt-get install -y python3 python3-pip
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Copiar servicio de embeddings
COPY src/modules/embeddings/embedding-service.py .

# Script de inicio que corre ambos servicios
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]
```

Crear `start.sh`:

```bash
#!/bin/bash
# Iniciar servicio de embeddings en background
python3 embedding-service.py &

# Iniciar backend
node dist/main.js
```

---

## Monitoreo

### Logs Importantes

```bash
# Verificar que el servicio de embeddings está disponible
grep "Embedding service is available" logs/backend.log

# Ver cuántos embeddings se están generando
grep "Generating embeddings for" logs/backend.log

# Ver hits del caché
grep "Cache hit" logs/backend.log
```

### Métricas

El servicio registra:
- Número de embeddings generados
- Hits/misses del caché
- Tiempo de respuesta de búsquedas

---

## Recursos

- [Sentence Transformers Documentation](https://www.sbert.net/)
- [Elasticsearch Dense Vector](https://www.elastic.co/guide/en/elasticsearch/reference/current/dense-vector.html)
- [Compromise NLP](https://github.com/spencermountain/compromise)
