# SPEC.md — Sistema de Gestión de Concesionarias

## Índice
1. [Visión general](#1-visión-general)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Base de datos — Supabase](#4-base-de-datos--supabase)
5. [Roles y permisos](#5-roles-y-permisos)
6. [Estados de un auto](#6-estados-de-un-auto)
7. [PWA Admin — concesionaria-admin](#7-pwa-admin--concesionaria-admin)
8. [PWA Pública — concesionaria-catalogo](#8-pwa-pública--concesionaria-catalogo)
9. [Integración con Gemini AI](#9-integración-con-gemini-ai)
10. [Manejo de fotos](#10-manejo-de-fotos)
11. [Multimoneda](#11-multimoneda)
12. [WhatsApp](#12-whatsapp)
13. [Convenciones de código](#13-convenciones-de-código)
14. [Estructura de carpetas](#14-estructura-de-carpetas)

---

## 1. Visión general

Sistema compuesto por dos PWAs independientes que comparten la misma base de datos en Supabase. Está orientado a concesionarias de autos que necesitan:

- Un catálogo público donde los compradores naveguen el stock sin intermediarios.
- Una app de gestión interna donde el dueño/vendedor administre el stock, comparta autos por WhatsApp y cambie estados rápidamente desde el celular.

**Problema principal que resuelve:**
El dueño actualmente recibe consultas por WhatsApp y debe armar manualmente la información de cada auto. Con este sistema, el comprador llega ya habiendo visto el catálogo, y el vendedor puede compartir una ficha completa en segundos.

---

## 2. Arquitectura del sistema

```
┌─────────────────────────┐       ┌─────────────────────────┐
│  concesionaria-catalogo │       │   concesionaria-admin   │
│  (PWA pública)          │       │   (PWA admin)           │
│                         │       │                         │
│  Angular 21 standalone  │       │  Angular 21 standalone  │
│  Acceso sin login        │       │  Requiere autenticación │
└────────────┬────────────┘       └────────────┬────────────┘
             │                                 │
             └──────────────┬──────────────────┘
                            │
                   ┌────────▼────────┐
                   │    Supabase     │
                   │                 │
                   │  PostgreSQL DB  │
                   │  Auth + Roles   │
                   │  Storage (fotos)│
                   └─────────────────┘
```

Cada concesionaria tiene su **propio proyecto Supabase** (base de datos, storage y auth separados). El código de las dos PWAs es compartido y se configura por variables de entorno para apuntar al proyecto Supabase del cliente correspondiente.

---

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21 (standalone components) |
| Estilos | Tailwind CSS |
| PWA | @angular/pwa |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage fotos | Supabase Storage |
| IA análisis fotos | Google Gemini Flash (tier gratuito) |
| IA descripción texto | Google Gemini Flash |
| Compresión de fotos | Browser Canvas API (nativo) |
| Lenguaje | TypeScript strict mode |

---

## 4. Base de datos — Supabase

### Tabla: `cars`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | uuid | NO | PK, generado automáticamente |
| `brand` | text | NO | Marca (ej: Toyota) |
| `model` | text | NO | Modelo (ej: Corolla) |
| `year` | integer | NO | Año del auto |
| `color` | text | SI | Color exterior |
| `fuel_type` | text | SI | nafta / diesel / gnc / hibrido / electrico |
| `transmission` | text | SI | manual / automatica |
| `kilometers` | integer | SI | Kilómetros recorridos |
| `price_usd` | numeric | SI | Precio en dólares |
| `price_ars` | numeric | SI | Precio en pesos (opcional) |
| `description` | text | SI | Descripción generada por IA, editable |
| `status` | text | NO | borrador / disponible / reservado / pausado / vendido |
| `created_at` | timestamptz | NO | Fecha de creación |
| `updated_at` | timestamptz | NO | Fecha de última modificación |

### Tabla: `car_photos`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | uuid | NO | PK |
| `car_id` | uuid | NO | FK → cars.id |
| `url` | text | NO | URL pública en Supabase Storage |
| `order` | integer | NO | Orden de visualización (0 = portada) |
| `created_at` | timestamptz | NO | Fecha de subida |

### Tabla: `settings`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | uuid | NO | PK (siempre una sola fila) |
| `concesionaria_name` | text | NO | Nombre visible en el catálogo |
| `logo_url` | text | SI | URL del logo |
| `whatsapp_number` | text | NO | Número en formato internacional (ej: 5491112345678) |
| `currencies` | text[] | NO | Monedas activas (ej: ['USD', 'ARS']) |
| `ars_rate` | numeric | SI | Tipo de cambio manual USD→ARS |

### Tabla: `user_roles`

Supabase Auth maneja la autenticación. Esta tabla extiende el usuario con su rol en la concesionaria.

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | uuid | NO | PK = auth.users.id |
| `role` | text | NO | admin / vendedor |
| `full_name` | text | SI | Nombre visible |
| `created_at` | timestamptz | NO | |

### Row Level Security (RLS)

- `cars`: lectura pública para status = 'disponible' o 'reservado'. Escritura solo para usuarios autenticados.
- `car_photos`: lectura pública. Escritura solo para usuarios autenticados.
- `settings`: lectura pública. Escritura solo para rol `admin`.
- `user_roles`: lectura solo para autenticados. Escritura solo para rol `admin`.

---

## 5. Roles y permisos

| Acción | Admin | Vendedor |
|---|---|---|
| Ver lista de autos | ✅ | ✅ |
| Compartir ficha de auto | ✅ | ✅ |
| Cargar auto nuevo | ✅ | ✅ |
| Editar datos de auto | ✅ | ✅ |
| Cambiar estado de auto | ✅ | ✅ |
| Eliminar auto | ✅ | ❌ |
| Editar precio inline | ✅ | ✅ |
| Ver dashboard | ✅ | ✅ |
| Gestionar usuarios | ✅ | ❌ |
| Editar settings (WhatsApp, nombre, logo) | ✅ | ❌ |
| Configurar tipo de cambio | ✅ | ❌ |

---

## 6. Estados de un auto

```
borrador ──→ disponible ──→ reservado ──→ vendido
                │
                ↓
             pausado (oculto temporalmente, vuelve a disponible)
```

| Estado | Visible en catálogo público | Descripción |
|---|---|---|
| `borrador` | ❌ | En proceso de carga, no publicado |
| `disponible` | ✅ | Visible y disponible para consultas |
| `reservado` | ✅ con badge "Reservado" | Alguien dio una seña, ya no está libre |
| `pausado` | ❌ | Oculto temporalmente (taller, prueba de manejo) |
| `vendido` | ❌ | Vendido, queda en historial interno |

---

## 7. PWA Admin — concesionaria-admin

### Pantallas

#### 7.1 Login
- Email y contraseña via Supabase Auth.
- Sin registro público (solo el admin crea usuarios desde el panel).
- Recordar sesión activado por defecto (importante para uso móvil).

#### 7.2 Dashboard (home)
Métricas de un vistazo:
- Total de autos disponibles
- Total reservados
- Total vendidos este mes
- Acceso rápido a "Cargar auto nuevo"

#### 7.3 Lista de autos
- Listado con foto de portada, marca, modelo, año, precio y badge de estado.
- Filtro rápido por estado (chips horizontales: Todos / Disponibles / Reservados / Pausados / Vendidos).
- Edición de precio inline sin entrar a la ficha.
- Swipe o menú contextual para cambiar estado rápidamente.
- Botón flotante (+) para cargar auto nuevo.
- Buscador por marca o modelo.

#### 7.4 Flujo de carga de auto nuevo (con IA)
Este es el flujo más importante de la app admin.

**Paso 1 — Fotos**
- El usuario saca fotos directamente desde la cámara o selecciona desde la galería.
- Mínimo 1 foto, máximo 15.
- Las fotos se comprimen a ~400KB antes de cualquier procesamiento.
- Puede reordenar las fotos con drag & drop.
- La primera foto es la portada.

**Paso 2 — Análisis con Gemini**
- Se envían las fotos a Gemini Flash con el prompt de análisis (ver sección 9).
- Pantalla de loading con mensaje "Analizando el auto...".
- Gemini devuelve los campos que pudo detectar y una descripción generada.

**Paso 3 — Cuestionario adaptativo**
- Se muestran solo las preguntas para los campos que Gemini NO pudo detectar con certeza.
- **Una sola pregunta por pantalla**, con opciones tipo chips cuando aplica.
- Orden de preguntas:
  1. Marca (texto libre con autocompletado)
  2. Modelo (texto libre)
  3. Año (selector numérico)
  4. Kilómetros (teclado numérico)
  5. Precio (con selector de moneda: USD / ARS / ambos)
  6. Combustible (chips: Nafta / Diesel / GNC / Híbrido / Eléctrico)
  7. Transmisión (chips: Manual / Automática)
  8. Color (texto libre o color picker básico)
- Si Gemini ya detectó un campo, se muestra pre-completado y el usuario puede confirmarlo o editarlo con un tap.

**Paso 4 — Revisión y descripción**
- Resumen de todos los datos cargados.
- Descripción generada por Gemini, editable.
- Botones: "Guardar como borrador" o "Publicar ahora".

#### 7.5 Ficha de auto (vista admin)
- Galería de fotos con reordenamiento.
- Todos los datos con edición inline.
- Selector de estado destacado.
- Botón "Compartir" que genera el link de la ficha pública lista para pegar en WhatsApp.
- Botón "Eliminar" (solo admin).

#### 7.6 Compartir auto
No es una pantalla separada. Es una acción desde la lista o desde la ficha:
- Genera el texto: `"Hola! Te comparto este [Marca] [Modelo] [Año]: [URL pública del auto]"`
- Abre el share nativo del sistema operativo (Web Share API).
- Fallback: copia el texto al clipboard.

#### 7.7 Ajustes (solo admin)
- Nombre de la concesionaria
- Logo
- Número de WhatsApp
- Monedas activas (USD / ARS / ambas)
- Tipo de cambio manual (con fecha de última actualización)
- Gestión de usuarios (invitar vendedor, cambiar rol, eliminar)

---

## 8. PWA Pública — concesionaria-catalogo

### Pantallas

#### 8.1 Catálogo (home)
- Header con logo y nombre de la concesionaria.
- Filtros:
  - Rango de precio (slider dual)
  - Marca (dropdown o chips)
  - Año (desde / hasta)
  - Combustible (chips)
  - Transmisión (chips)
- Grilla de autos (2 columnas en mobile, 3-4 en desktop).
- Cada card: foto de portada, marca + modelo, año, km, precio.
- Badge "Reservado" sobre la foto si corresponde.
- Solo se muestran autos con status `disponible` o `reservado`.

#### 8.2 Ficha de auto
- Galería de fotos con swipe (en mobile).
- Datos completos: marca, modelo, año, km, color, combustible, transmisión.
- Precio en la/s moneda/s activa/s.
- Descripción.
- Botón fijo al pie: "Consultar por WhatsApp" → abre `https://wa.me/[numero]?text=Hola, me interesa el [Marca] [Modelo] [Año]. ¿Está disponible?`

---

## 9. Integración con Gemini AI

### Modelo
`gemini-1.5-flash` (tier gratuito de Google AI Studio)

### Prompt de análisis de fotos

```
Eres un asistente especializado en identificar autos. 
Analiza las imágenes proporcionadas de un vehículo y extrae la siguiente información. 
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con esta estructura exacta:

{
  "brand": "string o null",
  "model": "string o null",
  "year": number o null,
  "color": "string o null",
  "fuel_type": "nafta|diesel|gnc|hibrido|electrico o null",
  "transmission": "manual|automatica o null",
  "confidence": {
    "brand": "high|medium|low",
    "model": "high|medium|low",
    "year": "high|medium|low",
    "color": "high|medium|low",
    "fuel_type": "high|medium|low",
    "transmission": "high|medium|low"
  },
  "description": "string con descripción comercial del auto en español, 2-3 oraciones"
}

Si no puedes determinar un campo con certeza, devuelve null para ese campo.
```

### Lógica del cuestionario adaptativo
- Si `confidence` es `high` → campo pre-completado, el usuario solo confirma.
- Si `confidence` es `medium` → campo pre-completado pero resaltado para revisión.
- Si `confidence` es `low` o el valor es `null` → se hace la pregunta en el cuestionario.

---

## 10. Manejo de fotos

### Compresión antes de subir
Toda foto se comprime en el browser usando Canvas API antes de enviarse a Supabase o a Gemini.

- **Target:** ~400KB por foto
- **Calidad JPEG:** 0.8
- **Dimensiones máximas:** 1280px en el lado más largo (mantiene aspect ratio)

```typescript
// Lógica de compresión (referencia)
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const MAX = 1280;
  const ratio = Math.min(MAX / bitmap.width, MAX / bitmap.height, 1);
  canvas.width = bitmap.width * ratio;
  canvas.height = bitmap.height * ratio;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise(resolve => canvas.toBlob(resolve as any, 'image/jpeg', 0.8));
}
```

### Almacenamiento en Supabase Storage
- Bucket: `car-photos` (público)
- Path: `{car_id}/{timestamp}_{index}.jpg`
- Cada auto puede tener entre 1 y 15 fotos.

---

## 11. Multimoneda

### Configuración
En `settings`, el admin puede activar:
- Solo USD
- Solo ARS
- Ambas (se muestra el precio en las dos monedas)

El tipo de cambio USD→ARS es manual: el admin lo actualiza cuando quiere. Se muestra junto al precio en ARS la fecha de última actualización del tipo de cambio.

### Visualización en el catálogo
```
USD 18.500
ARS 18.982.500 (al 21/05/2026)
```

### Carga de precios (admin)
Si ambas monedas están activas:
- El admin ingresa el precio en USD.
- El sistema calcula automáticamente el ARS usando el tipo de cambio guardado.
- El admin puede sobrescribir el ARS manualmente.

---

## 12. WhatsApp

### Número
Un solo número por concesionaria, configurado en `settings.whatsapp_number`.
Formato internacional sin espacios ni símbolos: `5491112345678`

### Botón en catálogo público
URL generada dinámicamente por cada ficha de auto:
```
https://wa.me/{whatsapp_number}?text=Hola, me interesa el {brand} {model} {year}. ¿Está disponible?
```

### Compartir desde admin
Texto generado para compartir la ficha:
```
Hola! Te comparto este {brand} {model} {year}: {URL_PUBLICA_DEL_AUTO}
```
Se usa la **Web Share API** con fallback a clipboard.

---

## 13. Convenciones de código

- **Angular 21 standalone components** — sin NgModules.
- **Signals** para estado local y reactivo (no usar Subject/BehaviorSubject).
- **inject()** en lugar de constructor injection.
- **Servicios con `providedIn: 'root'`** salvo casos específicos.
- **Tailwind CSS** para todos los estilos — no CSS personalizado salvo casos excepcionales.
- **TypeScript strict mode** activado.
- **snake_case** para nombres de campos en DB (consistente con Supabase).
- **camelCase** en TypeScript.
- Interfaces de modelos en `src/app/core/models/`.
- Un servicio por dominio: `CarService`, `AuthService`, `SettingsService`, `PhotoService`, `GeminiService`.

---

## 14. Estructura de carpetas

### concesionaria-admin

```
src/
└── app/
    ├── core/
    │   ├── models/
    │   │   ├── car.model.ts
    │   │   ├── car-photo.model.ts
    │   │   ├── settings.model.ts
    │   │   └── user-role.model.ts
    │   ├── services/
    │   │   ├── auth.service.ts
    │   │   ├── car.service.ts
    │   │   ├── photo.service.ts
    │   │   ├── gemini.service.ts
    │   │   └── settings.service.ts
    │   └── guards/
    │       ├── auth.guard.ts
    │       └── admin.guard.ts
    ├── features/
    │   ├── auth/
    │   │   └── login/
    │   ├── dashboard/
    │   ├── cars/
    │   │   ├── car-list/
    │   │   ├── car-detail/
    │   │   └── car-upload/
    │   │       ├── step-photos/
    │   │       ├── step-ai-loading/
    │   │       ├── step-questionnaire/
    │   │       └── step-review/
    │   └── settings/
    └── shared/
        ├── components/
        │   ├── car-card/
        │   ├── status-badge/
        │   └── photo-gallery/
        └── pipes/
            ├── currency-display.pipe.ts
            └── car-status-label.pipe.ts
```

### concesionaria-catalogo

```
src/
└── app/
    ├── core/
    │   ├── models/          (mismos modelos compartibles)
    │   └── services/
    │       ├── car.service.ts
    │       └── settings.service.ts
    ├── features/
    │   ├── catalog/
    │   │   ├── catalog-home/
    │   │   └── catalog-filters/
    │   └── car-detail/
    └── shared/
        ├── components/
        │   ├── car-card/
        │   └── whatsapp-button/
        └── pipes/
            └── currency-display.pipe.ts
```

---

## Variables de entorno

Cada proyecto usa un archivo `environment.ts` con:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'eyJ...',
  geminiApiKey: 'AIza...',
};
```

En producción se usan las variables de entorno del hosting correspondiente.

---

*Última actualización: Mayo 2026*
*Versión: 1.0 — Demo inicial*
