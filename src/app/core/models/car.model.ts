import { Database } from './supabase.types';

/** Tipo de estado de un auto, derivado del esquema de la base de datos */
export type CarStatus = Database['public']['Tables']['cars']['Row']['status'];

/** Interface Car con todos los campos de la tabla cars */
export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  fuel_type: string | null;
  transmission: string | null;
  kilometers: number | null;
  price_usd: number | null;
  price_ars: number | null;
  description: string | null;
  status: CarStatus;
  created_at: string;
  updated_at: string;
}

/** Extiende Car con la URL de la foto de portada (order = 0) */
export interface CarWithCover extends Car {
  coverUrl: string | null;
}
