import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-4">Ajustes</h1>
      <p class="text-slate-600">Aquí se administrará la configuración de la concesionaria, el tipo de cambio y las estadísticas.</p>
    </div>
  `,
})
export class SettingsComponent {}
