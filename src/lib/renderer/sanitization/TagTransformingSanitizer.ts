// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * This file is based on https://github.com/openhive-network/condenser/blob/master/src/app/utils/SanitizeConfig.js
 */
import sanitize from 'sanitize-html';
import {Localization, type LocalizationOptions} from '../Localization';
import {StaticConfig} from '../StaticConfig';

export class TagTransformingSanitizer {
  private options: TagsSanitizerOptions;
  private localization: LocalizationOptions;
  private sanitizationErrors: string[] = [];
  private currentPostContext?: PostContext;

  public constructor(options: TagsSanitizerOptions, localization: LocalizationOptions) {
    this.validate(options);
    Localization.validate(localization);

    this.localization = localization;
    this.options = options;
  }

  /**
   * Sanitizes HTML content by removing unsafe tags and attributes while transforming allowed tags according to configuration.
   * Uses the sanitize-html library with custom configuration for tag transformation.
   *
   * @param text - The HTML content to sanitize
   * @param postContext - Optional context about the post being rendered (for logging)
   * @returns A sanitized version of the HTML content with transformed tags and removed unsafe content
   */
  public sanitize(text: string, postContext?: PostContext): string {
    this.currentPostContext = postContext;
    return sanitize(text, this.generateSanitizeConfig());
  }

  private formatPostContext(): string {
    if (!this.currentPostContext) return '';
    const { author, permlink } = this.currentPostContext;
    if (author && permlink) return ` in @${author}/${permlink}`;
    if (author) return ` by @${author}`;
    return '';
  }

  public getErrors(): string[] {
    return this.sanitizationErrors;
  }

  /**
   * Generates configuration for the sanitize-html library.
   *
   * @returns Configuration object for sanitize-html containing:
   * - Allowed HTML tags
   * - Allowed attributes for specific tags
   * - Allowed URL schemes
   * - Tag transformation rules for iframe, img, div, td, th, and a tags
   *
   * The configuration ensures:
   * - iframes are only allowed from whitelisted sources
   * - images are properly handled based on noImage setting
   * - div classes are restricted to a whitelist
   * - table cell alignment is preserved when valid
   * - links are processed for safety with optional nofollow and target attributes
   */
  private generateSanitizeConfig(): sanitize.IOptions {
    return {
      allowedTags: StaticConfig.sanitization.allowedTags,

      // SEE https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
      allowedAttributes: {
        // "src" MUST pass a whitelist (below)
        iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'webkitallowfullscreen', 'mozallowfullscreen'],

        // class attribute is strictly whitelisted (below)
        // and title is only set in the case of a phishing warning
        div: ['class', 'title'],

        // style is subject to attack, filtering more below
        td: ['style'],
        th: ['style'],
        img: ['src', 'alt'],

        // title is only set in the case of an external link warning
        a: ['href', 'rel', 'title', 'class', 'target', 'id'],

        // start attribute allows ordered lists to continue numbering after interruption
        ol: ['start']
      },
      allowedSchemes: ['http', 'https', 'hive'],
      transformTags: {
        iframe: (tagName: string, attributes: sanitize.Attributes) => {
          const srcAtty = attributes.src;
          for (const item of StaticConfig.sanitization.iframeWhitelist) {
            if (item.re.test(srcAtty)) {
              const src = typeof item.fn === 'function' ? item.fn(srcAtty) : srcAtty;
              if (!src) {
                break;
              }
              const iframeToBeReturned: sanitize.Tag = {
                tagName: 'iframe',
                attribs: {
                  src,
                  width: this.options.iframeWidth + '',
                  height: this.options.iframeHeight + '',
                  // some of there are deprecated but required for some embeds
                  frameborder: '0',
                  allowfullscreen: 'allowfullscreen',
                  webkitallowfullscreen: 'webkitallowfullscreen',
                  mozallowfullscreen: 'mozallowfullscreen'
                }
              };
              return iframeToBeReturned;
            }
          }
          console.warn(`[TagTransformingSanitizer] Blocked iframe (not whitelisted)${this.formatPostContext()}: src="${srcAtty || '(empty)'}"`);
          this.sanitizationErrors.push('Invalid iframe URL: ' + srcAtty);

          const retTag: sanitize.Tag = {tagName: 'div', text: `(Unsupported ${srcAtty})`, attribs: {}};
          return retTag;
        },
        img: (tagName, attribs) => {
          if (this.options.noImage) {
            const retTagOnImagesNotAllowed: sanitize.Tag = {
              tagName: 'div',
              text: this.localization.noImage,
              attribs: {}
            };
            return retTagOnImagesNotAllowed;
          }
          // See https://github.com/punkave/sanitize-html/issues/117
          const {src, alt} = attribs;
          // eslint-disable-next-line security/detect-unsafe-regex
          if (!/^(https?:)?\/\//i.test(src)) {
            console.warn(`[TagTransformingSanitizer] Blocked image (invalid src)${this.formatPostContext()}: src="${src || '(empty)'}"`);
            this.sanitizationErrors.push('An image in this post did not save properly.');
            const retTagOnNoUrl: sanitize.Tag = {
              tagName: 'img',
              attribs: {src: 'brokenimg.jpg'}
            };
            return retTagOnNoUrl;
          }

          const atts: sanitize.Attributes = {};
          atts.src = src.replace(/^http:\/\//i, '//'); // replace http:// with // to force https when needed
          if (alt && alt !== '') {
            atts.alt = alt;
          }
          const retTag: sanitize.Tag = {tagName, attribs: atts};
          return retTag;
        },
        div: (tagName, attribs) => {
          const attys: sanitize.Attributes = {};
          const classWhitelist = ['pull-right', 'pull-left', 'text-justify', 'text-rtl', 'text-center', 'text-right', 'videoWrapper', 'phishy'];
          const validClass = classWhitelist.find((e) => attribs.class === e);
          if (validClass) {
            attys.class = validClass;
          }
          if (validClass === 'phishy' && attribs.title === this.localization.phishingWarning) {
            attys.title = attribs.title;
          }
          const retTag: sanitize.Tag = {
            tagName,
            attribs: attys
          };
          return retTag;
        },
        td: (tagName, attribs) => {
          const attys: sanitize.Attributes = {};
          if (attribs.style === 'text-align:right') {
            attys.style = 'text-align:right';
          }
          if (attribs.style === 'text-align:center') {
            attys.style = 'text-align:center';
          }
          const retTag: sanitize.Tag = {
            tagName,
            attribs: attys
          };
          return retTag;
        },
        th: (tagName, attribs) => {
          const attys: sanitize.Attributes = {};
          if (attribs.style === 'text-align:right') {
            attys.style = 'text-align:right';
          }
          if (attribs.style === 'text-align:center') {
            attys.style = 'text-align:center';
          }
          const retTag: sanitize.Tag = {
            tagName,
            attribs: attys
          };
          return retTag;
        },
        a: (tagName, attribs) => {
          const attys: sanitize.Attributes = {...attribs};
          let {href} = attribs;
          if (href) {
            href = href.trim();
            attys.href = href;
          }
          if (href && !this.options.isLinkSafeFn(href)) {
            attys.rel = this.options.addNofollowToLinks ? 'nofollow noopener' : 'noopener';
            // attys.title = this.localization.phishingWarning;
            attys.target = this.options.addTargetBlankToLinks ? '_blank' : '_self';
          }
          if (href && this.options.addExternalCssClassToMatchingLinksFn(href)) {
            attys.class = this.options.cssClassForExternalLinks ? this.options.cssClassForExternalLinks : '';
          } else {
            attys.class = this.options.cssClassForInternalLinks ? this.options.cssClassForInternalLinks : '';
          }
          const retTag: sanitize.Tag = {
            tagName,
            attribs: attys
          };
          return retTag;
        }
      }
    };
  }

