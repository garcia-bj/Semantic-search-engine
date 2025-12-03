# Guía de Instalación: Búsqueda Semántica

## ⚡ Opción 1: Instalación Rápida (SIN Python - Recomendado para empezar)

Esta opción te da búsqueda semántica mejorada **sin necesidad de Python**:
- ✅ Expansión de consultas con sinónimos
- ✅ Búsqueda SPARQL mejorada
- ✅ Ranking semántico
- ✅ Extracción de entidades con NLP

### Pasos:

1. **Actualizar base de datos**:
```bash
cd backend
npx prisma db push
npx prisma generate
```

2. **Configurar variables de entorno**:

Editar `backend/.env` y agregar:
```env
# Deshabilitar servicio de embeddings (no disponible)
EMBEDDING_SERVICE_URL=http://localhost:5000
ENABLE_SEMANTIC_SEARCH=true
```

3. **Instalar dependencias Node.js** (si no lo hiciste):
```bash
cd backend
npm install
```

4. **Iniciar backend**:
```bash
npm run start:dev
```

5. **¡Probar!**

El buscador ya funciona con mejoras semánticas:
- Buscar "doctor" encontrará "médico", "physician"
- Buscar "viajes en el tiempo" encontrará términos relacionados
- Expansión automática de consultas

---

## 🐍 Opción 2: Instalación Completa (CON Python - Máxima Calidad)

Esta opción incluye embeddings vectoriales para búsqueda por similitud semántica.

### Requisitos:

- Python 3.8 o superior
- pip actualizado

### Pasos:

#### 1. Arreglar Python (Windows)

El error indica que falta `distutils`. Soluciones:

**Solución A - Reinstalar Python**:
1. Descargar Python desde [python.org](https://www.python.org/downloads/)
2. Durante instalación, marcar "Add Python to PATH"
3. Marcar "Install pip"
4. Marcar "Install for all users"

**Solución B - Instalar setuptools**:
```bash
pip install --upgrade pip setuptools
```

**Solución C - Usar Python desde Microsoft Store**:
```bash
# Desinstalar Python actual
# Instalar desde Microsoft Store (incluye distutils)
```

#### 2. Crear entorno virtual (Recomendado)

```bash
cd backend
python -m venv venv

# Activar (Windows)
venv\Scripts\activate

# Activar (Linux/Mac)
source venv/bin/activate
```

#### 3. Instalar dependencias Python

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Nota**: La primera vez descargará ~500MB de modelos.

#### 4. Iniciar servicio de embeddings

En una terminal separada:

```bash
cd backend/src/modules/embeddings
python embedding-service.py
```

Deberías ver:
```
Loading embedding model: paraphrase-multilingual-MiniLM-L12-v2
Model loaded successfully
Starting embedding service on port 5000
```

#### 5. Configurar variables de entorno

Editar `backend/.env`:
```env
EMBEDDING_SERVICE_URL=http://localhost:5000
ENABLE_SEMANTIC_SEARCH=true
```

#### 6. Actualizar base de datos

```bash
cd backend
npx prisma db push
npx prisma generate
```

#### 7. Iniciar backend

En otra terminal:
```bash
cd backend
npm run start:dev
```

---

## 🧪 Verificar que Funciona

### Opción 1 (Sin Python):

1. Abrir el frontend: `http://localhost:3000`
2. Buscar "doctor"
3. Deberías ver resultados con "médico", "physician"

### Opción 2 (Con Python):

1. Verificar servicio de embeddings:
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

2. Abrir el frontend y buscar
3. En los logs del backend deberías ver:
```
[EmbeddingsService] Embedding service is available
[SearchService] Vector search returned X results
```

---

## 🔧 Solución de Problemas

### Error: "ModuleNotFoundError: No module named 'distutils'"

**Causa**: Python no tiene `distutils` instalado.

**Solución**:
1. Reinstalar Python desde python.org
2. O usar Opción 1 (sin Python)

### Error: "ECONNREFUSED localhost:5000"

**Causa**: El servicio de embeddings no está corriendo.

**Solución**:
- Si usas Opción 1: Es normal, el sistema funcionará sin embeddings
- Si usas Opción 2: Iniciar el servicio de Python

### La búsqueda no mejora

**Verificar**:
1. ¿Se actualizó la base de datos? `npx prisma db push`
2. ¿Se reinició el backend después de los cambios?
3. ¿Hay datos en la base de conocimiento? (subir archivos OWL)

---

## 📊 Comparación de Opciones

| Característica | Opción 1 (Sin Python) | Opción 2 (Con Python) |
|----------------|----------------------|----------------------|
| **Instalación** | ⭐⭐⭐⭐⭐ Muy fácil | ⭐⭐⭐ Moderada |
| **Sinónimos** | ✅ Sí | ✅ Sí |
| **Expansión de consultas** | ✅ Sí | ✅ Sí |
| **Búsqueda vectorial** | ❌ No | ✅ Sí |
| **Similitud semántica** | ⭐⭐⭐ Buena | ⭐⭐⭐⭐⭐ Excelente |
| **Rendimiento** | ⚡ Rápido | ⚡ Rápido (con caché) |

---

## 🚀 Recomendación

**Para empezar**: Usa **Opción 1** (sin Python)
- Instalación en 2 minutos
- Ya tendrás búsqueda semántica mejorada
- Funciona perfectamente

**Para producción**: Migra a **Opción 2** (con Python)
- Mejor calidad de resultados
- Búsqueda por similitud vectorial
- Vale la pena el esfuerzo extra

---

## 📝 Siguiente Paso

**Si eliges Opción 1**:
```bash
cd backend
npx prisma db push
npm run start:dev
```

**Si eliges Opción 2**:
1. Arreglar Python primero
2. Luego seguir los pasos de la Opción 2

¿Cuál opción prefieres?
