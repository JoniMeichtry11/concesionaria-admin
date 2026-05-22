export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string
          brand: string
          model: string
          year: number
          color: string | null
          fuel_type: string | null
          transmission: string | null
          kilometers: number | null
          price_usd: number | null
          price_ars: number | null
          description: string | null
          status: 'borrador' | 'disponible' | 'reservado' | 'pausado' | 'vendido'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          model: string
          year: number
          color?: string | null
          fuel_type?: string | null
          transmission?: string | null
          kilometers?: number | null
          price_usd?: number | null
          price_ars?: number | null
          description?: string | null
          status?: 'borrador' | 'disponible' | 'reservado' | 'pausado' | 'vendido'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          year?: number
          color?: string | null
          fuel_type?: string | null
          transmission?: string | null
          kilometers?: number | null
          price_usd?: number | null
          price_ars?: number | null
          description?: string | null
          status?: 'borrador' | 'disponible' | 'reservado' | 'pausado' | 'vendido'
          created_at?: string
          updated_at?: string
        }
      }
      car_photos: {
        Row: {
          id: string
          car_id: string
          url: string
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          car_id: string
          url: string
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          url?: string
          order?: number
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          concesionaria_name: string
          logo_url: string | null
          whatsapp_number: string
          currencies: string[]
          ars_rate: number | null
        }
        Insert: {
          id?: string
          concesionaria_name: string
          logo_url?: string | null
          whatsapp_number: string
          currencies?: string[]
          ars_rate?: number | null
        }
        Update: {
          id?: string
          concesionaria_name?: string
          logo_url?: string | null
          whatsapp_number?: string
          currencies?: string[]
          ars_rate?: number | null
        }
      }
      user_roles: {
        Row: {
          id: string
          role: 'admin' | 'vendedor'
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'vendedor'
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'vendedor'
          full_name?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
