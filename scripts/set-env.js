// scripts/set-env.js
// Lee las variables del archivo .env y genera src/environments/environment.ts
// Ejecutar antes de `ng serve` o `ng build`

const fs = require('fs');
const path = require('path');

// Cargar el .env de la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const isProduction = process.argv.includes('--production');

const environment = {
  production: isProduction,
  supabaseUrl: process.env.NG_APP_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NG_APP_SUPABASE_ANON_KEY || '',
  geminiApiKey: process.env.NG_APP_GEMINI_API_KEY || '',
  catalogUrl: process.env.NG_APP_CATALOG_URL || '',
};

const content = `// ARCHIVO GENERADO AUTOMÁTICAMENTE por scripts/set-env.js
// ⚠️  NO edites este archivo manualmente — edita el archivo .env en la raíz del proyecto

export const environment = ${JSON.stringify(environment, null, 2)};
`;

const outputPath = path.resolve(__dirname, '../src/environments/environment.ts');
fs.writeFileSync(outputPath, content, { encoding: 'utf-8' });

console.log('✅  environment.ts generado correctamente desde .env');
console.log('   supabaseUrl  :', environment.supabaseUrl ? '✔ ok' : '⚠ vacío');
console.log('   supabaseAnonKey:', environment.supabaseAnonKey ? '✔ ok' : '⚠ vacío');
console.log('   geminiApiKey :', environment.geminiApiKey ? '✔ ok' : '⚠ vacío');
console.log('   catalogUrl   :', environment.catalogUrl ? '✔ ok' : '⚠ vacío');
