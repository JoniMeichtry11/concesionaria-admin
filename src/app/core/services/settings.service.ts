import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Database } from '../models/supabase.types';

export type Settings = Database['public']['Tables']['settings']['Row'];

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private supabaseService = inject(SupabaseService);
  
  /** Señal con los ajustes cargados */
  readonly settings = signal<Settings | null>(null);
  
  /** Estado de carga */
  readonly isLoading = signal<boolean>(false);

  /**
   * Carga los ajustes de la concesionaria.
   * Si ya están cargados, los devuelve del caché.
   * Utiliza valores por defecto si la base de datos está vacía o ocurre un error.
   */
  async loadSettings(): Promise<Settings | null> {
    if (this.settings()) {
      return this.settings();
    }
    
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('settings')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        this.settings.set(data[0]);
        return data[0];
      }
      
      // Fallback robusto por si la tabla está vacía
      const fallback: Settings = {
        id: '00000000-0000-0000-0000-000000000000',
        concesionaria_name: 'Mi Concesionaria',
        logo_url: null,
        whatsapp_number: '5491112345678',
        currencies: ['USD', 'ARS'],
        ars_rate: 1000,
      };
      this.settings.set(fallback);
      return fallback;
    } catch (err: unknown) {
      console.error('Error al cargar settings en el servicio:', err);
      // Fallback por error de red / base de datos
      const fallback: Settings = {
        id: '00000000-0000-0000-0000-000000000000',
        concesionaria_name: 'Mi Concesionaria',
        logo_url: null,
        whatsapp_number: '5491112345678',
        currencies: ['USD', 'ARS'],
        ars_rate: 1000,
      };
      this.settings.set(fallback);
      return fallback;
    } finally {
      this.isLoading.set(false);
    }
  }
}
