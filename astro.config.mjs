// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

import tailwindcss from "@tailwindcss/vite";

import solidJs from "@astrojs/solid-js";

const file_env = loadEnv(process.env.NODE_ENV || "", process.cwd(), "");

// Vercel injects vars into process.env and ships no .env file; local/Docker builds rely on the file.
function read_env(key) {
  const from_process = process.env[key]?.trim();
  if (from_process) return from_process;
  return file_env[key]?.trim() || "";
}

// CSP connect-src: mainnet domains + custom endpoints from env
const hive_api_endpoint = read_env("PUBLIC_HIVE_API_ENDPOINT");
const hive_images_endpoint = read_env("PUBLIC_HIVE_IMAGES_ENDPOINT");
const hive_signer_url =
  read_env("PUBLIC_HIVE_SIGNER_URL") ||
  (process.env.NODE_ENV !== "production"
    ? "http://localhost:5174"
    : "https://signer.bard-dev.com");

// NOTE: Keep in sync with MAINNET_FALLBACK_ENDPOINTS in src/lib/config.ts
const mainnet_domains = [
  "https://api.openhive.network",
  "https://api.hive.blog",
  "https://api.deathwing.me",
  "https://hive-api.arcange.eu",
  "https://images.hive.blog",
  "https://api.syncad.com",
];

const extra_domains = [
  hive_api_endpoint,
  hive_images_endpoint,
  hive_signer_url,
].filter((d) => d && !mainnet_domains.includes(d));

const connect_src_domains = [...mainnet_domains, ...extra_domains].join(" ");

const is_vercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const adapter = is_vercel
  ? vercel({
      webAnalytics: { enabled: false },
      functionPerRoute: false,
    })
  : node({
      mode: "standalone",
    });

// https://astro.build/config
export default defineConfig({
  output: "server",

  adapter,

  site: read_env("PUBLIC_SITE_URL") || undefined,

  server: {
    host: "0.0.0.0",
    port: 4326,
    headers: {
      "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; frame-src https://www.youtube.com https://player.vimeo.com https://player.twitch.tv https://w.soundcloud.com https://3speak.tv https://open.spotify.com; connect-src 'self' ${connect_src_domains};`,
    },
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["@hiveio/beekeeper"],
    },
  },

  integrations: [solidJs()],
});
