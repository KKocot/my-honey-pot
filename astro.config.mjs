// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

import solidJs from '@astrojs/solid-js';

const is_vercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const adapter = is_vercel
  ? vercel({
      webAnalytics: { enabled: false },
      functionPerRoute: false
    })
  : node({
      mode: 'standalone'
    });

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter,

  site: process.env.PUBLIC_SITE_URL?.trim() || undefined,

  server: {
    host: '0.0.0.0',
    port: 4326,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; frame-src https://www.youtube.com https://player.vimeo.com https://player.twitch.tv https://w.soundcloud.com https://3speak.tv https://open.spotify.com; connect-src 'self' https://api.openhive.network https://api.hive.blog https://api.deathwing.me https://hive-api.arcange.eu https://images.hive.blog;"
    }
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [solidJs()]
});