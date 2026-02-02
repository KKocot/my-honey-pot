// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';

import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: node({
    mode: 'standalone'
  }),

  site: process.env.PUBLIC_SITE_URL?.trim() || undefined,

  server: {
    host: '0.0.0.0',
    port: 4326
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [solidJs()]
});