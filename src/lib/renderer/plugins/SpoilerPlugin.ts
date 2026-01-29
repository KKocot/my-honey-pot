import type MarkdownIt from 'markdown-it';
import type {Options} from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import type Renderer from 'markdown-it/lib/renderer.mjs';

/** Configuration options for the spoiler plugin */
interface SpoilerConfig {
  /** The prefix character used to identify spoiler blocks. Defaults to '!' */
  prefix?: string;
  /** Default text shown on the spoiler reveal button. Defaults to 'Reveal spoiler' */
  defaultRevealText?: string;
  /** Maximum length of custom reveal text. Defaults to 50 */
  revealTextMaxLength?: number;
}

/** Metadata for a spoiler block */
interface SpoilerMetadata {
  /** Text to show on the reveal button */
  revealText: string;
}

/**
 * markdown-it plugin that adds support for spoiler blocks.
 * Usage:
 * > ! This is a spoiler with default reveal text
 * > ![Custom Text] This is a spoiler with custom reveal text
 *
 * @param md - markdown-it parser instance
 * @param config - Configuration options for the spoiler plugin
 */
const markdownItSpoiler = (md: MarkdownIt, config: SpoilerConfig = {}) => {
  const {prefix = '!', defaultRevealText = 'Reveal spoiler', revealTextMaxLength = 50} = config;
  const originalOpenRenderer = md.renderer.rules.blockquote_open;
  const originalCloseRenderer = md.renderer.rules.blockquote_close;
  const originalTextRenderer = md.renderer.rules.text;
  let spoilerMetadata: SpoilerMetadata | undefined;

  const extractSpoilerMetadata = (tokens: Token[], idx: number): SpoilerMetadata | null => {
    for (let ti = idx; ti < tokens.length; ti += 1) {
      const token = tokens[ti];

      if (token.type === 'blockquote_close') {
        return null;
      }

      if (token.type === 'inline' && token.content && token.content.indexOf(prefix) === 0) {
        const regex = new RegExp(`${prefix} {0,1}\\[([A-Za-z0-9 ?!]{1,${revealTextMaxLength}}?)\\] {0,1}`);
        const match = token.content.match(regex);

        if (match) {
          return {revealText: match[1]};
        }

        return {revealText: defaultRevealText};
      }
    }

    return null;
  };

  md.renderer.rules.blockquote_open = (tokens: Token[], idx: number, options: Options, env: any, self: Renderer): string => {
    if (!spoilerMetadata) {
      spoilerMetadata = extractSpoilerMetadata(tokens, idx) ?? undefined;
      if (spoilerMetadata) {
        return `<details><summary>${spoilerMetadata.revealText}</summary>`;
      }
    }

    if (originalOpenRenderer) {
      return originalOpenRenderer(tokens, idx, options, env, self);
    }
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.blockquote_close = (tokens: Token[], idx: number, options: Options, env: any, self: Renderer): string => {
    if (spoilerMetadata) {
      spoilerMetadata = undefined;
      return '</details>';
    }

    if (originalCloseRenderer) {
      return originalCloseRenderer(tokens, idx, options, env, self);
    }
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.text = (tokens: Token[], idx: number, options: Options, env: any, self: Renderer): string => {
    if (spoilerMetadata && tokens[idx].content) {
      const prefixPattern = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const revealTextPattern = spoilerMetadata.revealText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const fullPattern = new RegExp(`^${prefixPattern} {0,1}\\[${revealTextPattern}\\] {0,1}`);
      const simplePattern = new RegExp(`^${prefixPattern}`);

      return tokens[idx].content.replace(fullPattern, '').replace(simplePattern, '');
    }
    if (originalTextRenderer) {
      return originalTextRenderer(tokens, idx, options, env, self);
    }
    return tokens[idx].content || '';
  };
};

export default markdownItSpoiler;
