import { DefaultRenderer, TablePlugin } from './renderer/index';

const HIVE_IMAGES_ENDPOINT = 'https://images.hive.blog';

const renderer = new DefaultRenderer({
  baseUrl: 'https://hive.blog/',
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
  usertagUrlFn: (account: string) => `https://hive.blog/@${account}`,
  hashtagUrlFn: (hashtag: string) => `https://hive.blog/trending/${hashtag}`,
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

export function renderCommentBody(body: string): string {
  return renderPostBody(body);
}
