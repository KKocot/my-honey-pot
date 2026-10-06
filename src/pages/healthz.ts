// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { APIRoute } from "astro";

export const prerender = false;

const HEALTH_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({ status: "ok", uptime_s: Math.round(process.uptime()) }),
    { status: 200, headers: HEALTH_HEADERS },
  );

export const HEAD: APIRoute = () =>
  new Response(null, { status: 200, headers: HEALTH_HEADERS });
