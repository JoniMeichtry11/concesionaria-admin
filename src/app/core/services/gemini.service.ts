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

    const apiKey = environment.geminiApiKey;
    if (!apiKey || apiKey === '' || apiKey.includes('placeholder') || apiKey === 'YOUR_API_KEY') {
      throw new Error('Gemini API key no configurada. Completá environment.geminiApiKey');
    }

    // 1. Comprimir todas las fotos antes de enviarlas
    let compressedBlobs: Blob[];
    try {
      compressedBlobs = await Promise.all(
        files.map((file) => this.photoService.compressImage(file))
      );
    } catch (err: any) {
      throw new Error('Ocurrió un error al comprimir las fotos antes de enviarlas a la IA: ' + err.message);
    }

    // 2. Convertir los Blobs comprimidos a Base64
    let base64Images: string[];
    try {
      base64Images = await Promise.all(
        compressedBlobs.map((blob) => this.blobToBase64(blob))
      );
    } catch (err: any) {
      throw new Error('Ocurrió un error al convertir las fotos para enviarlas a la IA: ' + err.message);
    }

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

    console.log('Enviando request a Gemini:', JSON.stringify({ ...requestBody, contents: '... (omitted base64 images)' }, null, 2));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (err: any) {
      throw new Error(`Error de red al conectar con Gemini: ${err.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Respuesta de error de Gemini:', errorText);
      throw new Error(this.parseFriendlyError(response.status, errorText));
    }

    const resData = await response.json();
    console.log('Respuesta completa de Gemini:', JSON.stringify(resData, null, 2));

    const textResponse = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('La respuesta de la IA no contenía texto en el formato esperado.');
    }

    // 5. Parsear el resultado en formato JSON estructurado
    let parsedData: Partial<GeminiCarAnalysis>;
    try {
      parsedData = JSON.parse(textResponse);
    } catch (err: any) {
      throw new Error('No se pudo interpretar el formato JSON devuelto por Gemini: ' + err.message);
    }

    // Asegurar que el objeto cuente con todas las propiedades necesarias
    return this.fillMissingFields(parsedData);
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
   * Interpreta la respuesta de error de la API de Gemini y devuelve un mensaje
   * amigable en español acorde al tipo de error recibido.
   */
  private parseFriendlyError(httpStatus: number, rawBody: string): string {
    let errorStatus: string | undefined;
    let errorMessage: string | undefined;

    try {
      const parsed = JSON.parse(rawBody);
      errorStatus = parsed?.error?.status;
      errorMessage = parsed?.error?.message;
    } catch {
      // Si el cuerpo no es JSON, usamos el status HTTP directamente
    }

    // Cuota / rate limit agotada
    if (httpStatus === 429 || errorStatus === 'RESOURCE_EXHAUSTED') {
      const retryMatch = errorMessage?.match(/retry in ([\d.]+)s/i);
      const retrySuffix = retryMatch
        ? ` Podés intentarlo de nuevo en aproximadamente ${Math.ceil(Number(retryMatch[1]))} segundos.`
        : ' Esperá unos momentos e intentá de nuevo.';
      return (
        'Se agotó la cuota de la API de Gemini. Esto ocurre cuando se supera el límite de ' +
        'solicitudes o tokens del plan gratuito.' +
        retrySuffix
      );
    }

    // Parámetros inválidos
    if (httpStatus === 400 && errorStatus === 'INVALID_ARGUMENT') {
      return 'La solicitud enviada a la IA tiene un formato incorrecto o un parámetro inválido. Revisá la configuración de la API.';
    }

    // API key inválida o faltante
    if (httpStatus === 401 || errorStatus === 'UNAUTHENTICATED') {
      return 'La API key de Gemini no es válida o no está autorizada. Verificá que la clave sea correcta.';
    }

    // Permisos denegados
    if (httpStatus === 403 || errorStatus === 'PERMISSION_DENIED') {
      return 'No tenés permisos para usar este modelo de Gemini o la API key tiene restricciones. Verificá los accesos habilitados.';
    }

    // Modelo no encontrado
    if (httpStatus === 404 || errorStatus === 'NOT_FOUND') {
      return 'No se encontró el modelo de Gemini solicitado. Es posible que el nombre del modelo sea incorrecto.';
    }

    // Servicio no disponible / error interno
    if (httpStatus === 500 || httpStatus === 503 || errorStatus === 'INTERNAL' || errorStatus === 'UNAVAILABLE') {
      return 'El servicio de Gemini no está disponible en este momento. Intentá de nuevo en unos minutos.';
    }

    // Fallback genérico sin exponer el JSON crudo
    return `Ocurrió un error al consultar la IA (código ${httpStatus}). Intentá de nuevo o contactá al soporte si el problema persiste.`;
  }

}

