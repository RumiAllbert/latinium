import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';

// Load environment variables directly from .env file
function loadEnvFromFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      console.log('Loading environment variables from .env file');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = envContent.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .reduce((vars, line) => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length) {
            const value = valueParts.join('=').trim();
            vars[key.trim()] = value;
            // Set it in process.env too
            process.env[key.trim()] = value;
          }
          return vars;
        }, {});
      
      console.log('Loaded env vars:', Object.keys(envVars).join(', '));
      return envVars;
    }
  } catch (e) {
    console.error('Error loading .env file:', e);
  }
  return {};
}

// Load the env variables from file and process.env
const envVars = {
  ...loadEnvFromFile(),
  ...process.env // Allow process.env to override file values
};

// Log the state of key variables for debugging
console.log('Environment variable status:');
console.log('- GEMINI_API_KEY present:', !!envVars.GEMINI_API_KEY);
console.log('- PUBLIC_GEMINI_API_KEY present:', !!envVars.PUBLIC_GEMINI_API_KEY);

export default defineConfig({
  integrations: [
    tailwind(),
    react(),
  ],
  output: 'static',
  site: 'https://latinium.rumiallbert.com',
  vite: {
    define: {
      // Make env variables available to client-side code if needed
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(envVars.GEMINI_API_KEY || ''),
      // Use PUBLIC_GEMINI_API_KEY for client-side use - this is the one accessed in the browser
      'import.meta.env.PUBLIC_GEMINI_API_KEY': JSON.stringify(envVars.PUBLIC_GEMINI_API_KEY || envVars.GEMINI_API_KEY || ''),
    },
    // Additional Vite config for environment variables
    envPrefix: ['PUBLIC_', 'VITE_'],
  },
  build: {
    format: 'directory'
  }
}); 