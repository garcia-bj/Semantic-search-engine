# 🎨 Frontend - Next.js 16 Progressive Web App

> **Documentación Técnica Completa del Frontend**

Esta es la interfaz de usuario de Synapse Search. Una aplicación moderna construida con **Next.js 16** utilizando el nuevo **App Router** para máximo rendimiento, SEO y experiencia de usuario.

---

## 📑 Tabla de Contenidos

- [Arquitectura del Frontend](#️-arquitectura-del-frontend)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Características Técnicas](#-características-técnicas)
- [Internacionalización (i18n)](#-internacionalización-i18n)
- [Progressive Web App (PWA)](#-progressive-web-app-pwa)
- [Patrones de Diseño](#-patrones-de-diseño)
- [Optimizaciones](#-optimizaciones)
- [Troubleshooting](#-troubleshooting)

---

## 🏗️ Arquitectura del Frontend

El frontend está diseñado como una **aplicación híbrida (SSR + CSR)** optimizada para la Web Semántica, implementando el patrón **Islands Architecture** de Next.js.

```
┌─────────────────────────────────────────────────────────┐
│              Cliente (Navegador / PWA)                  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   Next.js 16 Server     │
        │    (App Router)         │
        └────┬──────────────┬─────┘
             │              │
    ┌────────▼────┐  ┌──────▼──────┐
    │   Server    │  │   Client    │
    │ Components  │  │ Components  │
    │   (RSC)     │  │ ('use client')│
    └────┬────────┘  └──────┬──────┘
         │                  │
    ┌────▼──────────────────▼─────┐
    │     Backend API (3001)      │
    │   (NestJS REST Endpoints)   │
    └─────────────────────────────┘
```

### Server Components vs Client Components

| Tipo | Cuándo Usar | Ejemplos |
|------|-------------|----------|
| **Server Components** | Fetch de datos, SEO, contenido estático | `page.tsx`, `layout.tsx` |
| **Client Components** | Interactividad, hooks, eventos | `SearchBar.tsx`, `FileUpload.tsx` |

---

## 🛠️ Stack Tecnológico

### Core Framework

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 16.0.4 | Framework React con App Router |
| **React** | 19.2.0 | Librería UI (Server Components) |
| **TypeScript** | ^5 | Tipado estático |
| **Node.js** | 18+ | Runtime (solo para build/dev) |

### Estilos y UI

| Librería | Versión | Uso |
|----------|---------|-----|
| **TailwindCSS** | ^4 | Utility-first CSS (Zero-runtime) |
| **@tailwindcss/typography** | ^0.5.10 | Estilos para contenido markdown |
| **clsx** | ^2.1.0 | Utilidad para clases condicionales |

### Internacionalización

| Librería | Versión | Uso |
|----------|---------|-----|
| **i18next** | ^25.6.3 | Core de i18n |
| **react-i18next** | ^16.3.5 | Bindings para React |
| **next-i18next** | ^15.4.2 | Integración con Next.js |

### PWA y Offline

| Librería | Versión | Uso |
|----------|---------|-----|
| **next-pwa** | ^5.6.0 | Service Worker y manifest |
| **workbox** | (incluido) | Estrategias de caché |
| **idb** | ^8.0.3 | IndexedDB wrapper |

### Networking

| Librería | Versión | Uso |
|----------|---------|-----|
| **axios** | ^1.6.5 | Cliente HTTP (alternativa a fetch) |
| **swr** | ^2.2.4 | Caché de datos y revalidación |

---

## 📂 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                          # App Router (Next.js 13+)
│   │   ├── [lang]/                   # 🌍 Rutas dinámicas por idioma
│   │   │   ├── layout.tsx            # Layout compartido (Navbar, Footer)
│   │   │   ├── page.tsx              # Página principal (/)
│   │   │   └── search/               # Ruta de búsqueda
│   │   │       ├── page.tsx          # Server Component principal
│   │   │       ├── loading.tsx       # Skeleton de carga
│   │   │       └── error.tsx         # Boundary de errores
│   │   ├── api/                      # Route Handlers (API Routes)
│   │   │   └── health/route.ts       # Health check endpoint
│   │   ├── layout.tsx                # Root layout (HTML, body)
│   │   └── globals.css               # Estilos globales de Tailwind
│   │
│   ├── components/                   # 🧩 Componentes reutilizables
│   │   ├── ui/                       # Primitivos (Button, Input, Card)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Card.tsx
│   │   ├── search/                   # Componentes de búsqueda
│   │   │   ├── SearchBar.tsx         # 'use client' - Input con debounce
│   │   │   ├── SearchResults.tsx     # Grid de resultados
│   │   │   └── ResultCard.tsx        # Tarjeta individual
│   │   ├── layout/                   # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── SourceIndicator.tsx       # Badge de origen (Online/Offline)
│   │   └── ToastContainer.tsx        # Notificaciones
│   │
│   ├── lib/                          # 🛠️ Utilidades y helpers
│   │   ├── api-client.ts             # Wrapper de fetch con manejo de errores
│   │   ├── i18n-config.ts            # Configuración de idiomas
│   │   ├── utils.ts                  # Funciones auxiliares
│   │   └── constants.ts              # Constantes globales
│   │
│   ├── locales/                      # 📖 Diccionarios de traducción
│   │   ├── es.json                   # Español
│   │   ├── en.json                   # English
│   │   └── pt.json                   # Português
│   │
│   ├── types/                        # 📝 Definiciones de TypeScript
│   │   ├── api.ts                    # Tipos de respuestas API
│   │   └── search.ts                 # Tipos de búsqueda
│   │
│   └── middleware.ts                 # Middleware de Next.js (i18n redirect)
│
├── public/                           # Archivos estáticos
│   ├── icons/                        # Iconos PWA
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker (generado)
│   └── workbox-*.js                  # Workbox runtime (generado)
│
├── next.config.js                    # Configuración de Next.js
├── tailwind.config.ts                # Configuración de Tailwind
├── tsconfig.json                     # Configuración de TypeScript
└── package.json                      # Dependencias
```

---

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local`:

```env
# URL del Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Configuración de Build
NODE_ENV=development
```

### 3. Iniciar Servidor de Desarrollo

```bash
# Modo desarrollo (hot-reload)
npm run dev

# Build de producción
npm run build

# Servidor de producción
npm run start
```

**URLs:**
- Desarrollo: `http://localhost:3000`
- Producción: `http://localhost:3000`

---

## 🎯 Características Técnicas

### 1. Server Components (RSC)

Next.js 16 introduce **React Server Components** por defecto. Esto significa que los componentes se renderizan en el servidor a menos que uses `'use client'`.

**Ventajas:**
- ✅ Menor bundle de JavaScript en el cliente
- ✅ Acceso directo a bases de datos (si fuera necesario)
- ✅ SEO mejorado (HTML completo desde el servidor)

**Ejemplo:**
```typescript
// app/[lang]/search/page.tsx (Server Component)
export default async function SearchPage({ params }: { params: { lang: string } }) {
  // Este código se ejecuta en el servidor
  const initialData = await fetch(`${API_URL}/search?query=initial`);
  
  return (
    <div>
      <SearchBar /> {/* Client Component */}
      <SearchResults data={initialData} />
    </div>
  );
}
```

### 2. App Router (File-based Routing)

El App Router usa el sistema de archivos para definir rutas:

| Archivo | Ruta | Tipo |
|---------|------|------|
| `app/page.tsx` | `/` | Página |
| `app/layout.tsx` | Todas | Layout |
| `app/[lang]/page.tsx` | `/es`, `/en`, `/pt` | Dinámica |
| `app/[lang]/search/page.tsx` | `/es/search` | Anidada |

### 3. Middleware para i18n

El archivo `middleware.ts` intercepta todas las requests para redirigir según el idioma:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Si la ruta no tiene idioma, detectar y redirigir
  if (pathname === '/') {
    const locale = request.headers.get('accept-language')?.split(',')[0].split('-')[0] || 'es';
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }
  
  return NextResponse.next();
}
```

---

## 🌍 Internacionalización (i18n)

### Configuración

El sistema i18n está configurado en `lib/i18n-config.ts`:

```typescript
export const i18n = {
  defaultLocale: 'es',
  locales: ['es', 'en', 'pt'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
```

### Diccionarios

Los diccionarios están en `locales/{lang}.json`:

```json
// locales/es.json
{
  "search": {
    "placeholder": "Buscar series...",
    "button": "Buscar",
    "noResults": "No se encontraron resultados"
  },
  "upload": {
    "title": "Subir archivo",
    "button": "Seleccionar archivo"
  }
}
```

### Uso en Componentes

```typescript
'use client';
import { useTranslation } from 'react-i18next';

export function SearchBar() {
  const { t } = useTranslation();
  
  return (
    <input 
      placeholder={t('search.placeholder')} 
      aria-label={t('search.button')}
    />
  );
}
```

### Cambio de Idioma

El cambio de idioma se hace mediante navegación:

```typescript
import Link from 'next/link';

export function LanguageSelector({ currentLang }: { currentLang: string }) {
  return (
    <div>
      <Link href="/es/search">ES</Link>
      <Link href="/en/search">EN</Link>
      <Link href="/pt/search">PT</Link>
    </div>
  );
}
```

---

## 📱 Progressive Web App (PWA)

### Configuración (`next.config.js`)

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',           // Dónde generar los workers
  register: true,           // Auto-registrar Service Worker
  skipWaiting: true,        // Actualizar worker inmediatamente
  disable: process.env.NODE_ENV === 'development', // Desactivar en dev
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 año
        }
      }
    },
    {
      urlPattern: /^http:\/\/localhost:3001\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutos
        }
      }
    }
  ]
});

module.exports = withPWA({
  reactStrictMode: true,
  // ... otras configuraciones
});
```

### Manifest (`public/manifest.json`)

```json
{
  "name": "Synapse Search - Buscador Semántico",
  "short_name": "Synapse",
  "description": "Motor de búsqueda semántica para series de TV",
  "start_url": "/es/search",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Estrategias de Caché

| Estrategia | Uso | Comportamiento |
|------------|-----|----------------|
| **CacheFirst** | Fuentes, imágenes estáticas | Sirve de caché, actualiza en background |
| **NetworkFirst** | API calls | Intenta red primero, fallback a caché |
| **StaleWhileRevalidate** | Páginas HTML | Sirve caché, actualiza en background |

---

## 🧩 Patrones de Diseño

### 1. Estado en la URL (Single Source of Truth)

En lugar de usar Redux o Zustand, el estado principal vive en la URL:

```typescript
// app/[lang]/search/page.tsx
export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';
  
  return <SearchResults query={query} />;
}
```

**Ventajas:**
- ✅ URLs compartibles
- ✅ Funciona con el botón "Atrás" del navegador
- ✅ Estado persiste al recargar

### 2. Composición de Componentes

Preferimos composición sobre herencia:

```typescript
// ❌ Malo: Herencia
class SearchCard extends Card { ... }

// ✅ Bueno: Composición
<Card>
  <SearchResult data={result} />
</Card>
```

### 3. Custom Hooks para Lógica Reutilizable

```typescript
// lib/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// Uso en SearchBar
const debouncedQuery = useDebounce(query, 500);
```

---

## ⚡ Optimizaciones

### 1. Optimización de Imágenes

Next.js optimiza imágenes automáticamente:

```typescript
import Image from 'next/image';

<Image 
  src={result.image} 
  alt={result.title}
  width={300}
  height={200}
  loading="lazy"  // Lazy loading automático
/>
```

**Beneficios:**
- Conversión automática a WebP
- Responsive images
- Lazy loading
- Placeholder blur

### 2. Code Splitting Automático

Next.js hace code splitting por ruta automáticamente:

```
/es/search → search.chunk.js
/en/search → search.chunk.js (compartido)
```

### 3. Prefetching de Links

```typescript
import Link from 'next/link';

// Next.js prefetchea automáticamente en viewport
<Link href="/es/search" prefetch={true}>
  Buscar
</Link>
```

---

## 🐛 Troubleshooting

### Error: `Hydration failed`
**Causa:** HTML del servidor difiere del cliente.

**Solución:**
```typescript
// ❌ Malo: Renderiza Date en servidor y cliente
<div>{new Date().toString()}</div>

// ✅ Bueno: Solo en cliente
'use client';
export function Clock() {
  const [time, setTime] = useState<string>('');
  
  useEffect(() => {
    setTime(new Date().toString());
  }, []);
  
  return <div>{time}</div>;
}
```

### Error: `Module not found: Can't resolve '@/components/...'`
**Causa:** Alias de TypeScript no configurado.

**Solución:** Verificar `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Los estilos de Tailwind no aplican
**Causa:** Archivo fuera de `content` en `tailwind.config.ts`.

**Solución:**
```typescript
// tailwind.config.ts
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',  // Asegúrate de incluir todas las rutas
  ],
  // ...
}
```

### PWA no se instala
**Causa:** PWA está deshabilitado en desarrollo.

**Solución:**
```bash
npm run build
npm run start
```

### Error: `Failed to fetch` en búsqueda
**Causa:** Backend no está corriendo o CORS mal configurado.

**Solución:**
```bash
# Verificar backend
curl http://localhost:3001/health

# Verificar CORS en backend (NestJS)
// main.ts
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

---

## 📚 Recursos Adicionales

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
