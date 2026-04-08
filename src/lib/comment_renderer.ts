// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { HIVE_IMAGES_ENDPOINT, HIVE_BLOG_URL, hive_image_proxy } from "./config";
import { Phishing } from "./renderer/security/Phishing";
import { SecurityChecker, SecurityError } from "./renderer/security/SecurityChecker";
import { PreliminarySanitizer } from "./renderer/sanitization/PreliminarySanitizer";

const IMAGE_EXTENSION_PATTERN = /\.(?:jpe?g|png|gif|webp|svg|ico|tiff?)(?:\?[^"]*)?$/i;

const md = new MarkdownIt({
  html: true,
  breaks: true,
  typographer: false,
  linkify: true,
});

const HLJS_PREFIX_PATTERN = /^hljs(-[a-z_]+)?$/;
const HLJS_SUBSCOPE_WHITELIST = new Set([
  "function_",
  "class_",
  "inherited__",
  "invoke__",
  "language_",
  "constant_",
]);

const DIV_CLASS_WHITELIST = [
  "pull-right",
  "pull-left",
  "text-justify",
  "text-rtl",
  "text-center",
  "text-right",
  "videoWrapper",
];

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr", "blockquote", "pre", "code",
  "em", "strong", "b", "i", "s", "del",
  "ul", "ol", "li", "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div", "sup", "sub", "center",
  "details", "summary", "strike",
];

const ALLOWED_ATTR = [
  "href", "target", "rel", "class",
  "src", "alt", "width", "height", "loading",
  "align",
];

const purify = DOMPurify();

purify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    const href = node.getAttribute("href") || "";

    if (Phishing.looksPhishy(href)) {
      const span = document.createElement("span");
      span.textContent = node.textContent || "";
      node.replaceWith(span);
      return;
    }

    const is_internal =
      href.startsWith("/") ||
      href.startsWith(HIVE_BLOG_URL) ||
      href.startsWith(HIVE_IMAGES_ENDPOINT);

    if (!is_internal) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener nofollow");
      node.classList.add("link-external");
    }
  }

  if (node.tagName === "IMG") {
    const src = node.getAttribute("src") || "";
    if (!src.startsWith(HIVE_IMAGES_ENDPOINT)) {
      node.setAttribute("src", hive_image_proxy(src, 768));
    }
    node.setAttribute("loading", "lazy");
  }

  if (node.tagName === "SPAN") {
    const cls = node.getAttribute("class");
    if (cls) {
      const allowed_classes = cls
        .split(/\s+/)
        .filter(
          (c) => HLJS_PREFIX_PATTERN.test(c) || HLJS_SUBSCOPE_WHITELIST.has(c),
        );
      if (allowed_classes.length > 0) {
        node.setAttribute("class", allowed_classes.join(" "));
      } else {
        node.removeAttribute("class");
      }
    }
  }

  if (node.tagName === "DIV") {
    const cls = node.getAttribute("class");
    if (cls) {
      const valid_class = DIV_CLASS_WHITELIST.find((e) => cls === e);
      if (valid_class) {
        node.setAttribute("class", valid_class);
      } else {
        node.removeAttribute("class");
      }
    }
  }
});

/**
 * Convert <a> tags that are bare image URLs into <img> tags.
 * Matches links where the text content equals the href and the URL ends with an image extension.
 * This handles the common Hive pattern where users paste raw image URLs as plain text.
 */
function convert_image_links(html: string): string {
  return html.replace(
    /<a\s[^>]*href="(https?:\/\/[^"]+)"[^>]*>\1<\/a>/gi,
    (_match, url: string) => {
      if (IMAGE_EXTENSION_PATTERN.test(url)) {
        const proxied = url.startsWith(HIVE_IMAGES_ENDPOINT) ? url : hive_image_proxy(url, 768);
        return `<img src="${proxied}" alt="Embedded Image" loading="lazy" />`;
      }
      return _match;
    },
  );
}

export function render_comment_body(body: string): string {
  if (!body || !body.trim()) return "";

  const sanitized_input = PreliminarySanitizer.preliminarySanitize(body);
  const raw_html = md.render(sanitized_input);
  const clean_html = purify.sanitize(raw_html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|hive):)/i,
  });

  try {
    SecurityChecker.checkSecurity(clean_html, { allowScriptTag: false });
  } catch (error: unknown) {
    if (error instanceof SecurityError) {
      return "<p>(content hidden: security violation detected)</p>";
    }
    throw error;
  }

  return convert_image_links(clean_html);
}
