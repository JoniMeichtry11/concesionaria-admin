import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-4">Inicio (Lista de Autos)</h1>
      <p class="text-slate-600">Bienvenido al panel de administración. Aquí se mostrará la lista de autos y el buscador principal.</p>
    </div>
  `,
})
export class HomeComponent {}
