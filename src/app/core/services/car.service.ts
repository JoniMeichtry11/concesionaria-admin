import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { PhotoService } from './photo.service';
import { Car, CarWithCover, CarStatus } from '../models/car.model';
import { Database } from '../models/supabase.types';
import { environment } from '../../../environments/environment';

type CarRow = Database['public']['Tables']['cars']['Row'];
type CarUpdate = Database['public']['Tables']['cars']['Update'];
type PhotoRow = Database['public']['Tables']['car_photos']['Row'];

@Injectable({
  providedIn: 'root',
})
export class CarService {
  private supabaseService = inject(SupabaseService);
  private photoService = inject(PhotoService);

  /** Lista completa de autos con su foto de portada */
  readonly cars = signal<CarWithCover[]>([]);

  /** Término de búsqueda actual */
  readonly searchQuery = signal<string>('');

  /** Filtro de estado actual */
  readonly statusFilter = signal<CarStatus | 'todos'>('todos');

  /** Estado de carga */
  readonly isLoading = signal<boolean>(false);

  /** Error de la última operación */
  readonly error = signal<string | null>(null);

  /** Autos filtrados por búsqueda y estado */
  readonly filteredCars = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    let results = this.cars();

    // Filtrar por estado
    if (status !== 'todos') {
      results = results.filter((car) => car.status === status);
    }

    // Filtrar por búsqueda (marca o modelo)
    if (query) {
      results = results.filter(
        (car) =>
          car.brand.toLowerCase().includes(query) ||
          car.model.toLowerCase().includes(query) ||
          car.year.toString().includes(query)
      );
    }

