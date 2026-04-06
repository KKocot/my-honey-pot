// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

import solidJs from '@astrojs/solid-js';

// Load .env vars for config (process.env does NOT contain .env values at config time)
const loaded_env = loadEnv(process.env.NODE_ENV || '', process.cwd(), '');

// CSP connect-src: mainnet domains + custom endpoints from .env
const hive_api_endpoint = loaded_env.PUBLIC_HIVE_API_ENDPOINT?.trim() || "";
const hive_images_endpoint =
  loaded_env.PUBLIC_HIVE_IMAGES_ENDPOINT?.trim() || "";
const hive_signer_url =
  loaded_env.PUBLIC_HIVE_SIGNER_URL?.trim() ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:5174' : 'https://signer.bard-dev.com');

// NOTE: Keep in sync with MAINNET_FALLBACK_ENDPOINTS in src/lib/config.ts
const mainnet_domains = [
  "https://api.openhive.network",
  "https://api.hive.blog",
  "https://api.deathwing.me",
  "https://hive-api.arcange.eu",
  "https://images.hive.blog",
  "https://api.syncad.com",
];

const extra_domains = [hive_api_endpoint, hive_images_endpoint, hive_signer_url].filter(
  (d) => d && !mainnet_domains.includes(d),
);

const connect_src_domains = [...mainnet_domains, ...extra_domains].join(" ");

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
      "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; frame-src https://www.youtube.com https://player.vimeo.com https://player.twitch.tv https://w.soundcloud.com https://3speak.tv https://open.spotify.com; connect-src 'self' ${connect_src_domains};`
    }
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["@hiveio/beekeeper"],
    },
  },

  integrations: [solidJs()]
});