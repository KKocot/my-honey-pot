// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { defineMiddleware } from "astro:middleware";
import islandScript from "astro/runtime/server/astro-island.prebuilt.js";
import islandScriptDev from "astro/runtime/server/astro-island.prebuilt-dev.js";
import idleDirective from "astro/runtime/client/idle.prebuilt.js";
import loadDirective from "astro/runtime/client/load.prebuilt.js";
import mediaDirective from "astro/runtime/client/media.prebuilt.js";
import onlyDirective from "astro/runtime/client/only.prebuilt.js";
import visibleDirective from "astro/runtime/client/visible.prebuilt.js";
import { generateHydrationScript } from "solid-js/web";
import {
  HIVE_API_ENDPOINT,
  HIVE_API_ENDPOINTS,
  HIVE_IMAGES_ENDPOINT,
  HIVE_SIGNER_URL,
} from "./lib/config";

declare global {
  namespace App {
    interface Locals {
      nonce: string;
    }
  }
}

// StaticConfig.iframeWhitelist exposes regexes only; keep in sync with the hosts its fn() rebuild to
const FRAME_SRC = [
  "https://platform.twitter.com",
  "https://player.vimeo.com",
  "https://www.youtube.com",
  "https://w.soundcloud.com",
  "https://player.twitch.tv",
  "https://open.spotify.com",
  "https://3speak.tv",
];

// Only scripts Astro/Solid emit get the nonce; anything else in the HTML (e.g. a sanitizer bypass) stays blocked
const TRUSTED_INLINE_SCRIPTS = new Set(
  [
    islandScript,
    islandScriptDev,
    idleDirective,
    loadDirective,
    mediaDirective,
    onlyDirective,
    visibleDirective,
    /<script[^>]*>([\s\S]*?)<\/script>/.exec(generateHydrationScript())?.[1] ?? "",
  ]
    .map((body) => body.trim())
    .filter((body) => body !== ""),
);
const SCRIPT_ELEMENT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const SRC_ATTR = /\bsrc\s*=/gi;
const ASTRO_BUNDLE_SRC = /\bsrc="\/_astro\/[\w.-]+\.js"/;

function is_trusted_script(attrs: string, body: string): boolean {
  const src_count = attrs.match(SRC_ATTR)?.length ?? 0;
  if (src_count > 1) return false;
  if (src_count === 1) return ASTRO_BUNDLE_SRC.test(attrs) && body.trim() === "";
  return TRUSTED_INLINE_SCRIPTS.has(body.trim());
}

function add_nonce_to_trusted_scripts(html: string, nonce: string): string {
  return html.replace(SCRIPT_ELEMENT, (element, attrs: string, body: string) => {
    if (/\bnonce=/i.test(attrs)) return element;
    if (!import.meta.env.DEV && !is_trusted_script(attrs, body)) return element;
    return `<script nonce="${nonce}"${attrs}>${body}</script>`;
  });
}

function origin_of(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function create_nonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

// https: stays because NodeSwitcher lets the user pick any https Hive node at runtime (same as ADR 6abbaacd63221e857a3b1812)
function build_connect_src(): string {
  const origins = [
    ...HIVE_API_ENDPOINTS,
    HIVE_API_ENDPOINT,
    HIVE_IMAGES_ENDPOINT,
    HIVE_SIGNER_URL,
  ]
    .map(origin_of)
    .filter((origin): origin is string => origin !== null);
  const sources = new Set(["'self'", "https:", ...origins]);
  if (import.meta.env.DEV) {
    sources.add("ws:");
    sources.add("wss:");
  }
  return [...sources].join(" ");
}

const CONNECT_SRC = build_connect_src();

function build_page_csp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    `connect-src ${CONNECT_SRC}`,
    `frame-src ${FRAME_SRC.join(" ")}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export const onRequest = defineMiddleware(async (context, next) => {
  const nonce = create_nonce();
  context.locals.nonce = nonce;

  const response = await next();

  const content_type = response.headers.get("content-type") ?? "";
  if (!content_type.includes("text/html")) return response;

  const html = add_nonce_to_trusted_scripts(await response.text(), nonce);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("Content-Security-Policy", build_page_csp(nonce));
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
