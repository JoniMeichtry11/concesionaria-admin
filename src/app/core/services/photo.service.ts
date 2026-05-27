import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private supabaseService = inject(SupabaseService);

  /**
   * Comprime una foto usando Canvas API a máximo 1280px en su lado más largo
   * y calidad JPEG de 0.8. Target ~400KB por foto.
   */
  async compressImage(file: File): Promise<Blob> {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const MAX = 1280;
      
      // Calcular ratio de compresión
      const ratio = Math.min(MAX / bitmap.width, MAX / bitmap.height, 1);
      canvas.width = bitmap.width * ratio;
      canvas.height = bitmap.height * ratio;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto 2D del Canvas.');
      }
      
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('El Canvas no pudo generar el Blob JPEG.'));
            }
          },
          'image/jpeg',
          0.8
        );
      });
    } catch (err: unknown) {
      console.error('Error al comprimir imagen:', err);
      // Fallback: retornar el archivo original si falla la Canvas API (ej. en navegadores muy antiguos)
      return file;
    }
  }

  /**
   * Sube múltiples blobs de fotos a Supabase Storage en el bucket 'car-photos'.
   * Path: {carId}/{timestamp}_{index}.jpg
   * Devuelve un array con las URLs públicas de las imágenes.
   */
  async uploadPhotos(carId: string, blobs: Blob[]): Promise<string[]> {
    const urls: string[] = [];
    const timestamp = Date.now();
    const bucketName = 'car-photos';

    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      const path = `${carId}/${timestamp}_${i}.jpg`;

      // Subir el archivo
      const { error } = await this.supabaseService.client.storage
        .from(bucketName)
        .upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error(`Error al subir la foto ${i}:`, error);
        throw new Error(`No se pudo subir la foto ${i + 1}. Detalle: ${error.message}`);
      }

      // Obtener URL pública
      const { data } = this.supabaseService.client.storage
        .from(bucketName)
        .getPublicUrl(path);

      if (data?.publicUrl) {
        urls.push(data.publicUrl);
      } else {
        throw new Error(`No se pudo obtener la URL pública de la foto ${i + 1}.`);
      }
    }

    return urls;
  }

  /**
   * Elimina todas las fotos asociadas a un auto del Storage.
   */
  async deleteCarPhotos(carId: string): Promise<void> {
    const bucketName = 'car-photos';
    
    try {
      // 1. Listar archivos en la carpeta del auto
      const { data: files, error: listError } = await this.supabaseService.client.storage
        .from(bucketName)
        .list(carId);

      if (listError) {
        throw new Error(`Error al listar fotos para borrar: ${listError.message}`);
      }

      if (!files || files.length === 0) {
        return; // No hay fotos para borrar
      }

      // 2. Armar las rutas para eliminar
      const pathsToDelete = files.map(f => `${carId}/${f.name}`);

      // 3. Eliminar archivos
      const { error: removeError } = await this.supabaseService.client.storage
        .from(bucketName)
        .remove(pathsToDelete);

      if (removeError) {
        throw new Error(`Error al borrar archivos del storage: ${removeError.message}`);
      }
    } catch (err: unknown) {
      console.error('Error en deleteCarPhotos:', err);
      throw err;
    }
  }
}
