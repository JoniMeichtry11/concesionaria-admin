import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { PhotoService } from './photo.service';
import { Database } from '../models/supabase.types';

export type Settings = Database['public']['Tables']['settings']['Row'];

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private supabaseService = inject(SupabaseService);
  private photoService = inject(PhotoService);
  
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
        ars_rate_updated_at: null,
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
        ars_rate_updated_at: null,
      };
      this.settings.set(fallback);
      return fallback;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Guarda cambios en los ajustes de Supabase.
   */
  async updateSettings(data: Partial<Settings>): Promise<void> {
    const current = this.settings();
    if (!current) throw new Error('Los ajustes no están cargados.');

    this.isLoading.set(true);
    try {
      const { data: updatedData, error } = await (this.supabaseService.client
        .from('settings') as any)
        .update(data)
        .eq('id', current.id)
        .select();

      if (error) throw error;

      if (updatedData && updatedData.length > 0) {
        this.settings.set(updatedData[0]);
      }
    } catch (err: unknown) {
      console.error('Error al actualizar settings:', err);
      throw new Error('No se pudieron guardar los ajustes.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Comprime y sube un logo al bucket 'logos' en Supabase Storage,
   * luego actualiza la columna logo_url en settings.
   */
  async uploadLogo(file: File): Promise<string> {
    const current = this.settings();
    if (!current) throw new Error('Los ajustes no están cargados.');

    this.isLoading.set(true);
    try {
      // 1. Comprimir imagen usando PhotoService
      const compressedBlob = await this.photoService.compressImage(file);

      // 2. Subir el archivo al bucket 'logos'
      const timestamp = Date.now();
      const path = `logo_${current.id}_${timestamp}.jpg`;
      const bucketName = 'logos';

      const { error: uploadError } = await this.supabaseService.client.storage
        .from(bucketName)
        .upload(path, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Obtener URL pública
      const { data } = this.supabaseService.client.storage
        .from(bucketName)
        .getPublicUrl(path);

      if (!data?.publicUrl) {
        throw new Error('No se pudo obtener la URL pública del logo.');
      }

      const logoUrl = data.publicUrl;

      // 4. Actualizar logo_url en la tabla settings
      await this.updateSettings({ logo_url: logoUrl });

      return logoUrl;
    } catch (err: unknown) {
      console.error('Error al subir e integrar el logo:', err);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }
}
