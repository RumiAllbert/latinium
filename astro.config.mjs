import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [tailwind(), react()],
  site: 'https://latinium.rumiallbert.com',
});
