# 🚀 PASO A PASO - OPCIÓN 1 (Sin Python)

## ✅ Pasos para Poner en Funcionamiento

### Paso 1: Actualizar Base de Datos

Abre una terminal en `b:\BUSCADOR_SEMANTICO\backend` y ejecuta:

```bash
npx prisma db push
```

**✅ Resultado esperado:**
```
Your database is now in sync with your Prisma schema. Done in 150ms
```

---

### Paso 2: Generar Cliente de Prisma

En la misma terminal:

```bash
npx prisma generate
```

**✅ Resultado esperado:**
```
✔ Generated Prisma Client (v5.22.0)
```

---

### Paso 3: Iniciar el Backend

En la misma terminal:

```bash
npm run start:dev
```

**✅ Resultado esperado:**
```
[Nest] LOG [NestApplication] Nest application successfully started
[EmbeddingsService] ⚠️  Embedding service not available
[EmbeddingsService]    Semantic search will work with query expansion only
```

**⚠️ Nota**: El warning sobre el servicio de embeddings es NORMAL. El sistema funcionará perfectamente sin él.

**🎉 ¡El backend está listo!**

---

### Paso 4: Iniciar el Frontend

Abre **OTRA TERMINAL** en `b:\BUSCADOR_SEMANTICO\frontend` y ejecuta:

```bash
npm run dev
```

**✅ Resultado esperado:**
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
```

---

### Paso 5: Probar el Buscador

1. **Abrir navegador**: `http://localhost:3000`

2. **Ir a búsqueda**: Click en "Búsqueda Semántica" o navega a `/es/search`

3. **Subir archivo OWL**:
   - Click en "Subir archivo"
   - Selecciona un archivo `.owl` o `.rdf`
   - Espera a que se procese

4. **Hacer una búsqueda**:
   - Escribe "doctor" en el buscador
   - Deberías ver resultados con "doctor", "médico", "physician"

---

## ✅ Verificación de que Funciona

### Backend funcionando correctamente si ves:

```
[Nest] LOG [NestApplication] Nest application successfully started +2ms
[EmbeddingsService] ⚠️  Embedding service not available
[SearchService] Search for "doctor" returned X results
```

### Frontend funcionando correctamente si:

- La página carga sin errores
- Puedes subir archivos OWL
- Puedes hacer búsquedas
- Ves resultados

---

## 🎯 ¿Qué Mejoras Tienes Ahora?

Aunque no uses embeddings (Python), tu buscador YA tiene:

✅ **Expansión de consultas**: Buscar "doctor" encuentra "médico", "physician"
✅ **Sinónimos multilingües**: Español e inglés
✅ **Extracción de entidades**: Identifica personas, lugares, organizaciones
✅ **Búsqueda SPARQL mejorada**: Más inteligente que antes
✅ **Ranking semántico**: Mejores resultados primero

---

## ❌ Solución de Problemas

### Error: "Port 3001 is already in use"

**Solución**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <número_que_aparece> /F
```

### Error: "Cannot find module '@nestjs/axios'"

**Solución**:
```bash
cd backend
npm install
```

### Error: "Prisma Client not generated"

**Solución**:
```bash
cd backend
npx prisma generate
```

### El frontend no carga

**Solución**:
```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Comparación: Antes vs Ahora

| Característica | Antes | Ahora (Opción 1) |
|----------------|-------|------------------|
| Buscar "doctor" | Solo "doctor" | "doctor", "médico", "physician" |
| Buscar "viaje temporal" | 0 resultados | Encuentra términos relacionados |
| Sinónimos | ❌ No | ✅ Sí |
| Multilingüe | ❌ No | ✅ Sí (ES/EN) |
| Ranking | Básico | ⭐⭐⭐ Mejorado |

---

## 🐍 ¿Quieres Más? (Opción 2 - Con Python)

Si más adelante quieres añadir búsqueda vectorial con embeddings:

1. Instalar Python 3.8+
2. Crear entorno virtual
3. Instalar dependencias: `pip install sentence-transformers flask flask-cors`
4. Iniciar servicio: `python backend/src/modules/embeddings/embedding-service.py`
5. Reiniciar backend

Ver `PASO_A_PASO.md` para instrucciones detalladas.

---

## 🎉 ¡Listo!

Tu buscador semántico está funcionando. Ahora puedes:

1. Subir archivos OWL/RDF
2. Hacer búsquedas inteligentes
3. Encontrar resultados por contexto, no solo palabras exactas

**¿Tienes algún problema?** Revisa la sección de "Solución de Problemas" arriba.
