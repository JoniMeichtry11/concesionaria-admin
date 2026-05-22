export const environment = {
  production: false,
  supabaseUrl: (window as any)['NG_APP_SUPABASE_URL'],
  supabaseAnonKey: (window as any)['NG_APP_SUPABASE_ANON_KEY'],
  geminiApiKey: (window as any)['NG_APP_GEMINI_API_KEY'],
};
