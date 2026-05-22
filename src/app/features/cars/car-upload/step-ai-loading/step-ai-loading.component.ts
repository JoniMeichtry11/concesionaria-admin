import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoItem } from '../car-upload.component';
import { GeminiService } from '../../../../core/services/gemini.service';
import { GeminiCarAnalysis } from '../../../../core/models/gemini.model';

export type LoadingStatus = 'pending' | 'processing' | 'completed';

@Component({
  selector: 'app-step-ai-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-8 animate-fade-in text-center py-10">
      
      <!-- Icono central de carga con pulsaciones y animaciones -->
      <div class="relative w-24 h-24 mx-auto">
        <!-- Onda de radio de pulsación -->
        <div class="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-75"></div>
        <!-- Círculo principal -->
        <div class="relative w-full h-full rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
          @if (progress() === 100) {
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10 animate-bounce text-green-600">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 animate-pulse text-indigo-600">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 21l8.982-8.979M21 3h-6.018L3 18.018V21h2.982L21 5.982V3Z" />
            </svg>
          }
        </div>
      </div>

      <!-- Texto descriptivo principal -->
      <div>
        <h2 class="text-xl font-black text-slate-800">
          {{ progress() === 100 ? '¡Análisis Completado!' : 'Analizando con Inteligencia Artificial' }}
        </h2>
        <p class="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
          Gemini está examinando la silueta, ópticas y detalles de tu auto para pre-completar los datos técnicos de forma inteligente.
        </p>
      </div>

      <!-- Barra de Progreso Circular / Porcentaje -->
      <div class="flex flex-col items-center gap-1.5">
        <span class="text-3xl font-black text-slate-700 tracking-tight transition-all duration-300">
          {{ progress() }}%
        </span>
        <div class="h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
          <div
            class="h-full bg-indigo-600 transition-all duration-300 ease-out"
            [style.width.%]="progress()">
          </div>
        </div>
      </div>

      <!-- Lista de Pasos y Checkbox visual de lo que está ocurriendo -->
      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left flex flex-col gap-3.5 max-w-sm mx-auto w-full">
        
        <!-- Paso 1: Marca y modelo -->
        <div class="flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2.5">
            <div [ngClass]="getStepIconClass(marcaModeloStatus())" class="w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-sm transition-all duration-300">
              @if (marcaModeloStatus() === 'completed') {
                ✓
              } @else {
                1
              }
            </div>
            <span [class.font-bold]="marcaModeloStatus() === 'processing'" [class.text-slate-700]="marcaModeloStatus() !== 'pending'" class="text-slate-400 transition-colors">
              Detectando marca y modelo
            </span>
          </div>
          @if (marcaModeloStatus() === 'processing') {
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
          }
        </div>

        <!-- Paso 2: Color y transmisión -->
        <div class="flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2.5">
            <div [ngClass]="getStepIconClass(colorStatus())" class="w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-sm transition-all duration-300">
              @if (colorStatus() === 'completed') {
                ✓
              } @else {
                2
              }
            </div>
            <span [class.font-bold]="colorStatus() === 'processing'" [class.text-slate-700]="colorStatus() !== 'pending'" class="text-slate-400 transition-colors">
              Identificando color y transmisión
            </span>
          </div>
          @if (colorStatus() === 'processing') {
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
          }
        </div>

        <!-- Paso 3: Descripción comercial -->
        <div class="flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2.5">
            <div [ngClass]="getStepIconClass(descripcionStatus())" class="w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-sm transition-all duration-300">
              @if (descripcionStatus() === 'completed') {
                ✓
              } @else {
                3
              }
            </div>
            <span [class.font-bold]="descripcionStatus() === 'processing'" [class.text-slate-700]="descripcionStatus() !== 'pending'" class="text-slate-400 transition-colors">
              Generando descripción comercial
            </span>
          </div>
          @if (descripcionStatus() === 'processing') {
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
          }
        </div>

      </div>

      <!-- Botón de cancelación / volver -->
      <button
        (click)="cancelAnalysis()"
        type="button"
        class="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 border border-red-100/60 rounded-xl px-4 py-2.5 self-center active:scale-95 transition-all duration-150">
        Cancelar Análisis
      </button>

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
export class StepAiLoadingComponent {
  private geminiService = inject(GeminiService);

  @Input() photos: PhotoItem[] = [];
  @Output() analysisComplete = new EventEmitter<GeminiCarAnalysis>();
  @Output() back = new EventEmitter<void>();

  /** Signal de porcentaje de progreso simulado */
  readonly progress = signal<number>(0);

  /** Signals de estados de cada paso */
  readonly marcaModeloStatus = signal<LoadingStatus>('pending');
  readonly colorStatus = signal<LoadingStatus>('pending');
  readonly descripcionStatus = signal<LoadingStatus>('pending');

  private intervalId: any = null;
  private aborted = false;

  constructor() {
    // Iniciamos la llamada a Gemini en el constructor, evitando ngOnInit según directiva Angular
    this.startAnalysis();
  }

  /**
   * Ejecuta el análisis real de fotos con Gemini Flash,
   * coordinando a la vez un contador visual suave para el usuario.
   */
  private async startAnalysis() {
    const files = this.photos.map((item) => item.file);
    if (files.length === 0) {
      this.back.emit();
      return;
    }

    // Iniciar temporizador de animación suave
    this.intervalId = setInterval(() => {
      const currentProgress = this.progress();
      if (currentProgress < 98) {
        // Avance gradual no lineal
        const increment = Math.floor(Math.random() * 2) + 1;
        const newProgress = Math.min(98, currentProgress + increment);
        this.progress.set(newProgress);
        this.updateStepStatuses(newProgress);
      }
    }, 120);

    try {
      // Llamada real de análisis a Gemini Flash 1.5
      const analysisResult = await this.geminiService.analyzeCarPhotos(files);

      if (this.aborted) return;

      // Finalizar visualmente al 100% de manera fluida
      clearInterval(this.intervalId);
      this.progress.set(100);
      this.marcaModeloStatus.set('completed');
      this.colorStatus.set('completed');
      this.descripcionStatus.set('completed');

      // Pequeño timeout de 800ms para permitir al usuario ver el feedback de éxito antes de navegar
      setTimeout(() => {
        if (!this.aborted) {
          this.analysisComplete.emit(analysisResult);
        }
      }, 800);

    } catch (err: unknown) {
      console.error('Error durante la orquestación del análisis:', err);
      if (this.aborted) return;

      clearInterval(this.intervalId);
      // Retornar fallback estructurado en caso de error extremo
      this.progress.set(100);
      this.marcaModeloStatus.set('completed');
      this.colorStatus.set('completed');
      this.descripcionStatus.set('completed');

      setTimeout(() => {
        if (!this.aborted) {
          this.analysisComplete.emit({
            brand: null,
            model: null,
            year: null,
            color: null,
            fuel_type: null,
            transmission: null,
            confidence: {
              brand: 'low',
              model: 'low',
              year: 'low',
              color: 'low',
              fuel_type: 'low',
              transmission: 'low',
            },
            description: 'El análisis de fotos con IA no pudo completarse con éxito. Podés cargar los datos del auto manualmente.',
          });
        }
      }, 800);
    }
  }

  /**
   * Actualiza los estados de cada paso según el porcentaje simulado.
   */
  private updateStepStatuses(percentage: number) {
    if (percentage < 35) {
      this.marcaModeloStatus.set('processing');
      this.colorStatus.set('pending');
      this.descripcionStatus.set('pending');
    } else if (percentage >= 35 && percentage < 70) {
      this.marcaModeloStatus.set('completed');
      this.colorStatus.set('processing');
      this.descripcionStatus.set('pending');
    } else {
      this.marcaModeloStatus.set('completed');
      this.colorStatus.set('completed');
      this.descripcionStatus.set('processing');
    }
  }

  /**
   * Retorna las clases de Tailwind correspondientes a cada estado del paso.
   */
  getStepIconClass(status: LoadingStatus): Record<string, boolean> {
    return {
      'bg-slate-100 text-slate-400 border border-slate-200': status === 'pending',
      'bg-indigo-50 text-indigo-600 border border-indigo-200': status === 'processing',
      'bg-green-100 text-green-700 border border-green-200 scale-105': status === 'completed',
    };
  }

  /**
   * Cancela la tarea en curso y regresa a la pantalla de fotos.
   */
  cancelAnalysis() {
    this.aborted = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.back.emit();
  }
}
