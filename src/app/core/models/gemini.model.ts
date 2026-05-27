export interface GeminiConfidence {
  brand: 'high' | 'medium' | 'low';
  model: 'high' | 'medium' | 'low';
  year: 'high' | 'medium' | 'low';
  color: 'high' | 'medium' | 'low';
  fuel_type: 'high' | 'medium' | 'low';
  transmission: 'high' | 'medium' | 'low';
}

export interface GeminiCarAnalysis {
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  fuel_type: ('nafta' | 'diesel' | 'gnc' | 'hibrido' | 'electrico')[] | null;
  transmission: 'manual' | 'automatica' | null;
  confidence: GeminiConfidence;
  description: string;
}
