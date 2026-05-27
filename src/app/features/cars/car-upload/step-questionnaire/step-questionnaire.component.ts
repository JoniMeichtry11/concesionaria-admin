import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiCarAnalysis } from '../../../../core/models/gemini.model';
import { Car } from '../../../../core/models/car.model';
import { SettingsService, Settings } from '../../../../core/services/settings.service';

interface QuestionConfig {
  field: keyof Car | 'price';
  label: string;
  type: 'text' | 'number' | 'kilometers' | 'price' | 'chips' | 'color';
  options?: string[];
  confidence?: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-step-questionnaire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-6 animate-fade-in">
      
      <!-- Encabezado de Progreso del Cuestionario -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 class="text-lg font-black text-slate-800 tracking-tight">Completar Datos</h2>
          <p class="text-xs text-slate-400 mt-0.5">Adaptamos el formulario según el análisis de IA</p>
        </div>
        <span class="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full shrink-0">
          Pregunta {{ currentIndex() + 1 }} de {{ activeQuestions.length }}
        </span>
      </div>

      <!-- Barra de Progreso Interna -->
      <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          class="h-full bg-indigo-600 transition-all duration-300 ease-out"
          [style.width.%]="(currentIndex() + 1) * 100 / activeQuestions.length">
        </div>
      </div>

