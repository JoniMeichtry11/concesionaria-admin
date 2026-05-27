import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarService } from '../../../core/services/car.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-subscreen-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 pb-24">
      <!-- Header -->
      <header class="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 z-10">
        <a routerLink="/settings" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div>
          <h1 class="text-xl font-bold text-slate-800">Estadísticas</h1>
          <p class="text-xs text-slate-500">Estado de stock y ventas realizadas</p>
        </div>
      </header>

      <!-- Main Container -->
      <div class="max-w-md mx-auto p-4 flex flex-col gap-5">
        
        <!-- Period Selector -->
        <div class="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex">
          <button (click)="selectedPeriod.set('mayo')" 
                  [class]="selectedPeriod() === 'mayo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'"
                  class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all active:scale-95">
            Mayo
          </button>
          <button (click)="selectedPeriod.set('abril')" 
                  [class]="selectedPeriod() === 'abril' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'"
                  class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all active:scale-95">
            Abril
          </button>
          <button (click)="selectedPeriod.set('total')" 
                  [class]="selectedPeriod() === 'total' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'"
                  class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all active:scale-95">
            Total
          </button>
        </div>

        <!-- Loader -->
        <div *ngIf="carService.isLoading()" class="flex flex-col items-center justify-center py-12">
          <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-slate-500 mt-3">Calculando estadísticas...</p>
        </div>

        <ng-container *ngIf="!carService.isLoading()">
          <!-- 2x2 Grid -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Disponibles -->
            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-400 uppercase">Disponibles</span>
                <span class="p-1.5 rounded-lg bg-green-50 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <span class="text-3xl font-extrabold text-slate-800">{{ stats().disponibles }}</span>
            </div>

            <!-- Reservados -->
            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-400 uppercase">Reservados</span>
                <span class="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <span class="text-3xl font-extrabold text-slate-800">{{ stats().reservados }}</span>
            </div>

            <!-- Vendidos -->
            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-400 uppercase">Vendidos</span>
                <span class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <span class="text-3xl font-extrabold text-slate-800">{{ stats().vendidos }}</span>
            </div>

            <!-- Borradores -->
            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-400 uppercase">Borradores</span>
                <span class="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
              </div>
              <span class="text-3xl font-extrabold text-slate-800">{{ stats().borradores }}</span>
            </div>
          </div>

          <!-- Ventas del Período -->
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 class="text-sm font-semibold text-slate-800 mb-4 flex items-center justify-between">
              <span>Ventas del período</span>
              <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {{ recentSales().length }} {{ recentSales().length === 1 ? 'auto' : 'autos' }}
              </span>
            </h2>

            <div class="flex flex-col gap-4" *ngIf="recentSales().length > 0">
              <div *ngFor="let sale of recentSales()" class="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0 last:pb-0 first:pt-0">
                <div>
                  <h3 class="text-sm font-semibold text-slate-800">
                    {{ sale.brand }} {{ sale.model }}
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Año {{ sale.year }} • Vendido el {{ getFormattedDate(sale.updated_at || sale.created_at) }}
                  </p>
                </div>

                <div class="text-right">
                  <div class="text-sm font-bold text-slate-800" *ngIf="sale.price_usd">
                    USD {{ sale.price_usd | number:'1.0-0' }}
                  </div>
                  <div class="text-xs text-slate-500 font-medium" *ngIf="sale.price_ars">
                    ARS {{ sale.price_ars | number:'1.0-0' }}
                  </div>
                  <div class="text-xs text-slate-400 italic" *ngIf="!sale.price_usd && !sale.price_ars">
                    Precio no cargado
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div class="text-center py-10 animate-fade-in" *ngIf="recentSales().length === 0">
              <div class="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-sm text-slate-500 font-semibold leading-relaxed">Sin ventas este período.</p>
            </div>
          </div>
        </ng-container>

      </div>
    </div>
  `
})
export class SubScreenEstadisticasComponent {
  carService = inject(CarService);
  settingsService = inject(SettingsService);

  readonly selectedPeriod = signal<'mayo' | 'abril' | 'total'>('mayo');

  constructor() {
    this.carService.getCars();
    this.settingsService.loadSettings();
  }

  isCarInPeriod(car: any, period: 'mayo' | 'abril' | 'total'): boolean {
    if (period === 'total') return true;
    
    // Si el auto es vendido, tomamos updated_at como fecha de venta
    const dateStr = car.status === 'vendido' ? (car.updated_at || car.created_at) : car.created_at;
    if (!dateStr) return false;

    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 = Ene, 3 = Abr, 4 = May

    if (year !== 2026) return false;

    if (period === 'mayo') {
      return month === 4;
    } else if (period === 'abril') {
      return month === 3;
    }
    return false;
  }

  readonly periodCars = computed(() => {
    const period = this.selectedPeriod();
    const allCars = this.carService.cars();
    return allCars.filter(car => this.isCarInPeriod(car, period));
  });

  readonly stats = computed(() => {
    const cars = this.periodCars();
    return {
      disponibles: cars.filter(c => c.status === 'disponible').length,
      reservados: cars.filter(c => c.status === 'reservado').length,
      vendidos: cars.filter(c => c.status === 'vendido').length,
      borradores: cars.filter(c => c.status === 'borrador').length,
    };
  });

  readonly recentSales = computed(() => {
    const cars = this.periodCars();
    return cars
      .filter(c => c.status === 'vendido')
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.created_at).getTime();
        return dateB - dateA;
      });
  });

  getFormattedDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const month = months[date.getMonth()];
    return `${day} de ${month}`;
  }
}
