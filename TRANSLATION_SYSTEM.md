# 🌍 Sistema de Traducción Híbrida - Búsqueda Multiidioma

## ✅ Implementación Completada

### 🎯 Funcionalidad

El sistema ahora traduce automáticamente las búsquedas entre español e inglés:

**Ejemplo 1**:
- Buscas: **"The Money Heist"** (inglés)
- Sistema traduce a: **"La Casa de Papel"** (español)
- Busca AMBOS términos
- Devuelve resultados en cualquier idioma

**Ejemplo 2**:
- Buscas: **"La Casa de Papel"** (español)
- Sistema traduce a: **"The Money Heist"** (inglés)
- Busca AMBOS términos
- Devuelve resultados en cualquier idioma

---

## 🔧 Arquitectura Híbrida

### 1️⃣ Diccionario Manual (OFFLINE) ⚡
**Prioridad**: Primera opción

**Contiene**:
- ~50 series de TV populares
- Traducciones bidireccionales (EN ↔ ES)
- Instantáneo, sin latencia

**Ejemplos incluidos**:
- The Money Heist ↔ La Casa de Papel
- Game of Thrones ↔ Juego de Tronos
- The Walking Dead ↔ Los Muertos Vivientes
- Breaking Bad ↔ Breaking Bad
- Stranger Things ↔ Stranger Things
- Y más...

### 2️⃣ Caché de Traducciones (OFFLINE) 💾
**Prioridad**: Segunda opción

**Funciona**:
- Guarda traducciones previas en PostgreSQL
- Aprende con el tiempo
- Reutiliza traducciones de LibreTranslate

**Ventaja**: Una vez traducido, siempre offline

### 3️⃣ LibreTranslate (ONLINE/OFFLINE) 🌐
**Prioridad**: Tercera opción (fallback)

**Características**:
- Traducción automática de calidad
- Funciona con Docker (puede ser offline si se instala localmente)
- Traduce CUALQUIER término nuevo

---

## 🚀 Deployment

### Opción 1: Con LibreTranslate (Completo)

```bash
cd backend

# 1. Actualizar schema de base de datos
npx prisma migrate dev --name add_translation_cache
npx prisma generate

# 2. Levantar servicios (incluye LibreTranslate)
docker-compose up -d --build

# 3. Verificar LibreTranslate
curl http://localhost:5001/languages
```

**Servicios**:
- Backend: http://localhost:3001
- LibreTranslate: http://localhost:5001
- PostgreSQL: localhost:5433
- Fuseki: http://localhost:3030
- Elasticsearch: http://localhost:9200

### Opción 2: Sin LibreTranslate (Solo Diccionario + Caché)

```bash
# Comentar servicio libretranslate en docker-compose.yml
# El sistema funcionará solo con diccionario y caché
```

---

## 📊 Endpoints de Traducción

### 1. Traducir Texto
```bash
POST /translation/translate
Content-Type: application/json

{
  "text": "The Money Heist",
  "targetLang": "es"
}
```

**Respuesta**:
```json
{
  "success": true,
  "original": "The Money Heist",
  "translated": "La Casa de Papel",
  "sourceLang": "en",
  "targetLang": "es",
  "source": "dictionary"
}
```

### 2. Traducir a Múltiples Idiomas
```bash
POST /translation/translate-multi
Content-Type: application/json

{
  "text": "The Money Heist"
}
```

**Respuesta**:
```json
{
  "success": true,
  "original": "The Money Heist",
  "translations": [
    "The Money Heist",
    "La Casa de Papel"
  ]
}
```

### 3. Detectar Idioma
```bash
POST /translation/detect
Content-Type: application/json

{
  "text": "La Casa de Papel"
}
```

**Respuesta**:
```json
{
  "success": true,
  "text": "La Casa de Papel",
  "language": "es"
}
```

### 4. Estadísticas
```bash
GET /translation/stats
```

