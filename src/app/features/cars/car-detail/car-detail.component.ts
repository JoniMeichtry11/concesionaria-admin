import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CarService } from '../../../core/services/car.service';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ToastService } from '../../../core/services/toast.service';
import { Car, CarStatus } from '../../../core/models/car.model';
import { Database } from '../../../core/models/supabase.types';

type PhotoRow = Database['public']['Tables']['car_photos']['Row'];

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- 1. Skeleton Loader cuando está cargando inicialmente y no hay datos del auto -->
    <div *ngIf="carService.isLoading() && !car()" class="min-h-screen flex flex-col bg-slate-50 pb-24 animate-pulse">
      <!-- Header Skeleton -->
      <header class="bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between shrink-0">
        <div class="w-8 h-8 rounded-full bg-slate-200"></div>
        <div class="h-5 w-32 bg-slate-200 rounded-md"></div>
        <div class="w-8 h-8 rounded-full bg-slate-200"></div>
      </header>

      <!-- Galería de Fotos Skeleton -->
      <div class="aspect-[4/3] w-full bg-slate-200 shrink-0"></div>

      <!-- Info del Auto Skeleton -->
      <div class="p-4 bg-white mb-2 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <div class="h-6 w-24 bg-slate-200 rounded-full"></div>
          <div class="h-3 w-16 bg-slate-100 rounded"></div>
        </div>
        <div class="h-6 w-3/4 bg-slate-200 rounded-md"></div>
        <div class="h-4 w-1/3 bg-slate-100 rounded"></div>
      </div>

      <!-- Ficha Técnica Skeleton -->
      <div class="bg-white px-4 py-2 shadow-xs mb-2 space-y-4 py-4">
        <div class="flex justify-between items-center py-2 border-b border-slate-100">
          <div class="h-4 w-20 bg-slate-200 rounded"></div>
          <div class="h-4 w-28 bg-slate-200 rounded"></div>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-slate-100">
          <div class="h-4 w-20 bg-slate-200 rounded"></div>
          <div class="h-4 w-28 bg-slate-200 rounded"></div>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-slate-100">
          <div class="h-4 w-16 bg-slate-200 rounded"></div>
          <div class="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- 2. Contenido Principal una vez cargados los datos -->
    <div class="min-h-screen flex flex-col bg-gray-50 pb-24" *ngIf="car()">
      <!-- Header -->
      <header class="bg-white border-b sticky top-0 z-10 px-4 h-14 flex items-center justify-between shrink-0">
        <button (click)="goBack()" class="p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-lg font-bold truncate flex-1 text-center text-slate-800">
          {{ car()?.brand }} {{ car()?.model }}
        </h1>
        <div class="flex items-center gap-2">
          <button (click)="shareCar()" class="p-2 rounded-full active:bg-indigo-50 text-indigo-600 transition-colors" title="Compartir">
            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </button>
          <button *ngIf="isAdmin()" (click)="promptDelete()" class="p-2 -mr-2 rounded-full active:bg-red-50 text-red-600 transition-colors" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Indicador lineal de guardado en segundo plano -->
      <div *ngIf="carService.isLoading()" class="h-0.5 w-full bg-indigo-100 overflow-hidden shrink-0">
        <div class="h-full bg-indigo-600 animate-pulse w-full"></div>
      </div>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto">
        
        <!-- Photo Gallery -->
        <div class="bg-black relative group">
          <!-- Main Image View -->
          <div #galleryContainer class="aspect-[4/3] w-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth" (scroll)="onGalleryScroll($event)">
            <img *ngFor="let photo of photos()" [src]="photo.url" class="w-full h-full object-cover shrink-0 snap-center" alt="Foto">
            <div *ngIf="photos().length === 0" class="w-full h-full flex shrink-0 items-center justify-center bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        <!-- Thumbnails -->
        <div class="flex gap-2 p-2 overflow-x-auto bg-gray-900 hide-scrollbar" *ngIf="photos().length > 1">
          <button *ngFor="let p of photos(); let i = index" 
                  (click)="scrollToPhoto(i)"
                  class="w-16 h-12 shrink-0 rounded overflow-hidden border-2 transition-colors focus:outline-none"
                  [ngClass]="i === currentPhotoIndex() ? 'border-indigo-500' : 'border-transparent opacity-60'">
            <img [src]="p.url" class="w-full h-full object-cover" alt="Thumbnail">
          </button>
        </div>

        <div class="p-4 bg-white mb-2 shadow-xs">
          <!-- Status Badge -->
          <div class="mb-4 flex items-center justify-between">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" [ngClass]="getStatusClasses(car()!.status)">
              {{ getStatusLabel(car()!.status) }}
            </span>
            <span class="text-xs text-gray-400 font-semibold">ID: {{ car()!.id.slice(0, 8) }}</span>
          </div>

          <!-- Status Actions -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button *ngFor="let nextStatus of availableNextStatuses()" 
                    (click)="changeStatus(nextStatus)"
                    [disabled]="carService.isLoading()"
                    class="px-3.5 py-1.5 text-xs rounded-xl border font-bold active:scale-95 transition-transform disabled:opacity-50"
                    [ngClass]="{
                      'border-indigo-200 bg-indigo-50 text-indigo-700': nextStatus !== 'vendido',
                      'border-green-200 bg-green-50 text-green-700': nextStatus === 'disponible',
                      'border-yellow-200 bg-yellow-50 text-yellow-700': nextStatus === 'reservado',
                      'border-red-200 bg-red-50 text-red-700': nextStatus === 'vendido'
                    }">
              Marcar como {{ getStatusLabel(nextStatus) }}
            </button>
          </div>

          <h2 class="text-xl font-bold text-gray-900 mb-1">{{ car()!.brand }} {{ car()!.model }}</h2>
          <p class="text-xs text-gray-500 font-semibold">{{ car()!.year }} • {{ car()!.kilometers | number }} km</p>
        </div>

        <!-- Editable Details -->
        <div class="bg-white px-4 py-2 shadow-xs mb-2">
          
          <!-- Price USD -->
          <div class="flex items-center justify-between py-3 border-b border-gray-100" *ngIf="settingsService.settings()?.currencies?.includes('USD')">
            <span class="text-sm text-gray-500 font-medium w-1/3">Precio USD</span>
            <div class="flex-1 flex justify-end">
              <input type="number" 
                     [ngModel]="car()!.price_usd" 
                     (ngModelChange)="updatePrice('USD', $event)"
                     [ngModelOptions]="{updateOn: 'blur'}"
                     [disabled]="carService.isLoading()"
                     class="text-right text-base font-extrabold text-slate-800 w-full focus:outline-none focus:ring-0 bg-transparent disabled:opacity-60"
                     placeholder="0">
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400 ml-2 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>

          <!-- Price ARS -->
          <div class="flex items-center justify-between py-3 border-b border-gray-100" *ngIf="settingsService.settings()?.currencies?.includes('ARS')">
            <span class="text-sm text-gray-500 font-medium w-1/3">Precio ARS</span>
            <div class="flex-1 flex justify-end">
              <input type="number" 
                     [ngModel]="car()!.price_ars" 
                     (ngModelChange)="updatePrice('ARS', $event)"
                     [ngModelOptions]="{updateOn: 'blur'}"
                     [disabled]="carService.isLoading()"
                     class="text-right text-base font-extrabold text-slate-800 w-full focus:outline-none focus:ring-0 bg-transparent disabled:opacity-60"
                     placeholder="0">
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400 ml-2 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>

          <!-- Color -->
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500 font-medium w-1/3">Color</span>
            <input type="text" [ngModel]="car()!.color" (ngModelChange)="updateField('color', $event)" [ngModelOptions]="{updateOn: 'blur'}" [disabled]="carService.isLoading()" class="text-right text-sm text-slate-700 font-bold w-full focus:outline-none focus:ring-0 bg-transparent disabled:opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400 ml-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>

          <!-- Año -->
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500 font-medium w-1/3">Año</span>
            <input type="number" [ngModel]="car()!.year" (ngModelChange)="updateField('year', $event)" [ngModelOptions]="{updateOn: 'blur'}" [disabled]="carService.isLoading()" class="text-right text-sm text-slate-700 font-bold w-full focus:outline-none focus:ring-0 bg-transparent disabled:opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400 ml-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>

          <!-- Kilómetros -->
          <div class="flex items-center justify-between py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500 font-medium w-1/3">Kilómetros</span>
            <input type="number" [ngModel]="car()!.kilometers" (ngModelChange)="updateField('kilometers', $event)" [ngModelOptions]="{updateOn: 'blur'}" [disabled]="carService.isLoading()" class="text-right text-sm text-slate-700 font-bold w-full focus:outline-none focus:ring-0 bg-transparent disabled:opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400 ml-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>

          <!-- Combustible -->
          <div class="flex flex-col py-3 border-b border-gray-100">
            <span class="text-sm text-gray-500 font-medium mb-3">Combustible</span>
            <div class="flex flex-wrap gap-2">
              <button *ngFor="let opt of ['Nafta', 'Diesel', 'GNC', 'Híbrido', 'Eléctrico']"
                  (click)="toggleFuelType(opt)"
                  [disabled]="carService.isLoading()"
                  [class]="'px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ' + 
                    (hasFuelType(opt) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')">
                {{ opt }}
              </button>
            </div>
          </div>

          <!-- Transmisión -->
          <div class="flex items-center justify-between py-3">
            <span class="text-sm text-gray-500 font-medium w-1/3">Transmisión</span>
            <select [ngModel]="car()!.transmission" (ngModelChange)="updateField('transmission', $event)" [disabled]="carService.isLoading()" class="text-right text-sm text-slate-700 font-bold w-full focus:outline-none focus:ring-0 bg-transparent dir-rtl appearance-none disabled:opacity-60">
              <option [ngValue]="null">Desconocido</option>
              <option value="manual">Manual</option>
              <option value="automatica">Automática</option>
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400 ml-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
        </div>

        <!-- Descripción -->
        <div class="bg-white p-4 shadow-xs mb-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm text-gray-500 font-medium">Descripción</h3>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
          <textarea [ngModel]="car()!.description" (ngModelChange)="updateField('description', $event)" [ngModelOptions]="{updateOn: 'blur'}" [disabled]="carService.isLoading()" rows="4" class="w-full text-sm text-slate-700 leading-relaxed font-semibold focus:outline-none resize-none bg-transparent disabled:opacity-60 animate-fade-in" placeholder="Sin descripción..."></textarea>
        </div>

      </main>

      <!-- Bottom fixed action -->
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-10 max-w-screen-sm mx-auto">
        <button (click)="shareCar()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold text-base active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          Compartir auto
        </button>
      </div>

      <!-- Delete Confirmation Bottom Sheet -->
      <div *ngIf="showDeleteConfirm()" class="fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-xs animate-fade-in" (click)="showDeleteConfirm.set(false)"></div>
        <div class="bg-white rounded-t-3xl p-6 relative z-10 max-w-screen-sm w-full mx-auto shadow-xl">
          <h3 class="text-xl font-bold text-gray-900 mb-2">¿Eliminar este auto?</h3>
          <p class="text-slate-500 text-sm mb-6 font-medium">Se borrarán también todas sus fotos. Esta acción no se puede deshacer.</p>
          <div class="flex gap-3">
            <button (click)="showDeleteConfirm.set(false)" class="flex-1 h-12 rounded-xl font-bold bg-slate-100 text-slate-700 active:bg-slate-200 transition-all">Cancelar</button>
            <button (click)="confirmDelete()" [disabled]="carService.isLoading()" class="flex-1 h-12 rounded-xl font-bold bg-red-600 text-white active:bg-red-700 disabled:opacity-50 transition-all">Eliminar</button>
          </div>
        </div>
      </div>

      <!-- Sold Confirmation Bottom Sheet -->
      <div *ngIf="showSoldConfirm()" class="fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-xs animate-fade-in" (click)="showSoldConfirm.set(false)"></div>
        <div class="bg-white rounded-t-3xl p-6 relative z-10 max-w-screen-sm w-full mx-auto shadow-xl">
          <h3 class="text-xl font-bold text-gray-900 mb-2">¿Marcar como vendido?</h3>
          <p class="text-slate-500 text-sm mb-6 font-medium">Esta acción lo ocultará del catálogo público permanentemente.</p>
          <div class="flex gap-3">
            <button (click)="showSoldConfirm.set(false)" class="flex-1 h-12 rounded-xl font-bold bg-slate-100 text-slate-700 active:bg-slate-200 transition-all">Cancelar</button>
            <button (click)="confirmSold()" [disabled]="carService.isLoading()" class="flex-1 h-12 rounded-xl font-bold bg-indigo-600 text-white active:bg-indigo-700 disabled:opacity-50 transition-all">Confirmar</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .dir-rtl {
      direction: rtl;
    }
  `]
})
export class CarDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public carService = inject(CarService);
  private authService = inject(AuthService);
  public settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  readonly car = signal<Car | null>(null);
  readonly photos = signal<PhotoRow[]>([]);
  readonly currentPhotoIndex = signal<number>(0);

  readonly showDeleteConfirm = signal<boolean>(false);
  readonly showSoldConfirm = signal<boolean>(false);
  
  readonly isAdmin = computed(() => this.authService.userRole() === 'admin');

  @ViewChild('galleryContainer') galleryContainer?: ElementRef<HTMLDivElement>;

  ngOnInit() {
    this.settingsService.loadSettings();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCar(id);
    }
  }

  async loadCar(id: string) {
    const result = await this.carService.getCarById(id);
    if (result) {
      this.car.set(result.car);
      this.photos.set(result.photos);
    } else {
      this.router.navigate(['/']);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  onGalleryScroll(event: any) {
    const el = event.target;
    const scrollPos = el.scrollLeft;
    const width = el.clientWidth;
    const index = Math.round(scrollPos / width);
    this.currentPhotoIndex.set(index);
  }

  scrollToPhoto(index: number) {
    if (this.galleryContainer) {
      const el = this.galleryContainer.nativeElement;
      el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' });
    }
    this.currentPhotoIndex.set(index);
  }

  getStatusClasses(status: string): string {
    switch(status) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'reservado': return 'bg-yellow-100 text-yellow-800';
      case 'pausado': return 'bg-gray-100 text-gray-700';
      case 'borrador': return 'bg-blue-100 text-blue-800';
      case 'vendido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'disponible': return 'Disponible';
      case 'reservado': return 'Reservado';
      case 'pausado': return 'Pausado';
      case 'borrador': return 'Borrador';
      case 'vendido': return 'Vendido';
      default: return status;
    }
  }

  availableNextStatuses(): CarStatus[] {
    const current = this.car()?.status;
    if (!current) return [];
    
    switch(current) {
      case 'disponible': return ['reservado', 'pausado', 'vendido'];
      case 'reservado': return ['disponible', 'vendido'];
      case 'pausado': return ['disponible'];
      case 'borrador': return ['disponible']; // Publicar
      case 'vendido': return [];
    }
    return [];
  }

  changeStatus(nextStatus: CarStatus) {
    if (nextStatus === 'vendido') {
      this.showSoldConfirm.set(true);
    } else {
      this.doUpdateStatus(nextStatus);
    }
  }

  async confirmSold() {
    await this.doUpdateStatus('vendido');
    this.showSoldConfirm.set(false);
  }

  private async doUpdateStatus(status: CarStatus) {
    const c = this.car();
    if (c) {
      try {
        await this.carService.updateStatus(c.id, status);
        this.car.set({ ...c, status });
        this.toastService.show('Estado actualizado');
      } catch (e) {
        this.toastService.show('Error de conexión. Intentá de nuevo.', 'error');
      }
    }
  }

  async updateField(field: keyof Car, value: any) {
    const c = this.car();
    if (c && c[field] !== value) {
      try {
        await this.carService.updateCar(c.id, { [field]: value });
        this.car.set({ ...c, [field]: value });
        this.toastService.show('Cambios guardados');
      } catch (e) {
        this.toastService.show('Error de conexión. Intentá de nuevo.', 'error');
      }
    }
  }

  async updatePrice(currency: 'USD' | 'ARS', valStr: string) {
    const c = this.car();
    if (!c) return;
    const value = parseFloat(valStr) || null;

    let priceUsd = c.price_usd;
    let priceArs = c.price_ars;
    const rate = this.settingsService.settings()?.ars_rate || 1000;

    if (currency === 'USD') {
      priceUsd = value;
      // Auto-recalculate ARS if settings has ARS active
      if (this.settingsService.settings()?.currencies?.includes('ARS') && value !== null) {
        priceArs = value * rate;
      }
    } else {
      priceArs = value;
    }

    try {
      await this.carService.updatePrice(c.id, priceUsd || 0, priceArs || undefined);
      this.car.set({ ...c, price_usd: priceUsd, price_ars: priceArs });
      this.toastService.show('Precio actualizado');
    } catch (e) {
      this.toastService.show('Error de conexión. Intentá de nuevo.', 'error');
    }
  }

  hasFuelType(opt: string): boolean {
    const c = this.car();
    if (!c || !c.fuel_type) return false;
    const dbVal = this.mapFuelOption(opt);
    return c.fuel_type.includes(dbVal);
  }

  toggleFuelType(opt: string) {
    const c = this.car();
    if (!c) return;
    const dbVal = this.mapFuelOption(opt);
    let parts: string[] = Array.isArray(c.fuel_type) ? [...c.fuel_type] : [];
    
    if (parts.includes(dbVal)) {
      parts = parts.filter(p => p !== dbVal);
    } else {
      parts.push(dbVal);
    }
    
    const newVal = parts.length > 0 ? parts : null;
    this.updateField('fuel_type', newVal);
  }

  private mapFuelOption(opt: string): string {
    const map: Record<string, string> = {
      'Nafta': 'nafta',
      'Diesel': 'diesel',
      'GNC': 'gnc',
      'Híbrido': 'hibrido',
      'Eléctrico': 'electrico',
    };
    return map[opt] || opt.toLowerCase();
  }

  promptDelete() {
    this.showDeleteConfirm.set(true);
  }

  async confirmDelete() {
    const c = this.car();
    if (c) {
      try {
        await this.carService.deleteCar(c.id);
        this.showDeleteConfirm.set(false);
        this.toastService.show('Auto eliminado');
        this.router.navigate(['/']);
      } catch (e) {
        this.toastService.show('Error de conexión. Intentá de nuevo.', 'error');
      }
    }
  }

  async shareCar() {
    const c = this.car();
    if (c) {
      await this.carService.shareCar(c);
    }
  }
}
