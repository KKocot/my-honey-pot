// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { DefaultRenderer, TablePlugin } from './renderer/index';
import { escape_html } from '../shared/formatters/html';
import { HIVE_IMAGES_ENDPOINT, HIVE_BLOG_URL, hive_image_proxy } from './config';

function escape_regex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ESCAPED_IMAGES_ENDPOINT = escape_regex(HIVE_IMAGES_ENDPOINT);

const renderer = new DefaultRenderer({
  baseUrl: `${HIVE_BLOG_URL}/`,
  breaks: true,
  skipSanitization: false,
  allowInsecureScriptTags: false,
  addNofollowToLinks: true,
  addTargetBlankToLinks: true,
  cssClassForInternalLinks: '',
  cssClassForExternalLinks: 'link-external',
  doNotShowImages: false,
  ipfsPrefix: 'https://ipfs.io/ipfs/',
  assetsWidth: 640,
  assetsHeight: 480,
  plugins: [new TablePlugin()],
  imageProxyFn: (url: string) => hive_image_proxy(url, 768),
  usertagUrlFn: (account: string) => `${HIVE_BLOG_URL}/@${account}`,
  hashtagUrlFn: (hashtag: string) => `${HIVE_BLOG_URL}/trending/${hashtag}`,
  isLinkSafeFn: (url: string) =>
    !!url.match(`^(/(?!/)|${ESCAPED_IMAGES_ENDPOINT})`) ||
    !!url.match(`^(/(?!/)|#)`),
  addExternalCssClassToMatchingLinksFn: (url: string) =>
    !url.match(`^(/(?!/)|${ESCAPED_IMAGES_ENDPOINT})`) &&
    !url.match(`^(/(?!/)|#)`)
});

export function renderPostBody(body: string): string {
  if (!body || !body.trim()) return '';
  try {
    return renderer.render(body);
  } catch (error) {
    console.error('[Renderer] Error rendering post body:', error);
    return `<p>${escape_html(body)}</p>`;
  }
}