      <!-- Pregunta Activa -->
      @if (currentQuestion(); as q) {
        <div class="flex flex-col gap-4 py-2 min-h-[220px]">
          <!-- Label & Resaltado para Confianza Media -->
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-bold text-slate-400 uppercase tracking-wider">{{ q.label }}</span>
            @if (q.confidence === 'medium') {
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 shrink-0 animate-pulse">
                ⚠️ Confirmar sugerencia de IA
              </span>
            }
          </div>

          <!-- INPUT COMPONENT DINÁMICO -->
          <div class="flex-grow flex flex-col justify-start">
            
            <!-- Caso TEXTO LIBRE (Marca o Modelo) -->
            @if (q.type === 'text') {
              <input
                type="text"
                [ngModel]="getFieldValue(q.field)"
                (ngModelChange)="updateFieldValue(q.field, $event)"
                [placeholder]="'Ej: ' + (q.field === 'brand' ? 'Toyota' : 'Corolla')"
                [class.border-yellow-400]="q.confidence === 'medium'"
                [class.bg-yellow-50/20]="q.confidence === 'medium'"
                class="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-base font-semibold text-slate-800"
              />

              <!-- Sugerencias Rápidas para Marca -->
              @if (q.field === 'brand') {
                <div class="flex flex-wrap gap-2 mt-3">
                  @for (opt of popularBrands; track opt) {
                    <button
                      (click)="updateFieldValue(q.field, opt)"
                      type="button"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 active:scale-95 transition-all duration-150 border border-slate-100">
                      {{ opt }}
                    </button>
                  }
                </div>
              }
            }

            <!-- Caso COLOR -->
            @else if (q.type === 'color') {
              <input
                type="text"
                [ngModel]="getFieldValue(q.field)"
                (ngModelChange)="updateFieldValue(q.field, $event)"
                placeholder="Ej: Blanco, Gris Plata, Negro..."
                [class.border-yellow-400]="q.confidence === 'medium'"
                class="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-base font-semibold text-slate-800"
              />

              <!-- Sugerencias Rápidas de Colores -->
              <div class="flex flex-wrap gap-2 mt-3">
                @for (opt of popularColors; track opt) {
                  <button
                    (click)="updateFieldValue(q.field, opt)"
                    type="button"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 active:scale-95 transition-all duration-150 border border-slate-100">
                    {{ opt }}
                  </button>
                }
              </div>
            }

            <!-- Caso AÑO (Numérico) -->
            @else if (q.type === 'number') {
              <input
                type="number"
                [ngModel]="getFieldValue(q.field)"
                (ngModelChange)="updateFieldValue(q.field, $event)"
                placeholder="Ej: 2024"
                min="1900"
                max="2030"
                [class.border-yellow-400]="q.confidence === 'medium'"
                class="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-base font-semibold text-slate-800"
              />

              <!-- Chips rápidos de años recientes -->
              <div class="flex flex-wrap gap-2 mt-3">
                @for (opt of recentYears; track opt) {
                  <button
                    (click)="updateFieldValue(q.field, opt)"
                    type="button"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 active:scale-95 transition-all duration-150 border border-slate-100">
                    {{ opt }}
                  </button>
                }
              </div>
            }

            <!-- Caso KILÓMETROS (Numérico con Chips en formato local) -->
            @else if (q.type === 'kilometers') {
              <div class="relative">
                <input
                  type="number"
                  [ngModel]="getFieldValue(q.field)"
                  (ngModelChange)="updateFieldValue(q.field, $event)"
                  placeholder="Ej: 45000"
                  class="w-full h-12 pl-4 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-base font-semibold text-slate-800"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">km</span>
              </div>

              <!-- Sugerencias en Chips -->
              <div class="flex flex-wrap gap-2 mt-3">
                @for (opt of kilometerSuggestions; track opt.value) {
                  <button
                    (click)="updateFieldValue(q.field, opt.value)"
                    type="button"
                    class="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 active:scale-95 transition-all duration-150 border border-slate-200">
                    {{ opt.label }}
                  </button>
                }
              </div>
            }

            <!-- Caso CHIPS (Combustible / Transmisión) -->
            @else if (q.type === 'chips') {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (opt of q.options; track opt) {
                  <button
                    (click)="q.field === 'fuel_type' ? toggleFuelTypeOption(opt) : updateFieldValue(q.field, mapOptionValue(q.field, opt))"
                    type="button"
                    [class]="
                      'h-14 rounded-2xl font-bold text-sm transition-all duration-150 active:scale-95 flex items-center justify-center border ' +
                      (isOptionSelected(q.field, opt)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                    ">
                    {{ opt }}
                  </button>
                }
              </div>
            }

            <!-- Caso PRECIO (Multimoneda con selector/toggle) -->
            @else if (q.type === 'price') {
              <div class="flex flex-col gap-4">
                
                <!-- Selector de moneda (Dólares / Pesos) -->
                @if (isCurrencyActive('USD') && isCurrencyActive('ARS')) {
                  <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      (click)="priceCurrency.set('USD')"
                      type="button"
                      [class]="'flex-1 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ' + 
                        (priceCurrency() === 'USD' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800')">
                      Dólares (USD)
                    </button>
                    <button
                      (click)="priceCurrency.set('ARS')"
                      type="button"
                      [class]="'flex-1 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ' + 
                        (priceCurrency() === 'ARS' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800')">
                      Pesos (ARS)
                    </button>
                  </div>
                }

                <!-- Input según moneda seleccionada -->
                @if (priceCurrency() === 'USD' && isCurrencyActive('USD')) {
                  <div>
                    <label class="text-xs font-bold text-slate-400 block mb-1">Precio en Dólares (USD)</label>
                    <div class="relative">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">USD</span>
                      <input
                        type="number"
                        [ngModel]="priceUsd()"
                        (ngModelChange)="onPriceUsdChanged($event)"
                        placeholder="Ej: 14500"
                        class="w-full h-12 pl-14 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-base font-semibold text-slate-800"
                      />
                    </div>
                    @if (priceArs() !== null && settings()?.ars_rate) {
                      <p class="text-xs text-slate-400 mt-1.5 font-medium">
                        Equivale a: <span class="font-bold text-slate-600">ARS {{ priceArs()! | number }}</span> (TC sugerido: {{ formatRate() }})
                      </p>
                    }
                  </div>
                } @else if (priceCurrency() === 'ARS' && isCurrencyActive('ARS')) {
                  <div>
                    <label class="text-xs font-bold text-slate-400 block mb-1">Precio en Pesos (ARS)</label>
                    <div class="relative">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ARS</span>
                      <input
                        type="number"
                        [ngModel]="priceArs()"
                        (ngModelChange)="onPriceArsChanged($event)"
                        placeholder="Ej: 14500000"
                        class="w-full h-12 pl-14 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-base font-semibold text-slate-800"
                      />
                    </div>
                    @if (priceUsd() !== null && settings()?.ars_rate) {
                      <p class="text-xs text-slate-400 mt-1.5 font-medium">
                        Equivale a: <span class="font-bold text-slate-600">USD {{ priceUsd()! | number }}</span> (TC sugerido: {{ formatRate() }})
                      </p>
                    }
                  </div>
                } @else {
                  <!-- Fallback si no hay concordancia con la seleccionada o la configuración cambió -->
                  @if (isCurrencyActive('USD')) {
                    <div>
                      <label class="text-xs font-bold text-slate-400 block mb-1">Precio en Dólares (USD)</label>
                      <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">USD</span>
                        <input
                          type="number"
                          [ngModel]="priceUsd()"
                          (ngModelChange)="onPriceUsdChanged($event)"
                          placeholder="Ej: 14500"
                          class="w-full h-12 pl-14 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-base font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  } @else if (isCurrencyActive('ARS')) {
                    <div>
                      <label class="text-xs font-bold text-slate-400 block mb-1">Precio en Pesos (ARS)</label>
                      <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ARS</span>
                        <input
                          type="number"
                          [ngModel]="priceArs()"
                          (ngModelChange)="onPriceArsChanged($event)"
                          placeholder="Ej: 14500000"
                          class="w-full h-12 pl-14 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-base font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  }
                }

                <!-- Mensaje aclaratorio de Tipo de Cambio -->
                @if (isCurrencyActive('USD') && isCurrencyActive('ARS')) {
                  <p class="text-[11px] text-slate-400 italic">
                    Calculado automáticamente al cambiar un precio, pero podés sobrescribirlo libremente.
                  </p>
                }
              </div>
            }

          </div>
        </div>
      }

      <!-- Navegación del Cuestionario -->
      <div class="flex gap-3 mt-2">
        <button
          (click)="goBack()"
          type="button"
          class="flex-1 h-12 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Atrás
        </button>
        <button
          (click)="goNext()"
          [disabled]="!isCurrentQuestionValid()"
          type="button"
          class="flex-grow flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10">
          {{ isLastQuestion() ? 'Revisar' : 'Siguiente' }}
          @if (!isLastQuestion()) {
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          }
        </button>
      </div>

      <!-- Sección: Campos Confirmados por IA (High Confidence) -->
      @if (highConfidenceFields().length > 0) {
        <div class="pt-4 mt-2 border-t border-slate-100">
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
            Detectado automáticamente con alta confianza:
          </h3>
          <div class="flex flex-wrap gap-2">
            @for (item of highConfidenceFields(); track item.field) {
              <button
                (click)="editHighConfidenceField(item.field)"
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 active:scale-95 border border-green-200 transition-all duration-150 select-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 shrink-0 text-green-600">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
                </svg>
                <span class="font-normal">{{ item.label }}:</span>
                <span class="font-black capitalize">{{ item.displayValue }}</span>
              </button>
            }
          </div>
        </div>
      }

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
export class StepQuestionnaireComponent {
  private settingsService = inject(SettingsService);

  @Input() set geminiResult(val: GeminiCarAnalysis | null) {
    this._geminiResult = val;
    this.buildQuestionQueue();
  }
  get geminiResult(): GeminiCarAnalysis | null {
    return this._geminiResult;
  }

  @Input() set carData(val: Partial<Car>) {
    this._carData = { ...val };
    // Inicializar inputs locales del precio si ya están definidos
    if (this._carData.price_usd !== undefined && this._carData.price_usd !== null) {
      this.priceUsd.set(this._carData.price_usd);
    }
    if (this._carData.price_ars !== undefined && this._carData.price_ars !== null) {
      this.priceArs.set(this._carData.price_ars);
    }
  }
  get carData(): Partial<Car> {
    return this._carData;
  }

  @Output() carDataChange = new EventEmitter<Partial<Car>>();
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  private _geminiResult: GeminiCarAnalysis | null = null;
  private _carData: Partial<Car> = {};

  /** Configuración cargada de Ajustes */
  protected readonly settings = this.settingsService.settings;

  /** Signals locales para manejo interactivo de precio */
  protected readonly priceUsd = signal<number | null>(null);
  protected readonly priceArs = signal<number | null>(null);
  protected readonly priceCurrency = signal<'USD' | 'ARS'>('USD');

  /** Listado de todas las preguntas con su configuración */
  private allQuestions: QuestionConfig[] = [
    { field: 'brand', label: 'Marca del vehículo', type: 'text' },
    { field: 'model', label: 'Modelo del vehículo', type: 'text' },
    { field: 'year', label: 'Año de fabricación', type: 'number' },
    { field: 'kilometers', label: 'Kilómetros recorridos', type: 'kilometers' },
    { field: 'price', label: 'Precio de venta', type: 'price' },
    { field: 'fuel_type', label: 'Tipo de Combustible', type: 'chips', options: ['Nafta', 'Diesel', 'GNC', 'Híbrido', 'Eléctrico'] },
    { field: 'transmission', label: 'Tipo de Transmisión', type: 'chips', options: ['Manual', 'Automática'] },
    { field: 'color', label: 'Color del vehículo', type: 'color' },
  ];

  /** Cola activa de preguntas que el usuario debe responder */
  protected activeQuestions: QuestionConfig[] = [];

  /** Índice de la pregunta actual dentro de la cola activa */
  protected readonly currentIndex = signal<number>(0);

  /** Configuración de la pregunta actual */
  protected readonly currentQuestion = computed<QuestionConfig | null>(() => {
    const queue = this.activeQuestions;
    const idx = this.currentIndex();
    return queue[idx] || null;
  });

  // Sugerencias estáticas optimizadas para Argentina (chips rápidos)
  protected readonly popularBrands = ['Toyota', 'Volkswagen', 'Ford', 'Fiat', 'Chevrolet', 'Renault', 'Peugeot', 'Honda'];
  protected readonly popularColors = ['Blanco', 'Gris Plata', 'Gris Oscuro', 'Negro', 'Rojo', 'Azul', 'Beige'];
  protected readonly recentYears = [2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2018, 2015, 2012];
  protected readonly kilometerSuggestions = [
    { label: '0 km', value: 0 },
    { label: '20.000 km', value: 20000 },
    { label: '50.000 km', value: 50000 },
    { label: '80.000 km', value: 80000 },
    { label: '100.000 km', value: 100000 },
    { label: '150.000 km', value: 150000 },
  ];

  constructor() {
    // Asegurar la carga de los ajustes
    this.settingsService.loadSettings();
  }

  /**
   * Genera dinámicamente la cola de preguntas en función de la confianza del análisis de Gemini.
   */
  private buildQuestionQueue() {
    const confidence = this.geminiResult?.confidence;
    const queue: QuestionConfig[] = [];

    // Mapear y mezclar valores por defecto y confidence
    this.allQuestions.forEach((q) => {
      if (q.field === 'kilometers' || q.field === 'price') {
        // Campos obligatorios que siempre se preguntan porque la IA no los extrae del exterior
        queue.push(q);
      } else {
        const fieldConf = confidence ? (confidence as any)[q.field] : 'low';
        
        // Si el nivel de confianza de Gemini es alto (high), no lo ponemos en la cola.
        // Se autoconfirmará en el estado del auto.
        if (fieldConf !== 'high') {
          queue.push({
            ...q,
            confidence: fieldConf,
          });
        }
      }
    });

    this.activeQuestions = queue;
    this.currentIndex.set(0);

    // Inicializar el estado de carData con los campos high-confidence automáticos
    this.initializeCarDataState();
  }

  /**
   * Pre-completa el estado local del vehículo con todos los datos detectados por Gemini.
   * Aquellos con confianza alta se consolidan en el acto.
   */
  private initializeCarDataState() {
    const updated = { ...this._carData };

    // Si Gemini ya generó una descripción, la asociamos por defecto
    if (this.geminiResult?.description) {
      updated.description = this.geminiResult.description;
    }

    // Copiar campos con valor detectado por Gemini
    if (this.geminiResult) {
      const keys: (keyof GeminiCarAnalysis)[] = ['brand', 'model', 'year', 'color', 'fuel_type', 'transmission'];
      keys.forEach((k) => {
        const val = this.geminiResult![k];
        if (val !== null && val !== undefined) {
          (updated as any)[k] = val;
        }
      });
    }

    this._carData = updated;
    this.carDataChange.emit(updated);

    // Actualizar signals locales de precio y determinar moneda activa
    if (updated.price_usd !== undefined && updated.price_usd !== null) {
      this.priceUsd.set(updated.price_usd);
      this.priceCurrency.set('USD');
    }
    if (updated.price_ars !== undefined && updated.price_ars !== null) {
      this.priceArs.set(updated.price_ars);
      if (updated.price_usd === null || updated.price_usd === undefined) {
        this.priceCurrency.set('ARS');
      }
    }
  }

  /**
   * Obtiene la lista de campos detectados con alta confianza ('high') para listarlos al pie.
   */
  protected readonly highConfidenceFields = computed(() => {
    if (!this.geminiResult) return [];
    
    const confidence = this.geminiResult.confidence;
    const fieldsList: { field: keyof Car | 'price'; label: string; displayValue: string }[] = [];

    const mapLabel: Record<string, string> = {
      brand: 'Marca',
      model: 'Modelo',
      year: 'Año',
      color: 'Color',
      fuel_type: 'Combustible',
      transmission: 'Transmisión',
    };

    const keys: (keyof typeof confidence)[] = ['brand', 'model', 'year', 'color', 'fuel_type', 'transmission'];
    
    keys.forEach((k) => {
      if (confidence[k] === 'high' && this.geminiResult![k]) {
        fieldsList.push({
          field: k as any,
          label: mapLabel[k],
          displayValue: String(this.geminiResult![k]),
        });
      }
    });

    return fieldsList;
  });

  /**
   * Permite al usuario hacer tap en un chip de alta confianza al pie de la pantalla
   * para agregarlo dinámicamente a la cola y editarlo.
   */
  protected editHighConfidenceField(field: keyof Car | 'price') {
    const activeIdx = this.activeQuestions.findIndex((q) => q.field === field);
    if (activeIdx !== -1) {
      this.currentIndex.set(activeIdx);
      return;
    }

    // Si no estaba en la cola (porque era high confidence), lo incorporamos
    const qConfig = this.allQuestions.find((q) => q.field === field);
    if (qConfig) {
      const updatedConfig = { ...qConfig, confidence: 'medium' as const };
      
      const newActive = [...this.activeQuestions];
      newActive.push(updatedConfig);
      
      // Ordenar según el orden preestablecido de allQuestions
      newActive.sort((a, b) => {
        const idxA = this.allQuestions.findIndex((x) => x.field === a.field);
        const idxB = this.allQuestions.findIndex((x) => x.field === b.field);
        return idxA - idxB;
      });

      this.activeQuestions = newActive;
      const newIndex = this.activeQuestions.findIndex((q) => q.field === field);
      this.currentIndex.set(newIndex);
    }
  }

  /**
   * Verifica si la moneda especificada ('USD' o 'ARS') está habilitada en los ajustes.
   */
  protected isCurrencyActive(currency: string): boolean {
    const activeCurrencies = this.settings()?.currencies;
    if (!activeCurrencies || activeCurrencies.length === 0) {
      return currency === 'USD'; // Por defecto siempre USD
    }
    return activeCurrencies.includes(currency);
  }

  /**
   * Formatea el tipo de cambio (ars_rate) para el template sin usar el pipe number dentro de interpolaciones complejas.
   */
  protected formatRate(): string {
    const rate = this.settings()?.ars_rate;
    if (rate === null || rate === undefined) return '—';
    return '$' + Number(rate).toLocaleString('es-AR');
  }

  /**
   * Obtiene el valor del campo actual desde el estado local.
   */
  protected getFieldValue(field: keyof Car | 'price'): any {
    if (field === 'price') {
      return this.priceCurrency() === 'USD' ? this.priceUsd() : this.priceArs();
    }
    return this._carData[field as keyof Car] ?? '';
  }

  /**
   * Actualiza el valor del campo actual tanto localmente como en el objeto del contenedor padre.
   */
  protected updateFieldValue(field: keyof Car | 'price', value: any) {
    if (field === 'price') return; // Se maneja de forma especial mediante inputs USD/ARS

    const updated = { ...this._carData };
    if (field === 'year' || field === 'kilometers') {
      (updated as any)[field] = value !== '' && value !== null ? Number(value) : null;
    } else {
      (updated as any)[field] = value === '' ? null : value;
    }

    this._carData = updated;
    this.carDataChange.emit(updated);
  }

  /**
   * Mapeadores especiales de opciones a valores de base de datos en minúscula.
   */
  protected mapOptionValue(field: keyof Car | 'price', option: string): string {
    if (field === 'fuel_type') {
      const map: Record<string, string> = {
        'Nafta': 'nafta',
        'Diesel': 'diesel',
        'GNC': 'gnc',
        'Híbrido': 'hibrido',
        'Eléctrico': 'electrico',
      };
      return map[option] || option.toLowerCase();
    }
    if (field === 'transmission') {
      const map: Record<string, string> = {
        'Manual': 'manual',
        'Automática': 'automatica',
      };
      return map[option] || option.toLowerCase();
    }
    return option;
  }

  /**
   * Compara si la opción visual está actualmente seleccionada en el estado local.
   */
  protected isOptionSelected(field: keyof Car | 'price', option: string): boolean {
    const currentVal = this.getFieldValue(field);
    const dbVal = this.mapOptionValue(field, option);
    if (field === 'fuel_type') {
      if (!currentVal) return false;
      const arr = Array.isArray(currentVal) ? currentVal : [];
      return arr.includes(dbVal);
    }
    return currentVal === dbVal;
  }

  /**
   * Agrega o quita una opción de combustible, uniéndolas con "+".
   */
  protected toggleFuelTypeOption(option: string) {
    const dbVal = this.mapOptionValue('fuel_type', option);
    const currentVal = this.getFieldValue('fuel_type');
    let parts: string[] = Array.isArray(currentVal) ? [...currentVal] : [];

    if (parts.includes(dbVal)) {
      parts = parts.filter(p => p !== dbVal);
    } else {
      parts.push(dbVal);
    }

    const newVal = parts.length > 0 ? parts : null;
    this.updateFieldValue('fuel_type', newVal);
  }

  /**
   * Manejador al cambiar el input del precio en USD.
   * Si la conversión a ARS está activa y hay una tasa válida, autocalcula ARS.
   */
  protected onPriceUsdChanged(usdValue: number | null) {
    const numericVal = usdValue !== null ? Number(usdValue) : null;
    this.priceUsd.set(numericVal);

    const updated = { ...this._carData };
    updated.price_usd = numericVal;

    // Calcular ARS automáticamente si aplica
    if (this.isCurrencyActive('ARS') && numericVal !== null) {
      const rate = this.settings()?.ars_rate || 0;
      if (rate > 0) {
        const calculatedArs = Math.round(numericVal * Number(rate));
        this.priceArs.set(calculatedArs);
        updated.price_ars = calculatedArs;
      }
    } else if (numericVal === null) {
      this.priceArs.set(null);
      updated.price_ars = null;
    }

    this._carData = updated;
    this.carDataChange.emit(updated);
  }

  /**
   * Manejador al cambiar manualmente el precio en ARS.
   */
  protected onPriceArsChanged(arsValue: number | null) {
    const numericVal = arsValue !== null ? Number(arsValue) : null;
    this.priceArs.set(numericVal);

    const updated = { ...this._carData };
    updated.price_ars = numericVal;

    // Calcular USD automáticamente si aplica
    if (this.isCurrencyActive('USD') && numericVal !== null) {
      const rate = this.settings()?.ars_rate || 0;
      if (rate > 0) {
        const calculatedUsd = Math.round(numericVal / Number(rate));
        this.priceUsd.set(calculatedUsd);
        updated.price_usd = calculatedUsd;
      }
    } else if (numericVal === null) {
      this.priceUsd.set(null);
      updated.price_usd = null;
    }

    this._carData = updated;
    this.carDataChange.emit(updated);
  }

  /**
   * Verifica la validez del campo activo antes de permitir avanzar.
   */
  protected isCurrentQuestionValid(): boolean {
    const q = this.currentQuestion();
    if (!q) return false;

    if (q.field === 'price') {
      if (this.priceCurrency() === 'USD') {
        return this.priceUsd() !== null && this.priceUsd()! > 0;
      } else {
        return this.priceArs() !== null && this.priceArs()! > 0;
      }
    }

    const val = this.getFieldValue(q.field);
    if (val === null || val === undefined || val === '') {
      return false;
    }

    if (q.field === 'year') {
      const num = Number(val);
      return num >= 1900 && num <= 2030;
    }

    if (q.field === 'kilometers') {
      const num = Number(val);
      return num >= 0;
    }

    return true;
  }

  protected isLastQuestion(): boolean {
    return this.currentIndex() === this.activeQuestions.length - 1;
  }

  protected goBack() {
    const idx = this.currentIndex();
    if (idx === 0) {
      this.back.emit(); // Vuelve al paso 2 (Análisis)
    } else {
      this.currentIndex.set(idx - 1);
    }
  }

  protected goNext() {
    if (!this.isCurrentQuestionValid()) return;

    if (this.isLastQuestion()) {
      this.next.emit(); // Avanza al paso 4 (Revisión)
    } else {
      this.currentIndex.set(this.currentIndex() + 1);
    }
  }
}
