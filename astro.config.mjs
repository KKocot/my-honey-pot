// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

import solidJs from '@astrojs/solid-js';

const is_vercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const adapter = is_vercel
  ? vercel({
      webAnalytics: { enabled: false }
    })
  : node({
      mode: 'standalone'
    });

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter,

  // No Astro.session usage; @astrojs/node would otherwise default to fs storage, which breaks on a read-only rootfs
  session: false,

  server: {
    host: '0.0.0.0',
    port: 4326
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Inlined hoisted scripts would not get the CSP nonce (src/middleware.ts trusts only /_astro/*.js bundles)
      assetsInlineLimit: (file_path) =>
        file_path.endsWith('.js') ? false : undefined,
    },
    optimizeDeps: {
      include: ["@hiveio/beekeeper"],
    },
    ssr: {
      // sanitize-html (CJS) require()s ESM-only htmlparser2; the Vercel function loader lacks require(esm), so bundle them
      noExternal: [
        'sanitize-html',
        'htmlparser2',
        'domhandler',
        'domutils',
        'domelementtype',
        'dom-serializer',
        'entities',
      ],
    },
  },

  integrations: [solidJs()]
});
