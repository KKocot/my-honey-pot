// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { HIVE_IMAGES_ENDPOINT, HIVE_BLOG_URL, hive_image_proxy } from "./config";
import { Phishing } from "./renderer/security/Phishing";
import { SecurityChecker, SecurityError } from "./renderer/security/SecurityChecker";
import { PreliminarySanitizer } from "./renderer/sanitization/PreliminarySanitizer";

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

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "hr",
    "blockquote",
    "pre",
    "code",
    "em",
    "strong",
    "b",
    "i",
    "s",
    "del",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "span",
    "div",
    "sup",
    "sub",
    "center",
    "details",
    "summary",
    "strike",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    img: ["src", "alt", "width", "height", "loading"],
    code: ["class"],
    pre: ["class"],
    span: ["class"],
    div: ["class"],
    td: ["align"],
    th: ["align"],
  },
  allowedSchemes: ["http", "https", "hive"],
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs["href"] ?? "";

      if (Phishing.looksPhishy(href)) {
        const phishy_attribs: sanitizeHtml.Attributes = {};
        return { tagName: "span", attribs: phishy_attribs };
      }

      const is_internal =
        href.startsWith("/") ||
        href.startsWith(HIVE_BLOG_URL) ||
        href.startsWith(HIVE_IMAGES_ENDPOINT);

      const external_attribs: sanitizeHtml.Attributes = {
        ...attribs,
        target: "_blank",
        rel: "noopener nofollow",
        class: "link-external",
      };

      return {
        tagName,
        attribs: is_internal ? attribs : external_attribs,
      };
    },
    img: (tagName, attribs) => {
      const src = attribs["src"] ?? "";
      const proxied_src = src.startsWith(HIVE_IMAGES_ENDPOINT)
        ? src
        : hive_image_proxy(src, 768);

      return {
        tagName,
        attribs: {
          ...attribs,
          src: proxied_src,
          loading: "lazy",
        },
      };
    },
    span: (tagName, attribs) => {
      const attys: sanitizeHtml.Attributes = {};
      if (attribs["class"]) {
        const allowed_classes = attribs["class"]
          .split(/\s+/)
          .filter(
            (cls: string) =>
              HLJS_PREFIX_PATTERN.test(cls) ||
              HLJS_SUBSCOPE_WHITELIST.has(cls),
          );
        if (allowed_classes.length > 0) {
          attys["class"] = allowed_classes.join(" ");
        }
      }
      return { tagName, attribs: attys };
    },
    div: (tagName, attribs) => {
      const attys: sanitizeHtml.Attributes = {};
      const valid_class = DIV_CLASS_WHITELIST.find(
        (e) => attribs["class"] === e,
      );
      if (valid_class) {
        attys["class"] = valid_class;
      }
      return { tagName, attribs: attys };
    },
  },
};

export function render_comment_body(body: string): string {
  if (!body || !body.trim()) return "";

  const sanitized_input = PreliminarySanitizer.preliminarySanitize(body);
  const raw_html = md.render(sanitized_input);
  const clean_html = sanitizeHtml(raw_html, SANITIZE_OPTIONS);

  try {
    SecurityChecker.checkSecurity(clean_html, { allowScriptTag: false });
  } catch (error: unknown) {
    if (error instanceof SecurityError) {
      return "<p>(content hidden: security violation detected)</p>";
    }
    throw error;
  }

  return clean_html;
}