    return results;
  });

  /**
   * Carga todos los autos con sus fotos de portada (order = 0).
   * Ordena por fecha de creación descendente.
   */
  async getCars(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Traer todos los autos (autenticado ve todos los estados)
      const { data: carsData, error: carsError } = await this.supabaseService.client
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<CarRow[]>();

      if (carsError) throw carsError;

      // Traer fotos de portada (order = 0) de todos los autos
      const { data: photosData, error: photosError } = await this.supabaseService.client
        .from('car_photos')
        .select('car_id, url')
        .eq('order', 0)
        .returns<Pick<PhotoRow, 'car_id' | 'url'>[]>();

      if (photosError) throw photosError;

      // Crear un mapa de car_id → coverUrl
      const coverMap = new Map<string, string>();
      if (photosData) {
        for (const photo of photosData) {
          coverMap.set(photo.car_id, photo.url);
        }
      }

      // Combinar autos con sus fotos de portada
      const carsWithCovers: CarWithCover[] = (carsData || []).map((car) => ({
        ...car,
        coverUrl: coverMap.get(car.id) || null,
      }));

      this.cars.set(carsWithCovers);
    } catch (err: unknown) {
      console.error('Error al cargar autos:', err);
      this.error.set('No se pudieron cargar los autos. Intentá de nuevo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Crea un nuevo auto, sube sus fotos a Supabase Storage,
   * y guarda los registros correspondientes en la tabla car_photos.
   */
  async createCar(
    carData: Partial<Car>,
    photos: { blob: Blob }[],
    status: CarStatus,
    onProgress?: (step: 'saving_car' | 'uploading_photos' | 'saving_photos' | 'done') => void
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (onProgress) onProgress('saving_car');
      
      // 1. Insertar el registro del auto en la tabla 'cars'
      const newCar: Database['public']['Tables']['cars']['Insert'] = {
        brand: carData.brand!,
        model: carData.model!,
        year: Number(carData.year!),
        color: carData.color || null,
        fuel_type: carData.fuel_type || null,
        transmission: carData.transmission || null,
        kilometers: carData.kilometers !== null && carData.kilometers !== undefined ? Number(carData.kilometers) : null,
        price_usd: carData.price_usd !== null && carData.price_usd !== undefined ? Number(carData.price_usd) : null,
        price_ars: carData.price_ars !== null && carData.price_ars !== undefined ? Number(carData.price_ars) : null,
        description: carData.description || null,
        status: status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedCar, error: insertError } = await (this.supabaseService.client
        .from('cars') as any)
        .insert(newCar)
        .select()
        .single();

      if (insertError) {
        console.error('Error al insertar auto:', insertError);
        throw new Error(`Error de base de datos al crear el auto: ${insertError.message}`);
      }

      if (!insertedCar) {
        throw new Error('No se recibió la confirmación del auto creado.');
      }

      const carId = insertedCar.id;

      // 2. Subir las fotos si existen
      if (photos.length > 0) {
        if (onProgress) onProgress('uploading_photos');
        
        const photoBlobs = photos.map(p => p.blob);
        const uploadedUrls = await this.photoService.uploadPhotos(carId, photoBlobs);

        // 3. Crear registros en 'car_photos' con el orden correcto
        if (onProgress) onProgress('saving_photos');
        
        const carPhotosPayload: Database['public']['Tables']['car_photos']['Insert'][] = uploadedUrls.map((url, index) => ({
          car_id: carId,
          url: url,
          order: index,
          created_at: new Date().toISOString()
        }));

        const { error: photosInsertError } = await (this.supabaseService.client
          .from('car_photos') as any)
          .insert(carPhotosPayload);

        if (photosInsertError) {
          console.error('Error al insertar fotos del auto:', photosInsertError);
          throw new Error(`Error al vincular las fotos con el auto: ${photosInsertError.message}`);
        }
      }

      // 4. Actualizar localmente la lista de autos
      await this.getCars();
      if (onProgress) onProgress('done');

    } catch (err: any) {
      console.error('Error en createCar:', err);
      const errMsg = err.message || 'No se pudo guardar el auto. Intentá de nuevo.';
      this.error.set(errMsg);
      throw new Error(errMsg);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Busca autos por marca o modelo en tiempo real.
   * Actualiza el signal de búsqueda, el filtrado es automático via computed().
   */
  searchCars(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Cambia el estado de un auto.
   */
  async updateStatus(id: string, status: CarStatus): Promise<void> {
    const updatePayload: CarUpdate = { status, updated_at: new Date().toISOString() };
    const { error } = await (this.supabaseService.client
      .from('cars') as any)
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar estado:', error);
      throw new Error('No se pudo actualizar el estado del auto.');
    }

    // Actualizar localmente
    this.cars.update((cars) =>
      cars.map((car) => (car.id === id ? { ...car, status } : car))
    );
  }

  /**
   * Edita el precio de un auto inline.
   */
  async updatePrice(id: string, priceUsd: number, priceArs?: number): Promise<void> {
    const updatePayload: CarUpdate = {
      price_usd: priceUsd,
      updated_at: new Date().toISOString(),
    };

    if (priceArs !== undefined) {
      updatePayload.price_ars = priceArs;
    }

    const { error } = await (this.supabaseService.client
      .from('cars') as any)
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar precio:', error);
      throw new Error('No se pudo actualizar el precio del auto.');
    }

    // Actualizar localmente
    this.cars.update((cars) =>
      cars.map((car) =>
        car.id === id
          ? { ...car, price_usd: priceUsd, price_ars: priceArs ?? car.price_ars }
          : car
      )
    );
  }

  /**
   * Genera el texto listo para compartir un auto.
   */
  getShareText(car: Car): string {
    const url = `${environment.catalogUrl}/${car.id}`;
    return `Hola! Te comparto este ${car.brand} ${car.model} ${car.year}: ${url}`;
  }

  /**
   * Comparte un auto usando Web Share API con fallback a clipboard.
   * Devuelve true si se compartió exitosamente.
   */
  async shareCar(car: Car): Promise<boolean> {
    const text = this.getShareText(car);

    // Intentar Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${car.brand} ${car.model} ${car.year}`,
          text,
        });
        return true;
      } catch (err: unknown) {
        // El usuario canceló el share o hubo un error
        if (err instanceof Error && err.name === 'AbortError') {
          return false;
        }
        // Fallback a clipboard si falla el share
      }
    }

    // Fallback: copiar al clipboard
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      console.error('No se pudo copiar al clipboard');
      return false;
    }
  }
}
