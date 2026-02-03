// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { DefaultRenderer, TablePlugin } from './renderer/index';

const HIVE_IMAGES_ENDPOINT = 'https://images.hive.blog';

const HIVE_BLOG_URL = 'https://blog.openhive.network';

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
  imageProxyFn: (url: string) => `${HIVE_IMAGES_ENDPOINT}/768x0/${url}`,
  usertagUrlFn: (account: string) => `${HIVE_BLOG_URL}/@${account}`,
  hashtagUrlFn: (hashtag: string) => `${HIVE_BLOG_URL}/trending/${hashtag}`,
  isLinkSafeFn: (url: string) =>
    !!url.match(`^(/(?!/)|${HIVE_IMAGES_ENDPOINT})`) ||
    !!url.match(`^(/(?!/)|#)`),
  addExternalCssClassToMatchingLinksFn: (url: string) =>
    !url.match(`^(/(?!/)|${HIVE_IMAGES_ENDPOINT})`) &&
    !url.match(`^(/(?!/)|#)`)
});

export function renderPostBody(body: string): string {
  if (!body || !body.trim()) return '';
  try {
    return renderer.render(body);
  } catch (error) {
    console.error('[Renderer] Error rendering post body:', error);
    return `<p>${body}</p>`;
  }
}
