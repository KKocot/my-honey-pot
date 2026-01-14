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

  server: {
    port: 4321
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [solidJs()]
});