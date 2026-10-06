// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * This file is based on
 *  - https://github.com/openhive-network/condenser/blob/master/src/app/utils/SanitizeConfig.js
 */

export interface IframeWhitelistEntry {
  re: RegExp;
  fn: (src: string) => string | null;
  allow: string;
}

const IFRAME_ALLOW_BASE = 'fullscreen; encrypted-media; picture-in-picture';
const IFRAME_ALLOW_AUTOPLAY = `${IFRAME_ALLOW_BASE}; autoplay`;
const TWITCH_PARENT_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;
const THREE_SPEAK_ID_RE = /^[a-z0-9][a-z0-9.-]{1,15}\/[a-z0-9][a-z0-9-]{0,255}$/i;

function parseHttpUrl(src: string, hostname: string): URL | null {
  if (!src) {
    return null;
  }
  try {
    const url = new URL(src.startsWith('//') ? `https:${src}` : src);
    const isHttp = url.protocol === 'https:' || url.protocol === 'http:';
    return isHttp && url.hostname === hostname && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

function twitterEmbed(src: string): string | null {
  const m = src?.match(/^@?(?:(?:https?:)?\/\/)?(?:www\.)?(?:twitter|x)\.com\/(?:\w+\/)?status\/(\d{1,20})(?:[/?#]|$)/i);
  return m ? `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}` : null;
}

function threeSpeakEmbed(src: string): string | null {
  const host = src?.match(/^(?:https?:)?\/\/((?:www\.)?3speak\.(?:tv|online|co))\//i);
  const url = host ? parseHttpUrl(src, host[1].toLowerCase()) : null;
  const id = url?.searchParams.get('v');
  return id && THREE_SPEAK_ID_RE.test(id) ? `https://3speak.tv/embed?v=${id}` : null;
}

/**
 * Static configuration class for content sanitization and iframe handling.
 *
 * Each iframe whitelist entry matches an anchored provider URL and rebuilds the
 * src from the extracted ID, so author-supplied query/fragment never reaches the DOM.
 */
export class StaticConfig {
  public static sanitization = {
    iframeSandbox: 'allow-scripts allow-same-origin allow-popups allow-presentation',
    iframeWhitelist: [
      {
        re: /^@?(?:(?:https?:)?\/\/)?(?:www\.)?(?:twitter|x)\.com\/(?:\w+\/)?status\/\d{1,20}(?:[/?#]|$)/i,
        fn: twitterEmbed,
        allow: IFRAME_ALLOW_BASE
      },
      {
        re: /^(?:https?:)?\/\/player\.vimeo\.com\/video\/\d{1,20}(?:[/?#]|$)/i,
        fn: (src: string) => {
          const url = parseHttpUrl(src, 'player.vimeo.com');
          const id = url?.pathname.match(/^\/video\/(\d{1,20})\/?$/)?.[1];
          if (!url || !id) {
            return null;
          }
          // Unlisted Vimeo videos require the privacy hash `h`.
          const hash = url.searchParams.get('h');
          return `https://player.vimeo.com/video/${id}` + (hash && /^[0-9a-f]{1,32}$/i.test(hash) ? `?h=${hash}` : '');
        },
        allow: IFRAME_ALLOW_BASE
      },
      {
        re: /^(?:https?:)?\/\/(?:www\.)?youtube\.com\/embed\/[A-Za-z0-9_-]{1,64}(?:[/?#]|$)/i,
        fn: (src: string) => {
          const id = src?.match(/^(?:https?:)?\/\/(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{1,64})(?:[/?#]|$)/i)?.[1];
          return id ? `https://www.youtube.com/embed/${id}` : null;
        },
        allow: IFRAME_ALLOW_BASE
      },
      {
        re: /^(?:https?:)?\/\/w\.soundcloud\.com\/player\/?\?/i,
        fn: (src: string) => {
          const inner = parseHttpUrl(src, 'w.soundcloud.com')?.searchParams.get('url') ?? '';
          const api = parseHttpUrl(inner, 'api.soundcloud.com')?.pathname.match(/^\/(?:tracks|playlists|users)\/\d{1,20}$/)?.[0];
          const web = parseHttpUrl(inner, 'soundcloud.com')?.pathname.match(/^\/[\w-]{1,64}(?:\/[\w-]{1,128}){0,2}$/)?.[0];
          const path = api ? `api.soundcloud.com${api}` : web ? `soundcloud.com${web}` : null;
          if (!path) {
            return null;
          }
          const trackUrl = encodeURIComponent(`https://${path}`);
          return `https://w.soundcloud.com/player/?url=${trackUrl}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;
        },
        allow: IFRAME_ALLOW_AUTOPLAY
      },
      {
        re: /^(?:https?:)?\/\/player\.twitch\.tv\/?\?/i,
        fn: (src: string) => {
          const params = parseHttpUrl(src, 'player.twitch.tv')?.searchParams;
          if (!params) {
            return null;
          }
          const channel = params.get('channel');
          const video = params.get('video');
          let target: string;
          if (channel && /^\w{1,25}$/.test(channel)) {
            target = `channel=${channel}`;
          } else if (video && /^v?\d{1,20}$/.test(video)) {
            target = `video=${video}`;
          } else {
            return null;
          }
          const parents = params.getAll('parent').filter((p) => p.length <= 253 && TWITCH_PARENT_RE.test(p));
          const autoplay = params.get('autoplay') === 'false' ? '&autoplay=false' : '';
          return `https://player.twitch.tv/?${target}${parents.map((p) => `&parent=${p}`).join('')}${autoplay}`;
        },
        allow: IFRAME_ALLOW_AUTOPLAY
      },
      {
        re: /^(?:https?:)?\/\/open\.spotify\.com\/(?:embed|embed-podcast)\/(?:playlist|show|episode|album|track|artist)\/[A-Za-z0-9]{1,64}(?:[/?#]|$)/i,
        fn: (src: string) => {
          const m = src?.match(/^(?:https?:)?\/\/open\.spotify\.com\/(embed|embed-podcast)\/(playlist|show|episode|album|track|artist)\/([A-Za-z0-9]{1,64})(?:[/?#]|$)/i);
          return m ? `https://open.spotify.com/${m[1].toLowerCase()}/${m[2].toLowerCase()}/${m[3]}` : null;
        },
        allow: IFRAME_ALLOW_AUTOPLAY
      },
      {
        re: /^(?:https?:)?\/\/(?:www\.)?3speak\.(?:tv|online|co)\/(?:embed|watch)\?/i,
        fn: threeSpeakEmbed,
        allow: IFRAME_ALLOW_BASE
      }
    ] satisfies IframeWhitelistEntry[],
    noImageText: '(Image not shown due to low ratings)',
    allowedTags: `
    div, iframe, del, span,
    a, p, b, i, q, br, ul, li, ol, img, h1, h2, h3, h4, h5, h6, hr,
    blockquote, pre, code, em, strong, center, table, thead, tbody, tr, th, td,
    strike, sup, sub, details, summary
`
      .trim()
      .split(/,\s*/)
  };
}
