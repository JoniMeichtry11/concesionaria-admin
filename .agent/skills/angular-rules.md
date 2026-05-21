# Angular Rules

## Version
Angular 21 — strictly modern patterns only. Never suggest or generate code using deprecated APIs.

## Components
- Always standalone components. Never NgModules.
- Use `imports: []` directly in the component decorator.
- File naming: `feature-name.component.ts`

## State management
- Use Signals for all reactive state: `signal()`, `computed()`, `effect()`.
- Never use `Subject`, `BehaviorSubject`, or `Observable` for local component state.
- Services that expose state must use `signal()` or `computed()`.

## Dependency injection
- Always use `inject()` function. Never constructor injection.

```typescript
// ✅ Correct
export class CarListComponent {
  private carService = inject(CarService);
}

// ❌ Never
export class CarListComponent {
  constructor(private carService: CarService) {}
}
```

## Services
- Always `providedIn: 'root'` unless there is a specific reason not to.
- One service per domain: CarService, AuthService, SettingsService, PhotoService, GeminiService.

## Routing
- Use standalone routing with `provideRouter()` in `app.config.ts`.
- Lazy load every feature route.

```typescript
// ✅ Correct
{
  path: 'cars',
  loadComponent: () => import('./features/cars/car-list.component')
    .then(m => m.CarListComponent)
}
```

## TypeScript
- Strict mode always enabled.
- No `any`. Use `unknown` and narrow the type if needed.
- Define interfaces for all data models in `src/app/core/models/`.
- Use `snake_case` for DB field names in interfaces (matches Supabase).
- Use `camelCase` for component/service properties.

## Styling
- Tailwind CSS only. No custom CSS except for cases where Tailwind cannot cover it.
- Mobile-first: always start with base (mobile) styles, then `md:` and `lg:` breakpoints.
- No inline styles.

## PWA
- Both apps are PWAs configured with `@angular/pwa`.
- Never remove or modify `ngsw-config.json` without explicit instruction.

## File structure
- Features in `src/app/features/[feature-name]/`
- Shared components in `src/app/shared/components/`
- Pipes in `src/app/shared/pipes/`
- Guards in `src/app/core/guards/`
- Models in `src/app/core/models/`
- Services in `src/app/core/services/`

## General rules
- Never generate code with `ngOnInit` lifecycle hook. Use `effect()` or signal-based initialization instead.
- Always handle loading and error states in components.
- Keep components small and focused. Extract logic to services.
