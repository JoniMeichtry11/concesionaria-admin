import { Component, Input, Output, EventEmitter, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoItem } from '../car-upload.component';
import { PhotoService } from '../../../../core/services/photo.service';

@Component({
  selector: 'app-step-photos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col gap-6 animate-fade-in">
      
      <!-- Título de sección -->
      <div>
        <h2 class="text-xl font-black text-slate-800">Seleccioná las Fotos</h2>
        <p class="text-sm text-slate-500 mt-1">Cargá entre 1 y 15 fotos de buena calidad. La primera será la portada de la publicación.</p>
      </div>

      <!-- Botones de Acción para Seleccionar Fotos -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Botón Sacar Foto (Cámara) -->
        <button
          (click)="triggerCamera()"
          [disabled]="isCompressing() || photos().length >= 15"
          type="button"
          class="h-14 flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:active:scale-100 font-semibold text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          Sacar Foto
        </button>

        <!-- Botón Subir Galería -->
        <button
          (click)="triggerGallery()"
          [disabled]="isCompressing() || photos().length >= 15"
          type="button"
          class="h-14 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:active:scale-100 font-semibold text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          Subir Galería
        </button>
      </div>

      <!-- Inputs Ocultos -->
      <input
        #cameraInput
        (change)="onFilesSelected($event)"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
      />
      <input
        #galleryInput
        (change)="onFilesSelected($event)"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
      />

      <!-- Loader de procesamiento / compresión -->
      @if (isCompressing()) {
        <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 text-indigo-800 animate-pulse">
          <div class="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-semibold">Comprimiendo y optimizando imágenes...</span>
        </div>
      }

      <!-- Grilla de Previsualizaciones -->
      @if (photos().length > 0) {
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>{{ photos().length }} {{ photos().length === 1 ? 'foto cargada' : 'fotos cargadas' }} (máx. 15)</span>
            <span class="hidden sm:inline">Arrastrá para reordenar</span>
            <span class="sm:hidden">Tocá para reordenar</span>
          </div>

          <div class="grid grid-cols-3 gap-3">
            @for (photo of photos(); track photo.url; let i = $index) {
              <div
                [draggable]="true"
                (dragstart)="onDragStart($event, i)"
                (dragover)="onDragOver($event)"
                (drop)="onDrop($event, i)"
                (dragend)="onDragEnd()"
                (click)="onPhotoTap(i)"
                [class.ring-4]="selectedSwapIndex() === i"
                [class.ring-indigo-500]="selectedSwapIndex() === i"
                class="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer group active:scale-95 transition-all duration-150 bg-slate-100 touch-manipulation">
                
                <!-- Imagen -->
                <img
                  [src]="photo.url"
                  alt="Previsualización de auto"
                  class="w-full h-full object-cover pointer-events-none"
                />

                <!-- Numeración de Orden -->
                <div class="absolute bottom-2 left-2 w-6 h-6 bg-slate-900/60 backdrop-blur-xs text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {{ i + 1 }}
                </div>

                <!-- Badge de Portada -->
                @if (i === 0) {
                  <div class="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-wider shadow-sm uppercase">
                    Portada
                  </div>
                }

                <!-- Botón de Eliminar (X) -->
                <button
                  (click)="removePhoto(i, $event)"
                  type="button"
                  class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md active:scale-90 transition-all z-10"
                  aria-label="Eliminar foto">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            }
          </div>

          <!-- Mensaje orientativo de Tap-to-Swap en Mobile -->
          @if (selectedSwapIndex() !== null) {
            <p class="text-[11px] text-indigo-600 font-semibold animate-pulse text-center mt-2 bg-indigo-50/50 py-1.5 px-3 rounded-lg border border-indigo-100">
              👉 Tocá otra foto para intercambiar posiciones.
            </p>
          }
        </div>
      } @else {
        <!-- Estado Vacío -->
        <div class="border-2 border-dashed border-slate-200 rounded-3xl py-12 px-4 flex flex-col items-center justify-center text-center gap-3 bg-slate-50/50">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-700">No hay fotos cargadas</h3>
            <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Sacá fotos con la cámara o cargalas desde la galería para empezar.</p>
          </div>
        </div>
      }

      <!-- Botón de Siguiente Paso -->
      <button
        (click)="submit()"
        [disabled]="photos().length === 0 || isCompressing()"
        type="button"
        class="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg active:scale-98 transition-all duration-150 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 21l8.982-8.979M21 3h-6.018L3 18.018V21h2.982L21 5.982V3Z" />
        </svg>
        Analizar con IA
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
export class StepPhotosComponent {
  private photoService = inject(PhotoService);

  @Input() set initialPhotos(val: PhotoItem[]) {
    this.photos.set(val);
  }

  @Output() photosChange = new EventEmitter<PhotoItem[]>();
  @Output() next = new EventEmitter<void>();

  // Inputs nativos referenciados
  cameraInput!: HTMLInputElement;
  galleryInput!: HTMLInputElement;

  /** Signal local que guarda las fotos */
  readonly photos = signal<PhotoItem[]>([]);

  /** Signal que rastrea el estado de compresión */
  readonly isCompressing = signal<boolean>(false);

  /** Signal de índice seleccionado para Swap (Mobile Tap-to-Swap) */
  readonly selectedSwapIndex = signal<number | null>(null);

  /** Variables temporales de drag & drop */
  private draggedIndex: number | null = null;

  // Enlazar los inputs del DOM mediante vanilla query selection en el constructor/init
  constructor() {
    // Escucha cambios del estado local para sincronizar con el contenedor padre
    effect(() => {
      // Evitar bucle infinito limitando la propagación
    });
  }

  triggerCamera() {
    const el = document.querySelector('input[capture="environment"]') as HTMLInputElement;
    if (el) el.click();
  }

  triggerGallery() {
    const el = document.querySelector('input[multiple]') as HTMLInputElement;
    if (el) el.click();
  }

  /**
   * Manejador de selección de archivos.
   * Procesa cada imagen, la comprime en el acto usando Canvas API y genera el Object URL de previsualización.
   */
  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.isCompressing.set(true);

    try {
      const files = Array.from(input.files);
      const remainingSlots = 15 - this.photos().length;
      
      if (files.length > remainingSlots) {
        alert(`Solo podés cargar hasta 15 fotos en total. Se omitieron las excedentes.`);
      }

      const filesToProcess = files.slice(0, remainingSlots);

      const compressedItems: PhotoItem[] = [];
      for (const file of filesToProcess) {
        // Compresión Canvas nativa a target ~400KB / 1280px max
        const compressedBlob = await this.photoService.compressImage(file);
        const url = URL.createObjectURL(compressedBlob);
        
        // Mantener también el nombre/metadatos convirtiéndolo en un objeto tipo File
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        compressedItems.push({
          file: compressedFile,
          blob: compressedBlob,
          url,
        });
      }

      const updatedPhotos = [...this.photos(), ...compressedItems];
      this.photos.set(updatedPhotos);
      this.photosChange.emit(updatedPhotos);
    } catch (err) {
      console.error('Error al procesar imágenes seleccionadas:', err);
      alert('Hubo un error al optimizar e incorporar las fotos. Intentá de nuevo.');
    } finally {
      this.isCompressing.set(false);
      // Resetear input para poder seleccionar el mismo archivo
      input.value = '';
    }
  }

  /**
   * Elimina una foto por índice, revocando su Object URL para evitar fugas de memoria.
   */
  removePhoto(index: number, event: Event) {
    event.stopPropagation(); // Previene el tap de reordenamiento
    
    const list = [...this.photos()];
    const [removed] = list.splice(index, 1);
    
    // Revocar el Object URL
    URL.revokeObjectURL(removed.url);

    this.photos.set(list);
    this.photosChange.emit(list);

    // Resetear el estado de tap si correspondía al eliminado
    if (this.selectedSwapIndex() === index) {
      this.selectedSwapIndex.set(null);
    } else if (this.selectedSwapIndex() !== null && this.selectedSwapIndex()! > index) {
      this.selectedSwapIndex.update(idx => idx !== null ? idx - 1 : null);
    }
  }

  // --- Lógica Drag & Drop (Desktop) ---

  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Indispensable para habilitar drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === index) return;
    this.swapPhotos(this.draggedIndex, index);
    this.draggedIndex = null;
  }

  onDragEnd() {
    this.draggedIndex = null;
  }

  // --- Lógica Tap-to-Swap (Mobile) ---

  onPhotoTap(index: number) {
    // Si no hay ninguno seleccionado, seleccionar este
    if (this.selectedSwapIndex() === null) {
      this.selectedSwapIndex.set(index);
    } else {
      // Si ya había seleccionado uno y es diferente, intercambiar
      const from = this.selectedSwapIndex()!;
      if (from !== index) {
        this.swapPhotos(from, index);
      }
      this.selectedSwapIndex.set(null); // Limpiar selección
    }
  }

  /**
   * Reordena el listado de fotos intercambiando dos posiciones.
   */
  private swapPhotos(from: number, to: number) {
    const list = [...this.photos()];
    const [temp] = list.splice(from, 1);
    list.splice(to, 0, temp);
    
    this.photos.set(list);
    this.photosChange.emit(list);
  }

  submit() {
    if (this.photos().length === 0) return;
    this.next.emit();
  }
}
