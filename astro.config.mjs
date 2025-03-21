import node from '@astrojs/node';
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

// Load the env variables
const envVars = loadEnvFromFile();

export default defineConfig({
  integrations: [
    tailwind(),
    react(),
  ],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  site: 'https://latinium.app',
  vite: {
    define: {
      // Make env variables available to client-side code if needed
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(envVars.GEMINI_API_KEY || ''),
    },
  }
}); 