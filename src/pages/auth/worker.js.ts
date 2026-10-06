// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { APIRoute } from "astro";
import worker_source from "../../lib/hbauth-worker-source/worker.js?raw";
import {
  HIVE_API_ENDPOINT,
  HIVE_API_ENDPOINTS,
  HIVE_IMAGES_ENDPOINT,
  HIVE_SIGNER_URL,
} from "../../lib/config";

// Static files bypass src/middleware.ts, and a worker enforces the CSP of its own script response (ADR 6abbaacd63221e857a3b1812)
export const prerender = false;

function origin_of(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Mirrors connect-src from src/middleware.ts; https: stays because NodeSwitcher allows any https Hive node
function build_connect_src(): string {
  const origins = [
    ...HIVE_API_ENDPOINTS,
    HIVE_API_ENDPOINT,
    HIVE_IMAGES_ENDPOINT,
    HIVE_SIGNER_URL,
  ]
    .map(origin_of)
    .filter((origin): origin is string => origin !== null);
  return [...new Set(["'self'", "https:", "data:", ...origins])].join(" ");
}

const WORKER_CSP = [
  "default-src 'none'",
  // Emscripten embind glue in the beekeeper WASM build generates invokers with `new Function`
  "script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'",
  `connect-src ${build_connect_src()}`,
  "object-src 'none'",
  "base-uri 'none'",
].join("; ");

const WORKER_HEADERS = {
  "Content-Type": "application/javascript; charset=utf-8",
  "Content-Security-Policy": WORKER_CSP,
  "X-Content-Type-Options": "nosniff",
  // The worker references a content-hashed WASM file; a stale cached worker would point at a removed hash after an hb-auth upgrade
  "Cache-Control": "no-cache",
};

export const GET: APIRoute = () =>
  new Response(worker_source, { status: 200, headers: WORKER_HEADERS });

export const HEAD: APIRoute = () =>
  new Response(null, { status: 200, headers: WORKER_HEADERS });
