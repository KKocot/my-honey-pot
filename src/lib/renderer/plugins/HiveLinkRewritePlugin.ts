// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { RendererPlugin } from "./RendererPlugin";

/**
 * Domains used by Hive frontends that should be rewritten to internal links.
 */
const HIVE_DOMAINS = [
  "peakd\\.com",
  "www\\.peakd\\.com",
  "ecency\\.com",
  "www\\.ecency\\.com",
  "hive\\.blog",
  "www\\.hive\\.blog",
  "blog\\.openhive\\.network",
];

const DOMAIN_PATTERN = HIVE_DOMAINS.join("|");

/**
 * Matches an <a> tag whose href points to a known Hive frontend domain.
 * Captures the full tag so we can rewrite both href and link text.
 */
const ANCHOR_REGEX = new RegExp(
  `<a\\s([^>]*href="https?://(?:${DOMAIN_PATTERN})(/[^"]*)"[^>]*)>(.*?)</a>`,
  "gi",
);

/**
 * Matches a URL pointing to a known Hive frontend domain (used for text replacement).
 */
const URL_TEXT_REGEX = new RegExp(
  `https?://(?:${DOMAIN_PATTERN})(/[^<]*)`,
  "gi",
);

/**
 * Normalizes a Hive URL path to an internal path.
 *
 * Rules:
 * - `/@username/permlink` stays as-is
 * - `/category/@username/permlink` strips the category prefix
 * - `/c/hive-123456` becomes `/hive-123456`
 * - `/trending/tag` stays as-is
 */
function normalize_path(path: string): string {
  // Remove trailing slash
  const cleaned = path.replace(/\/$/, "") || "/";

  // Pattern: /category/@username/permlink -> /@username/permlink
  const category_user_match = cleaned.match(
    /^\/[^/@][^/]*\/@([^/]+)\/([^/?#]+)/,
  );
  if (category_user_match) {
    return `/@${category_user_match[1]}/${category_user_match[2]}`;
  }

  // Pattern: /@username/permlink -> keep as-is
  const user_post_match = cleaned.match(/^\/@[^/]+\/[^/?#]+/);
  if (user_post_match) {
    return user_post_match[0];
  }

  // Pattern: /@username (profile) -> keep as-is
  const profile_match = cleaned.match(/^\/@[^/]+$/);
  if (profile_match) {
    return profile_match[0];
  }

  // Pattern: /c/hive-123456 -> /hive-123456
  const community_match = cleaned.match(/^\/c\/(hive-\d+)/);
  if (community_match) {
    return `/${community_match[1]}`;
  }

  // Pattern: /trending/tag -> keep as-is
  const trending_match = cleaned.match(/^\/trending\/[^/?#]+/);
  if (trending_match) {
    return trending_match[0];
  }

  return cleaned;
}

/**
 * Removes external link attributes (target, rel, class) from an anchor tag
 * since the link is now internal.
 */
function strip_external_attrs(attrs: string): string {
  return attrs
    .replace(/\s*target="_blank"/gi, "")
    .replace(/\s*rel="[^"]*nofollow[^"]*"/gi, "")
    .replace(/\s*class="link-external"/gi, "");
}

/**
 * Plugin that rewrites links pointing to Hive frontend domains
 * (peakd.com, ecency.com, hive.blog, blog.openhive.network)
 * into internal relative links.
 *
 * Operates in postProcess phase on the final HTML string.
 */
export class HiveLinkRewritePlugin implements RendererPlugin {
  name = "hive-link-rewrite-plugin";

  postProcess(text: string): string {
    return text.replace(
      ANCHOR_REGEX,
      (_match, attrs: string, path: string, link_text: string) => {
        const internal_path = normalize_path(path);
        const cleaned_attrs = strip_external_attrs(attrs);

        // Replace href in attributes
        const new_attrs = cleaned_attrs.replace(
          /href="https?:\/\/[^"]+"/i,
          `href="${internal_path}"`,
        );

        // If link text is the bare URL, replace it with the internal path
        const new_text = URL_TEXT_REGEX.test(link_text)
          ? internal_path
          : link_text;

        // Reset regex lastIndex since we use the global flag
        URL_TEXT_REGEX.lastIndex = 0;

        return `<a ${new_attrs}>${new_text}</a>`;
      },
    );
  }
}
