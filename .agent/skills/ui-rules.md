# UI Rules

## Design philosophy
Both apps are used primarily on mobile. Every screen must be designed mobile-first.
The admin app is used by someone distracted and in a hurry — interactions must be fast and require minimal taps.
The public catalog is used by buyers browsing — it must feel clean, fast, and trustworthy.

## Tailwind usage
- Mobile-first always: base classes for mobile, `md:` for tablet, `lg:` for desktop.
- Never use arbitrary values like `w-[327px]` unless absolutely unavoidable.
- Prefer spacing scale: `p-4`, `gap-3`, `mt-6`, etc.
- Use `text-sm`, `text-base`, `text-lg` for typography scale.

## Layout
- Max content width: `max-w-screen-sm` on mobile-focused screens, `max-w-screen-lg` on desktop views.
- Always center content with `mx-auto` on wider screens.
- Use `min-h-screen` and `flex flex-col` on page-level components.

## Touch targets
- Every tappable element must be at least 44x44px.
- Use `min-h-[44px] min-w-[44px]` on buttons and interactive elements.
- Add `active:scale-95 transition-transform` for tap feedback on buttons.

## Loading states
- Every async action must show a loading state.
- Use a spinner or skeleton, never leave the UI frozen.
- Disable buttons while loading to prevent double submissions.

```html
<!-- ✅ Correct button pattern -->
<button
  [disabled]="isLoading()"
  class="btn-primary active:scale-95 transition-transform disabled:opacity-50">
  {{ isLoading() ? 'Guardando...' : 'Guardar' }}
</button>
```

## Error states
- Always show a user-friendly error message when something fails.
- Never show raw error objects or technical messages to the user.
- Use a toast or inline message depending on context.

## Status badges (admin app)
Color coding for car status badges:
- `disponible` → green: `bg-green-100 text-green-800`
- `reservado` → yellow: `bg-yellow-100 text-yellow-800`
- `pausado` → gray: `bg-gray-100 text-gray-700`
- `borrador` → blue: `bg-blue-100 text-blue-800`
- `vendido` → red: `bg-red-100 text-red-800`

## Forms and inputs
- All inputs must have visible labels.
- Use large touch-friendly inputs: `h-12 px-4 text-base rounded-xl`.
- Show validation errors below the input in `text-sm text-red-500`.
- Never use placeholder as the only label.

## Images
- Always use `object-cover` for car photos to maintain aspect ratio.
- Car cards: use `aspect-[4/3]` for the photo container.
- Always provide a fallback UI for missing images (gray background + car icon).

## Navigation (admin app)
- Bottom navigation bar for mobile (max 4 items).
- Items: Inicio / Autos / Agregar / Ajustes.
- Active item highlighted with primary color.

## Colors
Define a consistent palette using Tailwind config. Primary color: use `indigo` as base.
- Primary action buttons: `bg-indigo-600 text-white hover:bg-indigo-700`
- Secondary buttons: `bg-white text-indigo-600 border border-indigo-600`
- Destructive actions: `bg-red-600 text-white`

## Transitions
- Use `transition-all duration-200` for smooth UI changes.
- Use `transition-transform duration-150 active:scale-95` for button feedback.

## Language
- All UI text in Spanish (Argentina).
- Use informal "vos" address where needed.
- Labels, buttons, messages, and errors all in Spanish.
