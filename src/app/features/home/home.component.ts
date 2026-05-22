import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarService } from '../../core/services/car.service';
import { CarWithCover, CarStatus } from '../../core/models/car.model';

/** Filtros de estado disponibles para los chips */
interface StatusChip {
  label: string;
  value: CarStatus | 'todos';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private router = inject(Router);
  protected carService = inject(CarService);

  /** Texto del buscador (bindeado con ngModel) */
  protected searchText = signal('');

  /** Mensaje de feedback del clipboard */
  protected clipboardMsg = signal<string | null>(null);

  /** Chips de filtro por estado */
  protected readonly statusChips: StatusChip[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Disponibles', value: 'disponible' },
    { label: 'Reservados', value: 'reservado' },
    { label: 'Pausados', value: 'pausado' },
  ];

  constructor() {
    // Cargar autos al inicializar el componente
    this.carService.getCars();
  }

  /** Callback del buscador — actualiza el filtro en tiempo real */
  onSearch(query: string): void {
    this.searchText.set(query);
    this.carService.searchCars(query);
  }

  /** Cambia el filtro de estado activo */
  onStatusFilter(status: CarStatus | 'todos'): void {
    this.carService.statusFilter.set(status);
  }

  /** Navega a la ficha de un auto */
  goToCarDetail(id: string): void {
    this.router.navigate(['/cars', id]);
  }

  /** Navega a la carga de un auto nuevo */
  goToUpload(): void {
    this.router.navigate(['/cars', 'upload']);
  }

  /** Comparte un auto, muestra feedback si se copió al clipboard */
  async onShare(event: Event, car: CarWithCover): Promise<void> {
    event.stopPropagation();
    const shared = await this.carService.shareCar(car);
    if (shared && !navigator.share) {
      this.clipboardMsg.set('Enlace copiado al portapapeles');
      setTimeout(() => this.clipboardMsg.set(null), 2500);
    }
  }

  /** Formatea el precio para mostrar en la lista */
  formatPrice(price: number | null): string {
    if (price === null || price === undefined) return 'Sin precio';
    return 'USD ' + price.toLocaleString('es-AR', { minimumFractionDigits: 0 });
  }

  /** Devuelve las clases CSS del badge de estado según ui-rules */
  getStatusClasses(status: CarStatus): string {
    const map: Record<CarStatus, string> = {
      disponible: 'bg-green-100 text-green-800',
      reservado: 'bg-yellow-100 text-yellow-800',
      pausado: 'bg-gray-100 text-gray-700',
      borrador: 'bg-blue-100 text-blue-800',
      vendido: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }

  /** Devuelve el texto amigable del estado */
  getStatusLabel(status: CarStatus): string {
    const map: Record<CarStatus, string> = {
      disponible: 'Disponible',
      reservado: 'Reservado',
      pausado: 'Pausado',
      borrador: 'Borrador',
      vendido: 'Vendido',
    };
    return map[status] || status;
  }
}
