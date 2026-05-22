import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-4">Gestión de Autos</h1>
      <p class="text-slate-600">Aquí se administrará el catálogo de autos en detalle.</p>
    </div>
  `,
})
export class CarsComponent {}
