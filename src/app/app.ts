import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { trigger, transition, style, query, animate } from '@angular/animations';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, BottomNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            opacity: 0,
          })
        ], { optional: true }),
        query(':enter', [
          style({ opacity: 0 })
        ], { optional: true }),
        query(':leave', [
          animate('150ms ease-in-out', style({ opacity: 0 }))
        ], { optional: true }),
        query(':enter', [
          animate('150ms ease-in-out', style({ opacity: 1 }))
        ], { optional: true }),
      ])
    ])
  ]
})
export class App {
  private router = inject(Router);
  protected toastService = inject(ToastService);

  // Escuchar la ruta activa
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** Determina la visibilidad de la navegación inferior */
  readonly showBottomNav = computed(() => {
    const url = this.currentUrl();
    if (!url) return false;
    
    // Ocultar en Login y Biometría
    if (url.startsWith('/login')) return false;
    
    // Ocultar en el flujo de Carga de Auto
    if (url.startsWith('/cars/upload')) return false;
    
    return true;
  });

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.isActivated ? outlet.activatedRoute : '';
  }
}