  private validate(o: TagsSanitizerOptions) {
    if (!o || typeof o !== 'object') {
      throw new Error('TagsSanitizerOptions must be an object');
    }
    if (typeof o.iframeWidth !== 'number' || o.iframeWidth <= 0) {
      throw new Error('TagsSanitizerOptions.iframeWidth must be a positive integer');
    }
    if (typeof o.iframeHeight !== 'number' || o.iframeHeight <= 0) {
      throw new Error('TagsSanitizerOptions.iframeHeight must be a positive integer');
    }
    if (typeof o.addNofollowToLinks !== 'boolean') {
      throw new Error('TagsSanitizerOptions.addNofollowToLinks must be a boolean');
    }
    if (typeof o.noImage !== 'boolean') {
      throw new Error('TagsSanitizerOptions.noImage must be a boolean');
    }
    if (typeof o.isLinkSafeFn !== 'function') {
      throw new Error('TagsSanitizerOptions.isLinkSafeFn must be a function');
    }
    if (typeof o.addExternalCssClassToMatchingLinksFn !== 'function') {
      throw new Error('TagsSanitizerOptions.addExternalCssClassToMatchingLinksFn must be a function');
    }
  }
}

export interface TagsSanitizerOptions {
  iframeWidth: number;
  iframeHeight: number;
  addNofollowToLinks: boolean;
  addTargetBlankToLinks?: boolean;
  cssClassForInternalLinks?: string;
  cssClassForExternalLinks?: string;
  noImage: boolean;
  isLinkSafeFn: (url: string) => boolean;
  addExternalCssClassToMatchingLinksFn: (url: string) => boolean;
}

export interface PostContext {
  author?: string;
  permlink?: string;
}
