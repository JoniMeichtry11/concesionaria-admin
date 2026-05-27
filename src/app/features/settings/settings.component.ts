import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 pb-24">
      <!-- Header -->
      <header class="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
        <h1 class="text-xl font-bold text-slate-800">Ajustes</h1>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
          {{ isAdmin() ? 'Administrador' : 'Vendedor' }}
        </span>
      </header>

      <!-- Main Container -->
      <div class="max-w-md mx-auto p-4 flex flex-col gap-6">
        <!-- Error & Success Messages -->
        <div *ngIf="error()" class="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-sm text-red-700">
          {{ error() }}
        </div>
        <div *ngIf="success()" class="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl text-sm text-emerald-700">
          {{ success() }}
        </div>

        <!-- Carga inicial -->
        <div *ngIf="settingsService.isLoading() && !settingsService.settings()" class="flex flex-col items-center justify-center py-12">
          <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-slate-500 mt-3">Cargando ajustes...</p>
        </div>

        <ng-container *ngIf="settingsService.settings() as settings">
          <!-- Sección Concesionaria -->
          <section class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Concesionaria</h2>
            
            <div class="flex flex-col gap-5">
              <!-- Logo Upload with Preview -->
              <div class="flex items-center gap-4">
                <div class="relative w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  <img *ngIf="settings.logo_url" [src]="settings.logo_url" alt="Logo" class="w-full h-full object-cover" />
                  <span *ngIf="!settings.logo_url" class="text-slate-400 text-2xl font-bold">
                    {{ settings.concesionaria_name.slice(0,1).toUpperCase() }}
                  </span>
                  <!-- Upload Overlay spinner -->
                  <div *ngIf="logoUploading()" class="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                
                <div class="flex-1" *ngIf="isAdmin()">
                  <label class="block text-sm font-medium text-slate-700 mb-1">Logo de la empresa</label>
                  <label class="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition-all">
                    <span>Elegir imagen</span>
                    <input type="file" accept="image/*" class="hidden" (change)="onLogoSelected($event)" [disabled]="logoUploading()" />
                  </label>
                  <p class="text-[10px] text-slate-400 mt-1">Se comprimirá automáticamente</p>
                </div>
              </div>

              <!-- Nombre Concesionaria -->
              <div class="border-t border-slate-100 pt-4">
                <label class="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                <div class="flex items-center justify-between min-h-[44px]">
                  <div *ngIf="!isEditingName()" class="text-slate-800 font-medium">
                    {{ settings.concesionaria_name }}
                  </div>
                  
                  <div *ngIf="isEditingName() && isAdmin()" class="flex-1 flex gap-2">
                    <input type="text" [(ngModel)]="nameInput" class="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-indigo-600" />
                    <button (click)="saveName()" class="px-3 h-10 bg-indigo-600 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all">Guardar</button>
                    <button (click)="isEditingName.set(false)" class="px-3 h-10 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold active:scale-95 transition-all">Cancelar</button>
                  </div>

                  <button *ngIf="!isEditingName() && isAdmin()" (click)="startEditName(settings.concesionaria_name)" class="text-indigo-600 text-xs font-semibold hover:underline">
                    Editar
                  </button>
                </div>
              </div>

              <!-- WhatsApp -->
              <div class="border-t border-slate-100 pt-4">
                <label class="block text-xs font-medium text-slate-400 mb-1">Número de WhatsApp (internacional)</label>
                <div class="flex items-center justify-between min-h-[44px]">
                  <div *ngIf="!isEditingWhatsapp()" class="text-slate-800 font-medium">
                    {{ settings.whatsapp_number || 'No configurado' }}
                  </div>
                  
                  <div *ngIf="isEditingWhatsapp() && isAdmin()" class="flex-1 flex gap-2">
                    <input type="tel" [(ngModel)]="whatsappInput" placeholder="5491112345678" class="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-indigo-600" />
                    <button (click)="saveWhatsapp()" class="px-3 h-10 bg-indigo-600 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all">Guardar</button>
                    <button (click)="isEditingWhatsapp.set(false)" class="px-3 h-10 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold active:scale-95 transition-all">Cancelar</button>
                  </div>

                  <button *ngIf="!isEditingWhatsapp() && isAdmin()" (click)="startEditWhatsapp(settings.whatsapp_number)" class="text-indigo-600 text-xs font-semibold hover:underline">
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Sección Monedas y precios -->
          <section class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Monedas y precios</h2>
            
            <div class="flex flex-col gap-4">
              <!-- Toggles de monedas -->
              <div class="flex items-center justify-between py-2">
                <div>
                  <h3 class="text-sm font-semibold text-slate-800">Activar Dólares (USD)</h3>
                  <p class="text-xs text-slate-400">Mostrar precios en USD</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [checked]="isUsdActive()" (change)="toggleCurrency('USD')" [disabled]="!isAdmin()" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div class="flex items-center justify-between py-2 border-t border-slate-100">
                <div>
                  <h3 class="text-sm font-semibold text-slate-800">Activar Pesos (ARS)</h3>
                  <p class="text-xs text-slate-400">Mostrar precios en ARS</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [checked]="isArsActive()" (change)="toggleCurrency('ARS')" [disabled]="!isAdmin()" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <!-- Tipo de Cambio -->
              <div class="border-t border-slate-100 pt-4" *ngIf="isArsActive()">
                <label class="block text-xs font-semibold text-slate-500 mb-1">Tipo de cambio (USD → ARS)</label>
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <span class="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                    <input type="number" [(ngModel)]="rateInput" [disabled]="!isAdmin()" class="w-full h-10 pl-7 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-indigo-600 disabled:bg-slate-50" />
                  </div>
                  <button *ngIf="isAdmin()" (click)="updateRate()" class="px-4 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all">
                    Actualizar
                  </button>
                </div>
                <p class="text-[10px] text-slate-400 mt-1.5" *ngIf="settings.ars_rate_updated_at">
                  Última actualización: {{ settings.ars_rate_updated_at | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
            </div>
          </section>

          <!-- Sección Cuenta -->
          <section class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Cuenta</h2>
            
            <div class="flex flex-col">
              <!-- Navegar a Gestión de Usuarios (sólo admin) -->
              <a *ngIf="isAdmin()" routerLink="/settings/usuarios" class="flex items-center justify-between py-4 border-b border-slate-100 hover:bg-slate-50/50 -mx-5 px-5 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-medium text-slate-800">Gestionar Vendedores</h3>
                    <p class="text-xs text-slate-400">Invitar y administrar permisos</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>

              <!-- Navegar a Estadísticas -->
              <a routerLink="/settings/estadisticas" class="flex items-center justify-between py-4 border-b border-slate-100 hover:bg-slate-50/50 -mx-5 px-5 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-medium text-slate-800">Estadísticas de Stock</h3>
                    <p class="text-xs text-slate-400">Visualizar ventas y disponibilidad</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>

              <!-- Cerrar Sesión -->
              <button (click)="showLogoutConfirm.set(true)" class="flex items-center justify-between py-4 hover:bg-slate-50/50 -mx-5 px-5 text-left w-[calc(100%+40px)] transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-medium text-red-600">Cerrar sesión</h3>
                    <p class="text-xs text-slate-400">Desvincular este dispositivo</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </section>
        </ng-container>
      </div>

      <!-- Bottom Confirmation Sheet (Cerrar sesión) -->
      <div *ngIf="showLogoutConfirm()" class="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-end justify-center z-50 transition-opacity duration-300" (click)="showLogoutConfirm.set(false)">
        <div class="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl animate-slide-up" (click)="$event.stopPropagation()">
          <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5"></div>
          <h3 class="text-lg font-bold text-slate-800 text-center mb-2">¿Seguro que querés salir?</h3>
          <p class="text-sm text-slate-500 text-center mb-6 px-4">Vas a tener que volver a ingresar con tu email y contraseña si cerrás tu sesión.</p>
          
          <div class="flex flex-col gap-3">
            <button (click)="logout()" class="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl active:scale-95 transition-all">
              Cerrar sesión
            </button>
            <button (click)="showLogoutConfirm.set(false)" class="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl active:scale-95 transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class SettingsComponent {
  settingsService = inject(SettingsService);
  authService = inject(AuthService);
  private router = inject(Router);

  // signals locales
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  logoUploading = signal(false);
  showLogoutConfirm = signal(false);

  // signals para edición inline
  isEditingName = signal(false);
  nameInput = '';

  isEditingWhatsapp = signal(false);
  whatsappInput = '';

  // input del tipo de cambio
  rateInput = 0;

  isAdmin = computed(() => this.authService.userRole() === 'admin');

  isUsdActive = computed(() => this.settingsService.settings()?.currencies.includes('USD') ?? false);
  isArsActive = computed(() => this.settingsService.settings()?.currencies.includes('ARS') ?? false);

  constructor() {
    this.settingsService.loadSettings().then((s) => {
      if (s) {
        this.rateInput = s.ars_rate ?? 0;
      }
    });

    // Mantener rateInput actualizado ante cambios externos de settings
    effect(() => {
      const s = this.settingsService.settings();
      if (s) {
        this.rateInput = s.ars_rate ?? 0;
      }
    });
  }

  // Editar Nombre
  startEditName(currentName: string) {
    this.nameInput = currentName;
    this.isEditingName.set(true);
  }

  async saveName() {
    const value = this.nameInput.trim();
    if (!value) {
      this.error.set('El nombre de la concesionaria no puede estar vacío.');
      return;
    }

    try {
      this.error.set(null);
      await this.settingsService.updateSettings({ concesionaria_name: value });
      this.isEditingName.set(false);
      this.success.set('Nombre actualizado correctamente.');
      setTimeout(() => this.success.set(null), 3000);
    } catch (err: any) {
      this.error.set(err.message || 'Error al guardar el nombre.');
    }
  }

  // Editar WhatsApp
  startEditWhatsapp(currentNum: string) {
    this.whatsappInput = currentNum;
    this.isEditingWhatsapp.set(true);
  }

  async saveWhatsapp() {
    const value = this.whatsappInput.trim();
    if (value && !/^\d+$/.test(value)) {
      this.error.set('Formato inválido. Usá solo números sin espacios ni símbolos (ej: 5491112345678).');
      return;
    }

    try {
      this.error.set(null);
      await this.settingsService.updateSettings({ whatsapp_number: value });
      this.isEditingWhatsapp.set(false);
      this.success.set('WhatsApp actualizado correctamente.');
      setTimeout(() => this.success.set(null), 3000);
    } catch (err: any) {
      this.error.set(err.message || 'Error al guardar el WhatsApp.');
    }
  }

  // Subir Logo
  async onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      try {
        this.error.set(null);
        this.logoUploading.set(true);
        await this.settingsService.uploadLogo(file);
        this.success.set('Logo subido e integrado con éxito.');
        setTimeout(() => this.success.set(null), 3000);
      } catch (err: any) {
        this.error.set(err.message || 'Error al subir el logo.');
      } finally {
        this.logoUploading.set(false);
      }
    }
  }

  // Toggles de monedas
  async toggleCurrency(currency: 'USD' | 'ARS') {
    if (!this.isAdmin()) return;
    
    const settings = this.settingsService.settings();
    if (!settings) return;

    const list = [...settings.currencies];
    const index = list.indexOf(currency);

    if (index > -1) {
      // Intentando remover moneda
      if (list.length <= 1) {
        this.error.set('Al menos una moneda debe estar activa siempre.');
        setTimeout(() => this.error.set(null), 4000);
        return;
      }
      list.splice(index, 1);
    } else {
      // Agregar moneda
      list.push(currency);
    }

    try {
      this.error.set(null);
      await this.settingsService.updateSettings({ currencies: list });
    } catch (err: any) {
      this.error.set(err.message || 'Error al actualizar monedas.');
    }
  }

  // Actualizar tipo de cambio
  async updateRate() {
    if (this.rateInput <= 0) {
      this.error.set('El tipo de cambio debe ser un número mayor a cero.');
      return;
    }

    try {
      this.error.set(null);
      await this.settingsService.updateSettings({
        ars_rate: this.rateInput,
        ars_rate_updated_at: new Date().toISOString()
      });
      this.success.set('Tipo de cambio actualizado.');
      setTimeout(() => this.success.set(null), 3000);
    } catch (err: any) {
      this.error.set(err.message || 'Error al actualizar el tipo de cambio.');
    }
  }

  // Cerrar Sesión
  async logout() {
    this.showLogoutConfirm.set(false);
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (err: any) {
      this.error.set('Error al cerrar sesión. Intentá de nuevo.');
    }
  }
}
