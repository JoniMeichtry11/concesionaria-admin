import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StepPhotosComponent } from './step-photos/step-photos.component';
import { StepAiLoadingComponent } from './step-ai-loading/step-ai-loading.component';
import { GeminiCarAnalysis } from '../../../core/models/gemini.model';

export interface PhotoItem {
  file: File;
  blob: Blob;
  url: string; // Object URL para previsualización local
}

@Component({
  selector: 'app-car-upload',
  standalone: true,
  imports: [CommonModule, StepPhotosComponent, StepAiLoadingComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      <!-- Header con barra de navegación e indicador de progreso -->
      <header class="bg-white border-b border-slate-100 sticky top-0 z-40 px-4 py-3 shadow-sm">
        <div class="max-w-screen-sm mx-auto flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button
              (click)="cancel()"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-200 active:scale-90"
              aria-label="Cancelar carga">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 class="text-lg font-bold text-slate-800 tracking-tight">Cargar Auto</h1>
          </div>
          <span class="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
            Paso {{ currentStep() }} de 4
          </span>
        </div>

        <!-- Barra de Progreso Lineal -->
        <div class="max-w-screen-sm mx-auto mt-4">
          <div class="flex items-center justify-between text-xs font-medium text-slate-400 mb-2 px-1">
            <span [class.text-indigo-600]="currentStep() >= 1" [class.font-bold]="currentStep() === 1">1. Fotos</span>
            <span [class.text-indigo-600]="currentStep() >= 2" [class.font-bold]="currentStep() === 2">2. Análisis IA</span>
            <span [class.text-indigo-600]="currentStep() >= 3" [class.font-bold]="currentStep() === 3">3. Datos</span>
            <span [class.text-indigo-600]="currentStep() >= 4" [class.font-bold]="currentStep() === 4">4. Publicación</span>
          </div>
          <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-indigo-600 transition-all duration-500 ease-out"
              [style.width.%]="progressPercentage()">
            </div>
          </div>
        </div>
      </header>

      <!-- Contenedor Principal Adaptado a Mobile -->
      <main class="flex-grow flex flex-col justify-start max-w-screen-sm w-full mx-auto p-4 md:py-6">
        @switch (currentStep()) {
          @case (1) {
            <app-step-photos
              [initialPhotos]="photos()"
              (photosChange)="onPhotosChanged($event)"
              (next)="goToStep2()"
            />
          }
          @case (2) {
            <app-step-ai-loading
              [photos]="photos()"
              (analysisComplete)="onAnalysisComplete($event)"
              (back)="goToStep1()"
            />
          }
          @case (3) {
            <!-- Paso 3 Stub: Cuestionario Adaptativo -->
            <div class="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-6 animate-fade-in">
              <div class="text-center">
                <div class="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <h2 class="text-xl font-black text-slate-800">¡Análisis Completo!</h2>
                <p class="text-sm text-slate-500 mt-1">Gemini analizó con éxito tus fotos.</p>
              </div>

              <!-- Vista previa de campos extraídos por IA -->
              <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos Extraídos</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span class="text-slate-400 text-xs block">Marca</span>
                    <span class="font-bold text-slate-700">{{ aiAnalysis()?.brand || 'No detectado' }}</span>
                    @if (aiAnalysis()?.brand) {
                      <span class="text-[10px] ml-1 px-1.5 py-0.25 rounded-md" [ngClass]="getConfidenceBadgeClass(aiAnalysis()?.confidence?.brand)">
                        {{ getConfidenceText(aiAnalysis()?.confidence?.brand) }}
                      </span>
                    }
                  </div>
                  <div>
                    <span class="text-slate-400 text-xs block">Modelo</span>
                    <span class="font-bold text-slate-700">{{ aiAnalysis()?.model || 'No detectado' }}</span>
                    @if (aiAnalysis()?.model) {
                      <span class="text-[10px] ml-1 px-1.5 py-0.25 rounded-md" [ngClass]="getConfidenceBadgeClass(aiAnalysis()?.confidence?.model)">
                        {{ getConfidenceText(aiAnalysis()?.confidence?.model) }}
                      </span>
                    }
                  </div>
                  <div>
                    <span class="text-slate-400 text-xs block">Año</span>
                    <span class="font-bold text-slate-700">{{ aiAnalysis()?.year || 'No detectado' }}</span>
                    @if (aiAnalysis()?.year) {
                      <span class="text-[10px] ml-1 px-1.5 py-0.25 rounded-md" [ngClass]="getConfidenceBadgeClass(aiAnalysis()?.confidence?.year)">
                        {{ getConfidenceText(aiAnalysis()?.confidence?.year) }}
                      </span>
                    }
                  </div>
                  <div>
                    <span class="text-slate-400 text-xs block">Color</span>
                    <span class="font-bold text-slate-700 capitalize">{{ aiAnalysis()?.color || 'No detectado' }}</span>
                    @if (aiAnalysis()?.color) {
                      <span class="text-[10px] ml-1 px-1.5 py-0.25 rounded-md" [ngClass]="getConfidenceBadgeClass(aiAnalysis()?.confidence?.color)">
                        {{ getConfidenceText(aiAnalysis()?.confidence?.color) }}
                      </span>
                    }
                  </div>
                  <div>
                    <span class="text-slate-400 text-xs block">Combustible</span>
                    <span class="font-bold text-slate-700 capitalize">{{ aiAnalysis()?.fuel_type || 'No detectado' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 text-xs block">Transmisión</span>
                    <span class="font-bold text-slate-700 capitalize">{{ aiAnalysis()?.transmission || 'No detectado' }}</span>
                  </div>
                </div>
                
                <div class="mt-2 pt-3 border-t border-slate-200">
                  <span class="text-slate-400 text-xs block">Descripción IA Sugerida</span>
                  <p class="text-xs text-slate-600 mt-1 italic font-medium leading-relaxed">
                    "{{ aiAnalysis()?.description }}"
                  </p>
                </div>
              </div>

              <div class="flex gap-3">
                <button
                  (click)="currentStep.set(2)"
                  class="flex-1 h-12 bg-white text-indigo-600 border border-indigo-200 font-semibold rounded-xl active:scale-95 transition-transform flex items-center justify-center">
                  Volver a Analizar
                </button>
                <button
                  (click)="currentStep.set(4)"
                  class="flex-1 h-12 bg-indigo-600 text-white font-semibold rounded-xl active:scale-95 transition-transform flex items-center justify-center">
                  Siguiente Paso
                </button>
              </div>
            </div>
          }
          @case (4) {
            <!-- Paso 4 Stub: Revisión Final -->
            <div class="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-6 animate-fade-in text-center">
              <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-800">Paso 4: Revisión</h2>
                <p class="text-sm text-slate-500 mt-2 leading-relaxed">
                  Esta pantalla corresponde a la revisión final de todos los campos e imágenes consolidadas antes de publicar.
                </p>
              </div>

              <div class="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 text-left text-xs text-indigo-900 leading-relaxed">
                👉 En la siguiente fase se implementará la persistencia en base de datos de Supabase, el cuestionario interactivo dinámico paso a paso y la creación final del auto.
              </div>

              <div class="flex flex-col gap-3">
                <button
                  (click)="currentStep.set(3)"
                  class="w-full h-12 bg-white text-indigo-600 border border-indigo-200 font-semibold rounded-xl active:scale-95 transition-transform flex items-center justify-center">
                  Volver a Cuestionario
                </button>
                <button
                  (click)="finish()"
                  class="w-full h-12 bg-indigo-600 text-white font-semibold rounded-xl active:scale-95 transition-transform flex items-center justify-center">
                  Cerrar y Volver al Inicio
                </button>
              </div>
            </div>
          }
        }
      </main>
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
export class CarUploadComponent {
  private router = inject(Router);

  /** Signal para rastrear el paso del wizard (1 a 4) */
  readonly currentStep = signal<number>(1);

  /** Signal que contiene las fotos seleccionadas (blobs, previews y archivos originales) */
  readonly photos = signal<PhotoItem[]>([]);

  /** Signal que contiene el resultado del análisis de Gemini */
  readonly aiAnalysis = signal<GeminiCarAnalysis | null>(null);

  /** Calcula el porcentaje de progreso de acuerdo al paso actual */
  readonly progressPercentage = computed(() => {
    switch (this.currentStep()) {
      case 1: return 25;
      case 2: return 50;
      case 3: return 75;
      case 4: return 100;
      default: return 0;
    }
  });

  /** Cancela la carga y vuelve a la pantalla de inicio */
  cancel(): void {
    if (this.photos().length > 0) {
      if (confirm('¿Estás seguro de que querés cancelar la carga? Se perderán las fotos seleccionadas.')) {
        this.clearPreviews();
        this.router.navigate(['/']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  /** Finaliza la carga en esta fase experimental */
  finish(): void {
    this.clearPreviews();
    this.router.navigate(['/']);
  }

  /** Callback al recibir cambios de fotos en el Paso 1 */
  onPhotosChanged(newPhotos: PhotoItem[]): void {
    this.photos.set(newPhotos);
  }

  /** Transiciona al Paso 2 */
  goToStep2(): void {
    if (this.photos().length === 0) return;
    this.currentStep.set(2);
  }

  /** Transiciona de regreso al Paso 1 */
  goToStep1(): void {
    this.currentStep.set(1);
  }

  /** Callback cuando Gemini finaliza el análisis exitosamente */
  onAnalysisComplete(analysis: GeminiCarAnalysis): void {
    this.aiAnalysis.set(analysis);
    this.currentStep.set(3);
  }

  /** Retorna el texto representativo de la confianza de Gemini */
  getConfidenceText(conf?: 'high' | 'medium' | 'low'): string {
    switch (conf) {
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      case 'low': return 'Bajo';
      default: return 'Bajo';
    }
  }

  /** Retorna los estilos CSS del badge de confianza */
  getConfidenceBadgeClass(conf?: 'high' | 'medium' | 'low'): Record<string, boolean> {
    return {
      'bg-green-100 text-green-800': conf === 'high',
      'bg-yellow-100 text-yellow-800': conf === 'medium',
      'bg-red-100 text-red-800': conf === 'low' || !conf,
    };
  }

  /** Libera URLs de objetos para prevenir fugas de memoria */
  private clearPreviews(): void {
    this.photos().forEach((photo) => {
      URL.revokeObjectURL(photo.url);
    });
    this.photos.set([]);
  }
}
