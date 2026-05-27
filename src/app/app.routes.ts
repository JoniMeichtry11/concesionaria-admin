import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'cars/upload',
        loadComponent: () => import('./features/cars/car-upload/car-upload.component').then((m) => m.CarUploadComponent),
      },
      {
        path: 'cars/:id',
        loadComponent: () => import('./features/cars/car-detail/car-detail.component').then((m) => m.CarDetailComponent),
      },
      {
        path: 'cars',
        loadComponent: () => import('./features/cars/cars.component').then((m) => m.CarsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'settings/usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/settings/usuarios/usuarios.component').then((m) => m.SubScreenUsuariosComponent),
      },
      {
        path: 'settings/estadisticas',
        loadComponent: () => import('./features/settings/estadisticas/estadisticas.component').then((m) => m.SubScreenEstadisticasComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

