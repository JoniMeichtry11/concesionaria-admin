import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-slate-200 py-2 px-6 shadow-lg max-w-screen-sm mx-auto flex justify-between items-center pb-[safe-area-inset-bottom]">
      
      <!-- Inicio -->
      <button 
        (click)="navigate('inicio')" 
        [class]="'flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] active:scale-95 transition-all ' + 
          (activeTab() === 'inicio' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-indigo-500')"
        aria-label="Ir a Inicio">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
        <span class="text-[10px] tracking-tight">Inicio</span>
      </button>

      <!-- Buscar -->
      <button 
        (click)="navigate('buscar')" 
        [class]="'flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] active:scale-95 transition-all ' + 
          (activeTab() === 'buscar' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-indigo-500')"
        aria-label="Buscar autos">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <span class="text-[10px] tracking-tight">Buscar</span>
      </button>

      <!-- Agregar -->
      <button 
        (click)="navigate('agregar')" 
        class="flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] text-slate-500 hover:text-indigo-500 active:scale-95 transition-all"
        aria-label="Agregar auto nuevo">
        <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 active:bg-indigo-700 active:scale-90 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <span class="text-[10px] tracking-tight">Agregar</span>
      </button>

      <!-- Ajustes -->
      <button 
        (click)="navigate('ajustes')" 
        [class]="'flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] active:scale-95 transition-all ' + 
          (activeTab() === 'ajustes' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-indigo-500')"
        aria-label="Ajustes">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        <span class="text-[10px] tracking-tight">Ajustes</span>
      </button>

    </nav>
  `,
})
export class BottomNavComponent {
  private router = inject(Router);

  // Escuchar la ruta activa
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** Computa la pestaña activa según la URL actual */
  readonly activeTab = computed<'inicio' | 'buscar' | 'agregar' | 'ajustes' | null>(() => {
    const url = this.currentUrl();
    if (!url) return 'inicio';
    if (url === '/' || url.startsWith('/?')) {
      // Si la URL contiene focusSearch, se resalta 'buscar'
      return url.includes('focusSearch=true') ? 'buscar' : 'inicio';
    }
    if (url.startsWith('/settings')) {
      return 'ajustes';
    }
    if (url.startsWith('/cars') && !url.includes('/upload')) {
      return 'inicio'; // Los sub-detalles pertenecen a la sección de inicio
    }
    return null;
  });

  /** Ejecuta la navegación correspondiente */
  navigate(tab: 'inicio' | 'buscar' | 'agregar' | 'ajustes'): void {
    switch (tab) {
      case 'inicio':
        this.router.navigate(['/']);
        break;
      case 'buscar':
        const current = this.router.url;
        if (current === '/' || current.startsWith('/?')) {
          // Si ya estamos en el home, buscamos el input y le damos foco
          const input = document.getElementById('search-input');
          if (input) {
            input.focus();
          }
        } else {
          // Si estamos en otra pantalla, navegamos a home con query parameter de foco
          this.router.navigate(['/'], { queryParams: { focusSearch: 'true' } });
        }
        break;
      case 'agregar':
        this.router.navigate(['/cars/upload']);
        break;
      case 'ajustes':
        this.router.navigate(['/settings']);
        break;
    }
  }
}
