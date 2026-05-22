import { Injectable, inject } from '@angular/core';
import { PhotoService } from './photo.service';
import { GeminiCarAnalysis } from '../models/gemini.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private photoService = inject(PhotoService);

  private readonly prompt = `Eres un asistente especializado en identificar autos. 
Analiza las imágenes proporcionadas de un vehículo y extrae la siguiente información. 
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con esta estructura exacta:

{
  "brand": "string o null",
  "model": "string o null",
  "year": number o null,
  "color": "string o null",
  "fuel_type": "nafta|diesel|gnc|hibrido|electrico o null",
  "transmission": "manual|automatica o null",
  "confidence": {
    "brand": "high|medium|low",
    "model": "high|medium|low",
    "year": "high|medium|low",
    "color": "high|medium|low",
    "fuel_type": "high|medium|low",
    "transmission": "high|medium|low"
  },
  "description": "string con descripción comercial del auto en español, 2-3 oraciones"
}

Si no puedes determinar un campo con certeza, devuelve null para ese campo.`;

  /**
   * Comprime las imágenes de los archivos, las convierte a Base64
   * y llama a Gemini Flash para analizarlas y devolver un análisis estructurado.
   */
  async analyzeCarPhotos(files: File[]): Promise<GeminiCarAnalysis> {
    if (files.length === 0) {
      throw new Error('Debés seleccionar al menos una foto.');
    }

    try {
      // 1. Comprimir todas las fotos antes de enviarlas
      const compressedBlobs = await Promise.all(
        files.map((file) => this.photoService.compressImage(file))
      );

      // 2. Convertir los Blobs comprimidos a Base64 para cargarlos en el payload
      const base64Images = await Promise.all(
        compressedBlobs.map((blob) => this.blobToBase64(blob))
      );

      // 3. Generar la estructura de partes para la API de Gemini
      const parts: any[] = [
        { text: this.prompt },
        ...base64Images.map((base64) => ({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64,
          },
        })),
      ];

      const requestBody = {
        contents: [
          {
            parts,
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      };

      // 4. Realizar la petición Fetch a la API de Gemini
      const apiKey = environment.geminiApiKey;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en la respuesta de Gemini (${response.status}): ${errorText}`);
      }

      const resData = await response.json();
      const textResponse = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('La respuesta de la IA no contenía texto en el formato esperado.');
      }

      // 5. Parsear el resultado en formato JSON estructurado
      const parsedData = JSON.parse(textResponse) as GeminiCarAnalysis;

      // Asegurar que el objeto cuente con todas las propiedades necesarias
      return this.fillMissingFields(parsedData);

    } catch (err: unknown) {
      console.error('Error al analizar fotos con Gemini:', err);
      // Fallback robusto para no interrumpir el flujo del usuario si la IA falla
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Convierte un Blob o File en un string base64 limpio (sin prefijo de data URL)
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const result = reader.result as string;
        // Quitar el prefijo del data URL ("data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Rellena campos faltantes del análisis con valores nulos o por defecto para evitar errores de tipeado.
   */
  private fillMissingFields(data: Partial<GeminiCarAnalysis>): GeminiCarAnalysis {
    const confidence = data.confidence;
    return {
      brand: data.brand ?? null,
      model: data.model ?? null,
      year: data.year ?? null,
      color: data.color ?? null,
      fuel_type: data.fuel_type ?? null,
      transmission: data.transmission ?? null,
      confidence: {
        brand: confidence?.brand ?? 'low',
        model: confidence?.model ?? 'low',
        year: confidence?.year ?? 'low',
        color: confidence?.color ?? 'low',
        fuel_type: confidence?.fuel_type ?? 'low',
        transmission: confidence?.transmission ?? 'low',
      },
      description: data.description || 'Descripción comercial no disponible.',
    };
  }

  /**
   * Genera un objeto de análisis de fallback si ocurre un error catastrófico.
   */
  private getFallbackAnalysis(): GeminiCarAnalysis {
    return {
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
      description: 'El análisis automático falló o la imagen es ilegible. Podés completar los datos de forma manual.',
    };
  }
}
