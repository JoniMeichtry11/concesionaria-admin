import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que el AuthService termine de restaurar la sesión
  await authService.initialized;

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir a la pantalla de login
  return router.createUrlTree(['/login']);
};
