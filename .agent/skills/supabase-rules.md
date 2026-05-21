# Supabase Rules

## Client setup
- Supabase client is initialized once in `src/app/core/services/supabase.service.ts`.
- All other services inject `SupabaseService` to get the client. Never initialize a new client elsewhere.
- Credentials come from `environment.ts` only. Never hardcode keys.

```typescript
// supabase.service.ts
export class SupabaseService {
  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  get client() {
    return this.supabase;
  }
}
```

## Queries
- Always use the typed Supabase client.
- Always handle the `{ data, error }` destructuring pattern.
- Always check for `error` before using `data`.

```typescript
// ✅ Correct
const { data, error } = await this.supabase.client
  .from('cars')
  .select('*')
  .eq('status', 'disponible');

if (error) throw error;
return data;

// ❌ Never ignore the error
const { data } = await this.supabase.client.from('cars').select('*');
```

## Database tables
- `cars` — main car records
- `car_photos` — photos linked to cars, with `order` field (0 = cover)
- `settings` — single row with concesionaria config
- `user_roles` — extends Supabase auth users with role field

## Field naming
- All DB fields are `snake_case`. Map to `camelCase` in TypeScript interfaces if needed.

## Authentication
- Use `supabase.auth.signInWithPassword()` for login.
- Use `supabase.auth.getSession()` to check current session.
- Use `supabase.auth.onAuthStateChange()` to react to auth changes.
- Store session state in `AuthService` using a `signal()`.

## Row Level Security
- RLS is enabled on all tables. Never disable it.
- Public read access: `cars` (status disponible/reservado), `car_photos`, `settings`.
- Authenticated write access: `cars`, `car_photos`.
- Admin-only write: `settings`, `user_roles`.

## Storage
- Bucket name: `car-photos` (public bucket).
- Upload path pattern: `{car_id}/{timestamp}_{index}.jpg`
- Always compress images to ~400KB before uploading (handled by PhotoService).
- Get public URL with `supabase.storage.from('car-photos').getPublicUrl(path)`.

## Realtime
- Do not use Realtime subscriptions unless explicitly requested.

## Types
- Generate and use Supabase types from the project schema.
- Place generated types in `src/app/core/models/supabase.types.ts`.
