// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// ============================================
// Application Configuration
// ============================================

// Helper for PUBLIC_ env vars: Vite requires STATIC access to import.meta.env.PUBLIC_*
// Dynamic access (import.meta.env[key]) is NOT replaced during bundling and returns undefined
function get_public_env(
  static_value: string | undefined,
  fallback: string,
): string {
  if (typeof static_value === "string" && static_value.trim() !== "")
    return static_value;
  return fallback;
}

// Helper for server-only env vars (no PUBLIC_ prefix)
// Vite loads .env into import.meta.env (SSR) but NOT into process.env.
// Check import.meta.env first (Vite dev/SSR), then process.env (production Node.js).
function get_server_env(key: string, fallback: string): string {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const meta_val = (import.meta.env as Record<string, string | undefined>)[key];
    if (typeof meta_val === "string" && meta_val.trim() !== "") return meta_val;
  }
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[key];
    if (typeof val === "string" && val.trim() !== "") return val;
  }
  return fallback;
}

// Hive API Endpoints
// PUBLIC_ prefix required for Astro client-side access via import.meta.env
export const HIVE_API_ENDPOINT = get_public_env(
  import.meta.env.PUBLIC_HIVE_API_ENDPOINT,
  "https://api.openhive.network",
);

// Hive chain ID (mainnet default, override for mirrornet/testnet)
export const HIVE_CHAIN_ID = get_public_env(
  import.meta.env.PUBLIC_HIVE_CHAIN_ID,
  "beeab0de00000000000000000000000000000000000000000000000000000000",
);

// Hive image proxy endpoint
export const HIVE_IMAGES_ENDPOINT = get_public_env(
  import.meta.env.PUBLIC_HIVE_IMAGES_ENDPOINT,
  "https://images.hive.blog",
);

// Hive blog frontend URL (for usertag/hashtag links in rendered content)
export const HIVE_BLOG_URL = get_public_env(
  import.meta.env.PUBLIC_HIVE_BLOG_URL,
  "https://blog.openhive.network",
);

// Non-mainnet detection (HB-Auth only works on mainnet, WIF login required otherwise)
const MAINNET_CHAIN_ID = "beeab0de00000000000000000000000000000000000000000000000000000000";
export const IS_NOT_MAINNET = HIVE_CHAIN_ID !== MAINNET_CHAIN_ID;

// Blog owner username (determines whose config to load and favicon)
export const HIVE_USERNAME = get_server_env("HIVE_USERNAME", "");

// Community mode detection
// Hive community accounts follow the pattern "hive-" followed by ONLY digits (e.g. "hive-123456")
const COMMUNITY_PATTERN = /^hive-\d+$/;

export const IS_COMMUNITY = COMMUNITY_PATTERN.test(HIVE_USERNAME);

/** Check if a given Hive account name is a community */
export function is_community(name: string): boolean {
  return COMMUNITY_PATTERN.test(name);
}

// Config storage settings (where user configs are stored on Hive)
// These can be overridden via environment variables
export const CONFIG_PARENT_AUTHOR = get_server_env("CONFIG_PARENT_AUTHOR", "barddev");
export const CONFIG_PARENT_PERMLINK = get_server_env(
  "CONFIG_PARENT_PERMLINK",
  "my-blog-configs",
);

// Fallback API endpoints for retry logic (ordered by preference)
// When using a non-mainnet endpoint (mirrornet/testnet), only that endpoint is used
// to avoid mixing networks in fallback rotation
// NOTE: Keep in sync with mainnet_domains in astro.config.mjs (CSP connect-src)
const MAINNET_FALLBACK_ENDPOINTS = [
  'https://api.openhive.network',
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu',
  'https://api.syncad.com',
];

export const HIVE_API_ENDPOINTS = MAINNET_FALLBACK_ENDPOINTS.includes(
  HIVE_API_ENDPOINT,
)
  ? MAINNET_FALLBACK_ENDPOINTS
  : [HIVE_API_ENDPOINT];

// Config comment identification
export const APPEARANCE_CONFIG_PREFIX = "!hive-blog-appearance";
export const APPEARANCE_CONFIG_TYPE = "blog_appearance_config";
export const LEGACY_CONFIG_APP = "hive-blog-config/1.0";

// Docker service config identification (created by hive-blog-service)
export const DOCKER_CONFIG_TYPE = "blog_docker_config";
export const DOCKER_CONFIG_PREFIX = "!hive-blog-docker";

// Layout Constants
export const LAYOUT_CONSTANTS = {
  SIDEBAR_WIDTH_PX: { min: 200, max: 400, default: 280 },
  CARD_GAP_PX: { min: 0, max: 64, default: 24 },
  CARD_PADDING_PX: { min: 0, max: 64, default: 24 },
  CARD_BORDER_RADIUS_PX: { min: 0, max: 48, default: 16 },
  TITLE_SIZE_PX: { min: 12, max: 48, default: 20 },
  THUMBNAIL_SIZE_PX: { min: 32, max: 400, default: 96 },
  AVATAR_SIZE_PX: { min: 32, max: 128, default: 64 },
  GRID_COLUMNS: { min: 1, max: 4, default: 2 },
  POSTS_PER_PAGE: { min: 5, max: 50, default: 20 },
  SUMMARY_MAX_LENGTH: { min: 50, max: 500, default: 150 },
  MAX_TAGS: { min: 1, max: 10, default: 5 },
} as const

// Comment Settings Constants
export const COMMENT_CONSTANTS = {
  AVATAR_SIZE_PX: { min: 24, max: 64, default: 40 },
  PADDING_PX: { min: 8, max: 32, default: 16 },
  GAP_PX: { min: 0, max: 64, default: 16 },
  MAX_LENGTH: { min: 0, max: 1000, default: 0 },
} as const;

// Hive Image Helpers

/** Build avatar URL for a Hive user */
export function hive_avatar_url(
  username: string,
  size: "small" | "medium" | "large" = "medium",
): string {
  return `${HIVE_IMAGES_ENDPOINT}/u/${username}/avatar${size !== "medium" ? `/${size}` : ""}`;
}

/** Proxy an image URL through Hive image CDN with resize */
export function hive_image_proxy(
  url: string,
  width: number,
  height: number = 0,
): string {
  let normalized = url;

  if (normalized.startsWith("ipfs://")) {
    normalized = `https://ipfs.io/ipfs/${normalized.slice(7)}`;
  } else if (normalized.startsWith("/ipfs/")) {
    normalized = `https://ipfs.io${normalized}`;
  }

  if (normalized.includes("steemitimages.com")) {
    normalized = normalized.replace(/steemitimages\.com/g, "images.hive.blog");
  }

  const is_gif = /\.gif(\?.*)?$/i.test(normalized);
  const size = is_gif ? "0x0" : `${width}x${height}`;

  return `${HIVE_IMAGES_ENDPOINT}/${size}/${normalized}`;
}
