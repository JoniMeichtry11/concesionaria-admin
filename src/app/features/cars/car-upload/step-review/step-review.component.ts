import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Car, CarStatus } from '../../../../core/models/car.model';
import { CarService } from '../../../../core/services/car.service';

@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-6 animate-fade-in">
      
      <!-- Loading Overlay -->
      @if (isLoading()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white px-6">
          <div class="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin shadow-md mb-6"></div>
          <h3 class="text-xl font-black tracking-tight animate-pulse">{{ loadingText() }}</h3>
          <p class="text-xs text-slate-300 mt-2 font-medium">Por favor, no cierres la aplicación ni salgas de esta pantalla.</p>
        </div>
      }

      <!-- Título de sección -->
      <div>
        <h2 class="text-xl font-black text-slate-800">Revisión Final</h2>
        <p class="text-sm text-slate-500 mt-1">Verificá los datos del vehículo y redactá la descripción antes de publicar.</p>
      </div>

      <!-- Resumen Compacto: Foto de Portada + Ficha Técnica -->
      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-4">
        
        <!-- Fila de Portada -->
        <div class="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-200 border border-slate-100 shadow-xs">
          @if (coverUrl) {
            <img
              [src]="coverUrl"
              alt="Portada del vehículo"
              class="w-full h-full object-cover"
            />
          } @else {
            <div class="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          }
          <!-- Badge Cantidad de fotos -->
          <div class="absolute bottom-3 right-3 px-3 py-1 bg-slate-950/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg tracking-wider">
            {{ photoCount }} FOTOS
          </div>
        </div>

        <!-- Grilla de Datos Principales -->
        <div class="grid grid-cols-2 gap-3 text-sm border-t border-slate-200 pt-3">
          <div>
            <span class="text-slate-400 text-xs block">Marca y Modelo</span>
            <span class="font-bold text-slate-800">{{ carData.brand }} {{ carData.model }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs block">Año</span>
            <span class="font-bold text-slate-800">{{ carData.year }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs block">Kilometraje</span>
            <span class="font-bold text-slate-800">{{ formatKilometers(carData.kilometers) }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs block">Color</span>
            <span class="font-bold text-slate-800 capitalize">{{ carData.color || 'No especificado' }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs block">Combustible</span>
            <span class="font-bold text-slate-800 capitalize">{{ formatFuelType(carData.fuel_type) }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-xs block">Transmisión</span>
            <span class="font-bold text-slate-800 capitalize">{{ formatTransmission(carData.transmission) }}</span>
          </div>
          
          <!-- Fila de Precios completos -->
          <div class="col-span-2 grid grid-cols-2 gap-3 pt-2 mt-1 border-t border-slate-100">
            @if (carData.price_usd) {
              <div>
                <span class="text-slate-400 text-xs block">Precio USD</span>
                <span class="font-black text-indigo-600 text-base">USD {{ carData.price_usd | number }}</span>
              </div>
            }
            @if (carData.price_ars) {
              <div>
                <span class="text-slate-400 text-xs block">Precio ARS</span>
                <span class="font-black text-indigo-600 text-base">ARS {{ carData.price_ars | number }}</span>
              </div>
            }
          </div>
        </div>

      </div>

      <!-- Sección Descripción Editable -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-black text-slate-400 uppercase tracking-wider block">
          Descripción de la Publicación
        </label>
        <textarea
          [(ngModel)]="carData.description"
          placeholder="Escribí una descripción comercial atractiva para el auto. Ej: Único dueño, impecable estado..."
          rows="4"
          class="w-full p-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 leading-relaxed resize-none">
        </textarea>
        <p class="text-[10px] text-slate-400">
          ✨ Sugerida y generada de forma inteligente mediante Gemini AI en base a las fotos cargadas.
        </p>
      </div>

      <!-- Banner de Error si ocurre alguno -->
      @if (errorMsg()) {
        <div class="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex flex-col gap-2">
          <div class="flex items-center gap-2 font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-red-600">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            Error al Guardar
          </div>
          <p class="text-xs">{{ errorMsg() }}</p>
        </div>
      }

      <!-- Acciones de Guardado -->
      <div class="flex flex-col gap-3">
        <div class="flex gap-3">
          <button
            (click)="goBack()"
            [disabled]="isLoading()"
            type="button"
            class="flex-1 h-12 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Atrás
          </button>
          
          <button
            (click)="saveCar('borrador')"
            [disabled]="isLoading()"
            type="button"
            class="flex-1 h-12 bg-white text-indigo-600 border border-indigo-600 font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5">
            Guardar Borrador
          </button>
        </div>

        <button
          (click)="saveCar('disponible')"
          [disabled]="isLoading()"
          type="button"
          class="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 text-base">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Publicar Ahora
        </button>
      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class StepReviewComponent {
  private router = inject(Router);
  private carService = inject(CarService);

  @Input() carData: Partial<Car> = {};
  @Input() coverUrl: string | null = null;
  @Input() photoCount = 0;
  @Input() photos: { file: File; blob: Blob }[] = [];

  @Output() back = new EventEmitter<void>();

  /** Signals de estado */
  protected readonly isLoading = signal<boolean>(false);
  protected readonly loadingText = signal<string>('Guardando...');
  protected readonly errorMsg = signal<string | null>(null);

  /**
   * Formateadores de visualización
   */
  protected formatKilometers(km: number | null | undefined): string {
    if (km === null || km === undefined) return '0 km';
    if (km === 0) return 'Nuevo (0 km)';
    return `${km.toLocaleString('es-AR')} km`;
  }

  protected formatFuelType(fuel: string | null | undefined): string {
    if (!fuel) return 'No especificado';
    const map: Record<string, string> = {
      nafta: 'Nafta',
      diesel: 'Diesel',
      gnc: 'GNC',
      hibrido: 'Híbrido',
      electrico: 'Eléctrico'
    };
    return fuel
      .split('+')
      .map(part => {
        const trimmed = part.trim();
        return map[trimmed] || trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      })
      .join(' + ');
  }

  protected formatTransmission(trans: string | null | undefined): string {
    if (!trans) return 'No especificada';
    const map: Record<string, string> = {
      manual: 'Manual',
      automatica: 'Automática'
    };
    return map[trans] || trans;
  }

  /**
   * Guarda el vehículo con el estado seleccionado ('borrador' o 'disponible')
   * y muestra mensajes descriptivos en la pantalla de carga.
   */
  protected async saveCar(status: CarStatus) {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    try {
      await this.carService.createCar(
        this.carData,
        this.photos,
        status,
        (step) => {
          switch (step) {
            case 'saving_car':
              this.loadingText.set('Guardando datos del auto...');
              break;
            case 'uploading_photos':
              this.loadingText.set('Subiendo fotos...');
              break;
            case 'saving_photos':
              this.loadingText.set('Casi listo...');
              break;
            case 'done':
              this.loadingText.set('¡Guardado con éxito!');
              break;
          }
        }
      );

      // Redirigir a Home con mensaje de éxito (o simplemente navegar)
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Error al guardar el auto:', err);
      this.errorMsg.set(err.message || 'No se pudo guardar el auto. Por favor, reintentá.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected goBack() {
    this.back.emit();
  }
}
