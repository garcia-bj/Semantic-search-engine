# 🚀 Guía Paso a Paso: Poner en Funcionamiento el Buscador Semántico

## ✅ Opción Rápida (5 minutos - SIN Python)

### Paso 1: Actualizar Base de Datos

```bash
cd b:\BUSCADOR_SEMANTICO\backend
npx prisma db push
```

**Resultado esperado**:
```
✔ Your database is now in sync with your Prisma schema
```

### Paso 2: Generar Cliente de Prisma

```bash
npx prisma generate
```

**Resultado esperado**:
```
✔ Generated Prisma Client
```

### Paso 3: Verificar que Node.js está instalado

```bash
npm --version
```

Debería mostrar la versión (ej: `10.2.4`)

### Paso 4: Instalar/Actualizar Dependencias

```bash
npm install
```

**Resultado esperado**:
```
added X packages, and audited Y packages in Zs
```

### Paso 5: Iniciar el Backend

```bash
npm run start:dev
```

**Resultado esperado**:
```
[Nest] LOG [NestApplication] Nest application successfully started
[EmbeddingsService] ⚠️  Embedding service not available
[EmbeddingsService]    Semantic search will work with query expansion only
```

**✅ ¡Listo!** El backend está corriendo con búsqueda semántica (sin embeddings).

### Paso 6: Iniciar el Frontend

En otra terminal:

```bash
cd b:\BUSCADOR_SEMANTICO\frontend
npm run dev
```

### Paso 7: Probar

1. Abrir navegador: `http://localhost:3000`
2. Ir a la sección de búsqueda
3. Subir un archivo OWL/RDF
4. Buscar "doctor" → Debería encontrar "médico", "physician"

---

## 🐍 Opción Completa (CON Python - Mejor Calidad)

### Prerequisitos

1. **Verificar Python**:
```bash
python --version
```

Debe ser Python 3.8 o superior.

2. **Si no tienes Python o da error**:
   - Descargar de [python.org](https://www.python.org/downloads/)
   - Durante instalación: ✅ Marcar "Add Python to PATH"
   - Durante instalación: ✅ Marcar "Install pip"

### Paso 1: Crear Entorno Virtual (Recomendado)

```bash
cd b:\BUSCADOR_SEMANTICO\backend
python -m venv venv
```

### Paso 2: Activar Entorno Virtual

```bash
venv\Scripts\activate
```

Tu prompt debería cambiar a mostrar `(venv)`.

### Paso 3: Actualizar pip

```bash
python -m pip install --upgrade pip setuptools wheel
```

### Paso 4: Instalar Dependencias Python

```bash
pip install sentence-transformers==2.2.2 flask==3.0.0 flask-cors==4.0.0
```

**Nota**: Esto descargará ~500MB la primera vez. Puede tardar 5-10 minutos.

**Resultado esperado**:
```
Successfully installed sentence-transformers-2.2.2 flask-3.0.0 ...
```

### Paso 5: Iniciar Servicio de Embeddings

```bash
cd src\modules\embeddings
python embedding-service.py
```

**Resultado esperado**:
```
Loading embedding model: paraphrase-multilingual-MiniLM-L12-v2
Model loaded successfully. Embedding dimension: 384
 * Running on http://0.0.0.0:5000
```

**⚠️ Dejar esta terminal abierta** - El servicio debe seguir corriendo.

### Paso 6: Actualizar Base de Datos

En **otra terminal**:

```bash
cd b:\BUSCADOR_SEMANTICO\backend
npx prisma db push
npx prisma generate
```

### Paso 7: Iniciar Backend

```bash
npm run start:dev
```

**Resultado esperado**:
```
[EmbeddingsService] Embedding service is available at http://localhost:5000
[EmbeddingsService] Model: paraphrase-multilingual-MiniLM-L12-v2, Dimension: 384
```

### Paso 8: Iniciar Frontend

En **otra terminal**:

```bash
cd b:\BUSCADOR_SEMANTICO\frontend
npm run dev
```

### Paso 9: Probar

1. Abrir: `http://localhost:3000`
2. Subir archivo OWL
3. Buscar "doctor"
4. En los logs del backend deberías ver:
   ```
   [SearchService] Vector search returned X results
   [SearchService] Expanded search returned Y results
   ```

---

## 🔍 Verificación

### Verificar que el Servicio de Embeddings Funciona

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

### Verificar que la Base de Datos está Actualizada

```bash
cd backend
npx prisma studio
```

Deberías ver las tablas:
- `documents` (con campos `accessCount`, `lastAccess`, `updatedAt`)
- `Embedding` (nueva tabla)

---

## ❌ Solución de Problemas Comunes

### Error: "Cannot find module '@nestjs/axios'"

**Solución**:
```bash
cd backend
npm install
```

### Error: "Port 3001 is already in use"

**Solución**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# O cambiar puerto en backend/.env
PORT=3002
```

### Error: "ECONNREFUSED localhost:5000"

**Causa**: Servicio de embeddings no está corriendo.

**Solución**:
- **Opción 1**: Iniciar el servicio Python (ver Paso 5 arriba)
- **Opción 2**: Usar sin embeddings (el sistema funcionará igual)

### Error: "Prisma Client not generated"

**Solución**:
```bash
cd backend
npx prisma generate
```

### La búsqueda no encuentra sinónimos

**Verificar**:
1. ¿Subiste archivos OWL/RDF a la base de conocimiento?
2. ¿Reiniciaste el backend después de actualizar?
3. Revisar logs del backend para ver qué tipo de búsqueda se está usando

---

## 📋 Checklist Final

Antes de decir que funciona, verifica:

- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Puedes subir archivos OWL/RDF
- [ ] Puedes hacer búsquedas
- [ ] La búsqueda encuentra resultados
- [ ] (Opcional) Servicio de embeddings responde en puerto 5000

---

## 🎯 Próximos Pasos

Una vez que funcione:

1. **Subir datos de prueba**: Sube archivos OWL con información de series
2. **Probar búsquedas**: Intenta diferentes consultas
3. **Comparar resultados**: Compara con la búsqueda anterior
4. **Ajustar sinónimos**: Edita `query-expansion.service.ts` para añadir más sinónimos

---

## 💡 Consejos

- **Desarrollo**: Usa Opción Rápida (sin Python) para iterar rápido
- **Producción**: Usa Opción Completa (con Python) para mejor calidad
- **Logs**: Revisa los logs del backend para entender qué está pasando
- **Caché**: Los embeddings se cachean, la segunda búsqueda será más rápida

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:

1. Revisa los logs del backend
2. Verifica que todos los servicios estén corriendo
3. Asegúrate de que la base de datos esté actualizada
4. Prueba primero la Opción Rápida (sin Python)
