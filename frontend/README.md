# 🎨 Frontend - Arquitectura y Documentación Técnica

## 📋 Índice
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Estructura de Directorios](#estructura-de-directorios)
- [Internacionalización (i18n)](#internacionalización-i18n)
- [Componentes Principales](#componentes-principales)
- [Integración con Backend](#integración-con-backend)
- [Comandos y Scripts](#comandos-y-scripts)

---

## 📖 Descripción General

El frontend es una aplicación **Next.js 15** (App Router) que proporciona una interfaz moderna y reactiva para el motor de búsqueda semántica. Implementa características avanzadas como internacionalización nativa, integración con DBpedia, PWA, y una experiencia de usuario fluida.

**Características principales**:
- **Progressive Web App (PWA)**: Instalable, funciona offline, caché inteligente
- Interfaz multilingüe (Español/Inglés) con rutas dinámicas
- Búsqueda híbrida (local + DBpedia) en tiempo real
- Gestión de archivos OWL/RDF con visualización de metadatos
- Diseño responsive y moderno con Tailwind CSS
- Optimización SEO con Server-Side Rendering (SSR)
- IndexedDB para almacenamiento offline

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO (Navegador)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS 15 (App Router)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Routing Layer                                   │   │
│  │  - /[lang]              → Home (ES/EN)           │   │
│  │  - /[lang]/search       → Búsqueda               │   │
│  │  - /                    → Redirect a /es         │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Components                                      │   │
│  │  - LanguageSelector: Cambio de idioma            │   │
│  │  - SearchPage: Interfaz de búsqueda              │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Libraries (src/lib/)                            │   │
│  │  - i18n.ts: Sistema de traducciones              │   │
│  │  - dbpedia.ts: Cliente API DBpedia               │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────┬──────────────────────────────────────┘
                    │ HTTP/REST
                    ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (NestJS - Port 3001)                │
└─────────────────────────────────────────────────────────┘
                    │ HTTP
                    ▼
┌─────────────────────────────────────────────────────────┐
│              DBPEDIA (API Externa)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Estructura de Directorios

```
frontend/
├── src/
│   ├── app/                    # Rutas de Next.js (App Router)
│   │   ├── [lang]/             # Rutas dinámicas por idioma
│   │   │   ├── page.tsx        # Home page (ES/EN)
│   │   │   └── search/
│   │   │       └── page.tsx    # Página de búsqueda
│   │   ├── layout.tsx          # Layout raíz (HTML wrapper + PWA meta)
│   │   ├── page.tsx            # Redirect a /es
│   │   └── globals.css         # Estilos globales
│   ├── components/             # Componentes reutilizables
│   │   ├── LanguageSelector.tsx
│   │   ├── OfflineBanner.tsx   # Banner modo offline
│   │   └── InstallPrompt.tsx   # Prompt instalación PWA
│   ├── hooks/                  # Custom React hooks
│   │   └── useOnlineStatus.ts  # Detección online/offline
│   ├── lib/                    # Librerías y utilidades
│   │   ├── i18n.ts             # Sistema de internacionalización
│   │   ├── dbpedia.ts          # Cliente API DBpedia
│   │   └── db.ts               # IndexedDB wrapper
│   └── locales/                # Archivos de traducción
│       ├── es/
│       │   └── common.json     # Traducciones en español
│       └── en/
│           └── common.json     # Traducciones en inglés
├── public/                     # Archivos estáticos
│   ├── manifest.json           # PWA manifest
│   ├── offline.html            # Página offline fallback
│   ├── sw.js                   # Service Worker (generado)
│   ├── icon-192x192.png        # Ícono PWA pequeño
│   └── icon-512x512.png        # Ícono PWA grande
├── .env.local                  # Variables de entorno
├── next.config.js              # Configuración Next.js + PWA
├── tailwind.config.ts          # Configuración de Tailwind
└── package.json                # Dependencias
```

---

## 🌍 Internacionalización (i18n)

### Implementación

El sistema de i18n está implementado usando **rutas dinámicas** de Next.js 15, sin dependencias externas.

#### **`src/lib/i18n.ts`** - Sistema de Traducciones
```typescript
export const locales = ['es', 'en'] as const;
export type Locale = typeof locales[number];

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};
```

**Características**:
- Carga dinámica de diccionarios (code splitting)
- Type-safe con TypeScript
- Soporte para async/await

---

### Estructura de Rutas

| URL | Idioma | Componente |
|-----|--------|------------|
| `/` | - | Redirect a `/es` |
| `/es` | Español | Home page |
| `/en` | Inglés | Home page |
| `/es/search` | Español | Búsqueda |
| `/en/search` | Inglés | Búsqueda |

---

### Archivos de Traducción

#### **`src/locales/es/common.json`**
```json
{
  "home": {
    "title": "Buscador Semántico",
    "subtitle": "Búsqueda Inteligente",
    "getStarted": "Comenzar Búsqueda"
  },
  "knowledge": {
    "title": "Base de Conocimiento"
  }
}
```

#### **`src/locales/en/common.json`**
```json
{
  "home": {
    "title": "Semantic Search",
    "subtitle": "Intelligent Search",
    "getStarted": "Get Started"
  },
  "knowledge": {
    "title": "Knowledge Base"
  }
}
```

---

### Uso en Componentes

#### Server Components (Async)
```typescript
// app/[lang]/page.tsx
export default async function Home({ 
  params 
}: { 
  params: Promise<{ lang: Locale }> 
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <h1>{dict.home.title}</h1>;
}
```

#### Client Components (Inline)
```typescript
// app/[lang]/search/page.tsx
'use client';

const translations = {
  es: { search: 'Buscar' },
  en: { search: 'Search' }
};

export default function SearchPage() {
  const params = useParams();
  const lang = params.lang as Locale;
  const t = translations[lang];

  return <button>{t.search}</button>;
}
```

---

## 🧩 Componentes Principales

### 1. **`LanguageSelector.tsx`** - Selector de Idioma
**Ubicación**: `src/components/LanguageSelector.tsx`

**Propósito**: Permite al usuario cambiar entre español e inglés.

**Características**:
- Componente cliente (`'use client'`)
- Usa `useRouter` y `usePathname` de Next.js
- Cambia la URL preservando la ruta actual

**Implementación**:
```typescript
'use client';

export default function LanguageSelector({ currentLang }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLang: Locale) => {
    const segments = pathname.split('/');
    segments[1] = newLang;  // Reemplaza el segmento de idioma
    router.push(segments.join('/'));
  };

  return (
    <div>
      <button onClick={() => switchLanguage('es')}>🇪🇸 ES</button>
      <button onClick={() => switchLanguage('en')}>🇬🇧 EN</button>
    </div>
  );
}
```

---

### 2. **`app/[lang]/page.tsx`** - Home Page
**Propósito**: Página de inicio con presentación del proyecto.

**Características**:
- Server Component (SSR)
- Traducciones dinámicas según idioma
- Animaciones con Tailwind CSS
- Links a la página de búsqueda

**Secciones**:
- Hero con título y descripción
- Tarjetas de características (3 columnas)
- Footer con información

---

### 3. **`app/[lang]/search/page.tsx`** - Página de Búsqueda
**Propósito**: Interfaz principal de búsqueda con gestión de archivos.

**Características**:
- Client Component (`'use client'`)
- Búsqueda híbrida (local + DBpedia)
- Sidebar con lista de archivos
- Resultados en dos columnas (local | DBpedia)

**Estados manejados**:
```typescript
const [query, setQuery] = useState('');
const [files, setFiles] = useState<Document[]>([]);
const [results, setResults] = useState<SearchResult[]>([]);
const [dbpediaResults, setDbpediaResults] = useState<DBpediaResult[]>([]);
const [isUploading, setIsUploading] = useState(false);
const [isSearching, setIsSearching] = useState(false);
const [isSidebarOpen, setIsSidebarOpen] = useState(true);
```

**Funcionalidades**:
1. **Carga de archivos**: Drag & drop o click para subir `.owl`/`.rdf`
2. **Lista de archivos**: Muestra archivos subidos con opción de eliminar
3. **Búsqueda**: Input con autocompletado y búsqueda en tiempo real
4. **Resultados**:
   - Columna izquierda: Resultados de DBpedia
   - Columna derecha: Resultados locales
5. **Sidebar responsive**: Colapsable en móviles

---

## 🔌 Integración con Backend

### **`src/lib/dbpedia.ts`** - Cliente DBpedia
```typescript
export async function searchDBpedia(
  query: string, 
  lang: Locale
): Promise<DBpediaResult[]> {
  const response = await fetch(
    `http://lookup.dbpedia.org/api/search?query=${query}&lang=${lang}`
  );
  return response.json();
}
```

---

### API Calls al Backend

#### Subir Archivo
```typescript
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
};
```

#### Búsqueda
```typescript
const handleSearch = async (query: string) => {
  const [localRes, dbpediaRes] = await Promise.all([
    fetch(`${API_URL}/search?q=${query}`),
    searchDBpedia(query, lang)
  ]);
};
```

#### Listar Archivos
```typescript
const fetchFiles = async () => {
  const res = await fetch(`${API_URL}/upload/documents`);
  const data = await res.json();
  setFiles(data);
};
```

#### Eliminar Archivo
```typescript
const handleDelete = async (id: string) => {
  await fetch(`${API_URL}/upload/documents/${id}`, {
    method: 'DELETE'
  });
};
```

---

## 🎨 Diseño y Estilos

### Tailwind CSS
**Configuración**: `tailwind.config.ts`

**Paleta de colores**:
- Púrpura: `purple-400` a `purple-950`
- Rosa: `pink-400` a `pink-600`
- Slate: `slate-300` a `slate-950`

**Efectos visuales**:
- Gradientes: `bg-gradient-to-br from-purple-500 to-pink-500`
- Blur: `backdrop-blur-xl`
- Sombras: `shadow-2xl shadow-purple-500/20`
- Animaciones: `animate-pulse`, `hover:scale-105`

---

## 🚀 Comandos y Scripts

### Desarrollo
```bash
# Instalar dependencias
npm install

# Modo desarrollo (hot-reload)
npm run dev
# Acceder a: http://localhost:3000
```

### Producción
```bash
# Build optimizado
npm run build

# Ejecutar build
npm start
```

### Linting
```bash
# Verificar código
npm run lint
```

---

## 🔧 Variables de Entorno

**Archivo**: `.env.local`

```env
# URL del backend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Nota**: Variables con prefijo `NEXT_PUBLIC_` son accesibles en el cliente.

---

## 📦 Dependencias Clave

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `next` | ^16.0.0 | Framework React con SSR |
| `react` | ^19.0.0 | Biblioteca UI |
| `next-pwa` | ^5.6.0 | PWA support con Workbox |
| `idb` | ^8.0.0 | IndexedDB wrapper |
| `tailwindcss` | ^4.0.0 | Framework CSS |
| `typescript` | ^5.0.0 | Tipado estático |

---

## 🎯 Flujos de Usuario

### Flujo de Búsqueda
```
1. Usuario ingresa término en input
   ↓
2. Click en botón de búsqueda
   ↓
3. Llamadas paralelas:
   - Backend (local): /search?q=term
   - DBpedia (externa): lookup.dbpedia.org
   ↓
4. Combinar resultados
   ↓
5. Renderizar en dos columnas
   - Izquierda: DBpedia (azul)
   - Derecha: Local (púrpura)
```

### Flujo de Carga de Archivo
```
1. Usuario selecciona archivo .owl
   ↓
2. POST /upload con FormData
   ↓
3. Backend procesa:
   - Parsea RDF
   - Guarda en Fuseki
   - Indexa en Elasticsearch
   ↓
4. Actualizar lista de archivos
   ↓
5. Mostrar en sidebar
```

### Flujo de Cambio de Idioma
```
1. Usuario click en 🇪🇸 ES o 🇬🇧 EN
   ↓
2. LanguageSelector detecta pathname actual
   ↓
3. Reemplaza segmento de idioma en URL
   ↓
4. router.push() a nueva ruta
   ↓
5. Next.js re-renderiza con nuevo idioma
```

---

## 🌐 SEO y Performance

### Optimizaciones Implementadas
- **SSR**: Páginas pre-renderizadas en servidor
- **Static Generation**: Rutas `/es` y `/en` generadas en build
- **Code Splitting**: Diccionarios cargados dinámicamente
- **Image Optimization**: Next.js Image component (si se usa)
- **Font Optimization**: Fuentes optimizadas automáticamente

### Metadata
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: "Buscador Semántico de Series TV",
  description: "Motor de búsqueda semántica...",
};
```

---

## 🔒 Mejores Prácticas

### Type Safety
- Todos los componentes tipados con TypeScript
- Interfaces para props y estados
- Type guards para validación

### Accesibilidad
- Atributos `aria-*` en elementos interactivos
- Contraste de colores WCAG AA
- Navegación por teclado

### Performance
- Lazy loading de componentes pesados
- Debounce en búsquedas
- Memoización con `useMemo` y `useCallback` (donde aplique)

---

**Desarrollado con ❤️ usando Next.js 15 y React 19.**
## 📱 Progressive Web App (PWA)

### Características PWA

La aplicación es una **PWA completa** con las siguientes capacidades:

#### 1. **Instalabilidad**
- Se puede instalar como aplicación nativa en desktop y móvil
- Ícono personalizado de Synapse Search
- Funciona como app independiente del navegador

#### 2. **Modo Offline**
- Service Worker cachea recursos automáticamente
- Páginas visitadas disponibles sin conexión
- Banner de estado offline visible
- Página fallback personalizada

#### 3. **Almacenamiento Local (IndexedDB)**
Tres stores de datos:
- `searches`: Caché de búsquedas realizadas
- `files`: Lista de archivos subidos
- `pendingUploads`: Uploads pendientes cuando offline

#### 4. **Componentes PWA**

**OfflineBanner** (`src/components/OfflineBanner.tsx`):
- Banner naranja/rojo que aparece cuando se pierde conexión
- Desaparece automáticamente al reconectar

**InstallPrompt** (`src/components/InstallPrompt.tsx`):
- Prompt elegante para instalar la app
- Aparece automáticamente cuando la app es instalable
- Diseño moderno con gradiente púrpura/rosa

**useOnlineStatus** (`src/hooks/useOnlineStatus.ts`):
- Hook React para detectar estado de conexión
- Actualización en tiempo real

### Configuración PWA

**next.config.js**:
```javascript
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [...]
});
```

**Estrategias de caché**:
| Recurso | Estrategia | Duración |
|---------|------------|----------|
| Imágenes | CacheFirst | 60 días |
| CSS/JS | StaleWhileRevalidate | 24 horas |
| Páginas | NetworkFirst | 24 horas |
| API externa | NetworkFirst | 1 hora |

### Instalación

**Desktop (Chrome/Edge)**:
1. Visita la app
2. Click en ícono de instalación en barra de direcciones
3. O espera el popup `InstallPrompt`

**Mobile (Android/iOS)**:
1. Abre en Chrome/Safari
2. Menú → "Agregar a pantalla de inicio"

### Verificación PWA

```bash
# Build de producción (PWA deshabilitado en dev)
npm run build
npm start

# Abrir DevTools → Application
# - Service Workers: Verificar "activated and running"
# - Manifest: Verificar sin errores
# - Cache Storage: Ver recursos cacheados
```

**Lighthouse Audit**:
1. DevTools → Lighthouse
2. Seleccionar "Progressive Web App"
3. Run audit
4. Objetivo: Score > 90

---
