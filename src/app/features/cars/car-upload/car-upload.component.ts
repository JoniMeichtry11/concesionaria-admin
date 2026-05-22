import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StepPhotosComponent } from './step-photos/step-photos.component';
import { StepAiLoadingComponent } from './step-ai-loading/step-ai-loading.component';
import { StepQuestionnaireComponent } from './step-questionnaire/step-questionnaire.component';
import { StepReviewComponent } from './step-review/step-review.component';
import { GeminiCarAnalysis } from '../../../core/models/gemini.model';
import { Car } from '../../../core/models/car.model';

export interface PhotoItem {
  file: File;
  blob: Blob;
  url: string; // Object URL para previsualización local
}

@Component({
  selector: 'app-car-upload',
  standalone: true,
  imports: [
    CommonModule,
    StepPhotosComponent,
    StepAiLoadingComponent,
    StepQuestionnaireComponent,
    StepReviewComponent,
  ],
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
            <app-step-questionnaire
              [geminiResult]="aiAnalysis()"
              [carData]="carData()"
              (carDataChange)="onCarDataChanged($event)"
              (back)="goToStep2()"
              (next)="goToStep4()"
            />
          }
          @case (4) {
            <app-step-review
              [carData]="carData()"
              [coverUrl]="coverUrl()"
              [photoCount]="photos().length"
              [photos]="photos()"
              (back)="goToStep3()"
            />
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

  /** Signal que contiene los datos consolidados del auto (editados por el cuestionario) */
  readonly carData = signal<Partial<Car>>({});

  /** URL de previsualización de la foto de portada (primera foto) */
  readonly coverUrl = computed(() => {
    const p = this.photos();
    return p.length > 0 ? p[0].url : null;
  });

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

  /** Callback al recibir cambios de fotos en el Paso 1 */
  onPhotosChanged(newPhotos: PhotoItem[]): void {
    this.photos.set(newPhotos);
  }

  /** Callback cuando Gemini finaliza el análisis exitosamente */
  onAnalysisComplete(analysis: GeminiCarAnalysis): void {
    this.aiAnalysis.set(analysis);
    this.currentStep.set(3);
  }

  /** Callback cuando el cuestionario actualiza los datos del auto */
  onCarDataChanged(data: Partial<Car>): void {
    this.carData.set(data);
  }

  // --- Navegación entre pasos ---

  goToStep1(): void {
    this.currentStep.set(1);
  }

  goToStep2(): void {
    if (this.photos().length === 0) return;
    this.currentStep.set(2);
  }

  goToStep3(): void {
    this.currentStep.set(3);
  }

  goToStep4(): void {
    this.currentStep.set(4);
  }

  /** Libera URLs de objetos para prevenir fugas de memoria */
  private clearPreviews(): void {
    this.photos().forEach((photo) => {
      URL.revokeObjectURL(photo.url);
    });
    this.photos.set([]);
  }
}