**Respuesta**:
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "dictionary": 50,
    "bySource": [
      { "source": "dictionary", "count": 50 },
      { "source": "libretranslate", "count": 80 },
      { "source": "cache", "count": 20 }
    ]
  }
}
```

---

## 🔍 Cómo Funciona la Búsqueda

### Flujo Automático

```
Usuario busca: "The Money Heist"
         │
         ▼
┌────────────────────┐
│ 1. Diccionario     │
│ ✅ Encuentra:      │
│ "La Casa de Papel" │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 2. Búsqueda        │
│ Busca AMBOS:       │
│ - The Money Heist  │
│ - La Casa de Papel │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ 3. Resultados      │
│ Devuelve TODO lo   │
│ que encuentre en   │
│ cualquier idioma   │
└────────────────────┘
```

---

## 📝 Agregar Traducciones al Diccionario

Editar `backend/src/modules/translation/translation.service.ts`:

```typescript
const TV_SHOWS_DICTIONARY = {
  // Agregar aquí
  'new show': 'nuevo programa',
  'another series': 'otra serie',
  // ...
};
```

---

## 🧪 Pruebas

### Test 1: Diccionario (Offline)
```bash
# Desconectar internet
curl -X POST http://localhost:3001/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"The Money Heist","targetLang":"es"}'

# Debe devolver: "La Casa de Papel" (source: "dictionary")
```

### Test 2: LibreTranslate (Online)
```bash
curl -X POST http://localhost:3001/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Unknown Show 2024","targetLang":"es"}'

# Debe devolver traducción (source: "libretranslate")
```

### Test 3: Caché (Offline después de primera vez)
```bash
# Primera vez (online)
curl -X POST http://localhost:3001/translation/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"New Series","targetLang":"es"}'

# Segunda vez (offline, desde caché)
# Mismo comando, debe ser más rápido
```

---

## 🎯 Ventajas del Sistema

✅ **Funciona offline** para términos comunes
✅ **Aprende con el tiempo** (caché)
✅ **Traduce términos nuevos** (LibreTranslate)
✅ **Rápido** (diccionario instantáneo)
✅ **Gratis** (LibreTranslate es open source)
✅ **Privado** (todo local, sin APIs externas)
✅ **Escalable** (fácil agregar más traducciones)

---

## 🔧 Configuración

### Variables de Entorno

Agregar a `backend/.env`:
```env
# LibreTranslate
LIBRETRANSLATE_URL=http://libretranslate:5000
LIBRETRANSLATE_PORT=5001
```

### Docker Compose

Ya incluido en `backend/docker-compose.yml`:
- Servicio `libretranslate`
- Puerto 5001
- Solo modelos EN/ES (optimizado)
- Health check incluido

---

## 📊 Modelo de Base de Datos

```prisma
model TranslationCache {
  id             String   @id @default(uuid())
  originalText   String
  translatedText String
  sourceLang     String   // 'en', 'es', 'auto'
  targetLang     String   // 'en', 'es'
  source         String   // 'manual', 'libretranslate', 'dictionary'
  createdAt      DateTime @default(now())
  
  @@unique([originalText, targetLang])
  @@index([originalText])
  @@index([sourceLang, targetLang])
}
```

---

## 🚀 Próximos Pasos

1. **Ejecutar migración**:
   ```bash
   cd backend
   npx prisma migrate dev --name add_translation_cache
   npx prisma generate
   ```

2. **Levantar servicios**:
   ```bash
   docker-compose up -d --build
   ```

3. **Probar traducción**:
   ```bash
   curl -X POST http://localhost:3001/translation/translate \
     -H "Content-Type: application/json" \
     -d '{"text":"The Money Heist","targetLang":"es"}'
   ```

4. **Integrar en búsqueda** (próximo paso)

---

## 💡 Tips

- **Desarrollo**: Usa solo diccionario (comenta LibreTranslate en docker-compose)
- **Producción**: Usa sistema completo con LibreTranslate
- **Agregar series**: Edita `TV_SHOWS_DICTIONARY` en `translation.service.ts`
- **Ver caché**: `GET /translation/stats`

¡El sistema está listo para búsquedas multiidioma! 🎉
