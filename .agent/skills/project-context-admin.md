# Project Context — concesionaria-admin

## What this app is
PWA for the car dealership owner and sellers. Requires authentication.
Used primarily on mobile, in a fast-paced environment.

## What it solves
The owner receives constant WhatsApp queries about cars and wastes time manually gathering photos and info. This app lets sellers manage stock and share car listings instantly.

## Users
- **Admin (owner):** full access including settings, user management, delete cars.
- **Vendedor (seller):** can upload, edit, change status, and share cars. Cannot delete or manage users.

## Core features
1. **Dashboard** — stock summary: available, reserved, sold this month.
2. **Car list** — filterable by status, inline price edit, quick status change.
3. **Upload car with AI** — photo → Gemini analysis → adaptive questionnaire → publish.
4. **Share car** — generates a WhatsApp-ready message with the public listing URL.
5. **Settings** — WhatsApp number, currencies, exchange rate, user management.

## Car statuses
`borrador` → `disponible` → `reservado` → `vendido`
`disponible` can also go to `pausado` (temporarily hidden) and back.

## AI flow (critical feature)
1. User takes photos (compressed to ~400KB via PhotoService before any upload).
2. Photos sent to Gemini Flash for analysis.
3. Gemini returns pre-filled fields + generated description (JSON format).
4. Adaptive questionnaire shows ONE question at a time, only for fields Gemini couldn't detect with high confidence.
5. User reviews and publishes.

## Currencies
Supports USD, ARS, or both. Manual exchange rate set by admin in settings.
ARS price = price_usd × ars_rate (auto-calculated, manually overridable).

## Sharing
Uses Web Share API with clipboard fallback.
Message format: `"Hola! Te comparto este {brand} {model} {year}: {PUBLIC_URL}"`
Public URL points to the car detail page in `concesionaria-catalogo`.

## Related project
`concesionaria-catalogo` is the public-facing PWA. Both share the same Supabase project.
