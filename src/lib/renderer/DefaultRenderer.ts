// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import MarkdownIt from 'markdown-it';
import hljs from "highlight.js/lib/common";
import {SecurityChecker} from './security/SecurityChecker';
import {HtmlDOMParser} from './embedder/HtmlDOMParser';
import {Localization, type LocalizationOptions} from './Localization';
import type {RendererPlugin} from './plugins/RendererPlugin';
import markdownItSpoiler from './plugins/SpoilerPlugin';
import {PreliminarySanitizer} from './sanitization/PreliminarySanitizer';
import {TagTransformingSanitizer, type PostContext} from './sanitization/TagTransformingSanitizer';

/**
 * DefaultRenderer is a configurable HTML/Markdown renderer that provides:
 * - Markdown to HTML conversion
 * - HTML sanitization and tag transformation
 * - Asset embedding and resizing
 * - Link handling and security checks
 * - Plugin system for pre/post processing
 */
export class DefaultRenderer {
    private options: RendererOptions;
    private tagTransformingSanitizer: TagTransformingSanitizer;
    private domParser: HtmlDOMParser;
    private plugins: RendererPlugin[] = [];
    private md: MarkdownIt;

    /**
     * Creates a new DefaultRenderer instance
     * @param options - Configuration options for the renderer
     * @param localization - Optional localization settings. Uses default if not provided
     */
    public constructor(options: RendererOptions, localization: LocalizationOptions = Localization.DEFAULT) {
        this.validate(options);
        this.options = options;

        Localization.validate(localization);

        this.tagTransformingSanitizer = new TagTransformingSanitizer(
            {
                iframeWidth: this.options.assetsWidth,
                iframeHeight: this.options.assetsHeight,
                addNofollowToLinks: this.options.addNofollowToLinks,
                addTargetBlankToLinks: this.options.addTargetBlankToLinks,
                cssClassForInternalLinks: this.options.cssClassForInternalLinks,
                cssClassForExternalLinks: this.options.cssClassForExternalLinks,
                noImage: this.options.doNotShowImages,
                isLinkSafeFn: this.options.isLinkSafeFn,
                addExternalCssClassToMatchingLinksFn: this.options.addExternalCssClassToMatchingLinksFn
            },
            localization
        );

        this.domParser = new HtmlDOMParser(
            {
                width: this.options.assetsWidth,
                height: this.options.assetsHeight,
                ipfsPrefix: this.options.ipfsPrefix,
                baseUrl: this.options.baseUrl,
                imageProxyFn: this.options.imageProxyFn,
                hashtagUrlFn: this.options.hashtagUrlFn,
                usertagUrlFn: this.options.usertagUrlFn,
                hideImages: this.options.doNotShowImages
            },
            localization
        );

        this.plugins = options.plugins || [];

        this.md = new MarkdownIt({
            html: true,
            breaks: this.options.breaks,
            typographer: false,
            quotes: "\"\"\'\'",
            highlight: (str: string, lang: string): string => {
                if (lang && hljs.getLanguage(lang)) {
                    const result = hljs.highlight(str, {
                        language: lang,
                        ignoreIllegals: true,
                    });
                    return result.value;
                }
                return "";
            },
        });
        this.md.use(markdownItSpoiler);
    }

    /**
     * Renders the input text to HTML
     * @param input - Markdown or HTML text to render
     * @param postContext - Optional context about the post (author/permlink) for logging
     * @returns Rendered and processed HTML
     * @throws Will throw if input is empty or invalid
     */
    public render(input: string, postContext?: PostContext): string {
        // Validate input
        if (!input || typeof input !== 'string') {
            return '';
        }
        return this.doRender(input, postContext);
    }

    /**
     * Renders the input text to HTML with a specific locale
     * @param text - Markdown or HTML text to render
     * @param postContext - Optional context about the post for logging
     * @returns Rendered and processed HTML
     * @throws Will throw if input is empty or invalid
     */
    private doRender(text: string, postContext?: PostContext): string {
        // Pre-process with plugins
        text = this.runPluginPhase('preProcess', text);
        // Preliminary sanitization
        text = PreliminarySanitizer.preliminarySanitize(text);
        // Check if the text is HTML or Markdown
        const isHtml = this.isHtml(text);
        // If it's HTML, skip rendering
        // If it's Markdown, we need to render it to HTML
        text = isHtml ? text : this.renderMarkdown(text);
        // Add HTML tags if needed
        text = this.wrapRenderedTextWithHtmlIfNeeded(text);
        // Parse the HTML and sanitize it
        text = this.domParser.parse(text).getParsedDocumentAsString();
        // Check for script tags and other security issues
        text = this.sanitize(text, postContext);
        // Check for security issues
        SecurityChecker.checkSecurity(text, {allowScriptTag: this.options.allowInsecureScriptTags});
        // Embed assets and resize them
        text = this.domParser.embedder.insertAssets(text);
        // Post-process with plugins
        text = this.runPluginPhase('postProcess', text);
        return text;
    }
    /**
     * Runs a specific phase of the plugin system
     * @param phase - Phase to run (preProcess or postProcess)
     * @param text - Text to process
     * @returns Processed text
     */
    private runPluginPhase(phase: 'preProcess' | 'postProcess', text: string): string {
        return this.plugins.reduce((processedText, plugin) => {
            const processor = plugin[phase];
            return processor ? processor(processedText) : processedText;
        }, text);
    }

    /**
     * Converts Markdown text to HTML using markdown-it
     * @param text - Markdown text to convert
     * @returns HTML string converted from Markdown
     * @remarks
     * Uses the markdown-it library with the following settings:
     * - HTML is enabled
     * - Line breaks are controlled by options.breaks
     * - Typographer is disabled to prevent URLs from breaking when they contain double-dashes
     * - Smart quotes are set to ""''
     */
    private renderMarkdown(text: string): string {
        return this.md.render(text);
    }

    /**
     * Wraps the rendered text with HTML tags if they are not already present
     * @param renderedText - The text that has been rendered from Markdown or processed HTML
     * @returns The text wrapped in <html> tags if needed, or the original text if already wrapped
     * @remarks
     * This is needed to ensure consistent DOM parsing and to maintain proper HTML structure
     * for further processing steps like sanitization and asset embedding.
     */
    private wrapRenderedTextWithHtmlIfNeeded(renderedText: string): string {
        if (renderedText.indexOf('<html>') !== 0) {
            renderedText = '<html>' + renderedText + '</html>';
        }
        return renderedText;
    }

    /**
     * Determines if the input text is HTML by checking for specific patterns
     * @param text - Text to analyze
     * @returns True if the text appears to be HTML, false otherwise
     * @remarks
     * The method checks for two patterns:
     * 1. Text wrapped in <html> tags
     * 2. Text starting with <p> tag and ending with </p> tag
     */
    private isHtml(text: string): boolean {
        let html = false;
        const m = text.match(/^<html>([\S\s]*)<\/html>$/);
        if (m && m.length === 2) {
            html = true;
            text = m[1];
        } else {
            html = /^<p>[\S\s]*<\/p>/.test(text);
        }
        return html;
    }

    /**
     * Sanitizes the HTML text by removing potentially harmful content
     * @param text - The HTML text to sanitize
     * @param postContext - Optional context about the post for logging
     * @returns Sanitized HTML text
     * @remarks
     * This method can be skipped if skipSanitization option is set to true.
     * When sanitization is not skipped, it uses TagTransformingSanitizer to:
     * - Remove dangerous HTML tags and attributes
     * - Transform certain tags according to renderer options
     * - Apply security policies to links and embedded content
     */
    private sanitize(text: string, postContext?: PostContext): string {
        if (this.options.skipSanitization) {
            return text;
        }

        return this.tagTransformingSanitizer.sanitize(text, postContext);
    }
    /**
     * Validates the renderer options
     * @param o - Renderer options to validate
     * @throws Will throw if any option is invalid
     */
    private validate(o: RendererOptions) {
        if (!o || typeof o !== 'object') throw new Error('RendererOptions must be an object');
        if (!o.baseUrl || typeof o.baseUrl !== 'string') throw new Error('RendererOptions.baseUrl must be a non-empty string');
        if (typeof o.breaks !== 'boolean') throw new Error('RendererOptions.breaks must be a boolean');
        if (typeof o.skipSanitization !== 'boolean') throw new Error('RendererOptions.skipSanitization must be a boolean');
        if (typeof o.addNofollowToLinks !== 'boolean') throw new Error('RendererOptions.addNofollowToLinks must be a boolean');
        if (o.addTargetBlankToLinks !== undefined && typeof o.addTargetBlankToLinks !== 'boolean') throw new Error('RendererOptions.addTargetBlankToLinks must be a boolean');
        if (o.cssClassForInternalLinks !== undefined && typeof o.cssClassForInternalLinks !== 'string') throw new Error('RendererOptions.cssClassForInternalLinks must be a string');
        if (o.cssClassForExternalLinks !== undefined && typeof o.cssClassForExternalLinks !== 'string') throw new Error('RendererOptions.cssClassForExternalLinks must be a string');
        if (typeof o.doNotShowImages !== 'boolean') throw new Error('RendererOptions.doNotShowImages must be a boolean');
        if (o.ipfsPrefix !== undefined && typeof o.ipfsPrefix !== 'string') throw new Error('RendererOptions.ipfsPrefix must be a string');
        if (!Number.isInteger(o.assetsWidth) || o.assetsWidth <= 0) throw new Error('RendererOptions.assetsWidth must be a positive integer');
        if (!Number.isInteger(o.assetsHeight) || o.assetsHeight <= 0) throw new Error('RendererOptions.assetsHeight must be a positive integer');
        if (typeof o.imageProxyFn !== 'function') throw new Error('RendererOptions.imageProxyFn must be a function');
        if (typeof o.hashtagUrlFn !== 'function') throw new Error('RendererOptions.hashtagUrlFn must be a function');
        if (typeof o.usertagUrlFn !== 'function') throw new Error('RendererOptions.usertagUrlFn must be a function');
        if (typeof o.isLinkSafeFn !== 'function') throw new Error('RendererOptions.isLinkSafeFn must be a function');
        if (typeof o.addExternalCssClassToMatchingLinksFn !== 'function') throw new Error('RendererOptions.addExternalCssClassToMatchingLinksFn must be a function');
    }
}

/**
 * Configuration options for DefaultRenderer
 */
export interface RendererOptions {
    /** Base URL for resolving relative links */
    baseUrl: string;
    /** Enable line breaks in markdown */
    breaks: boolean;
    /** Skip HTML sanitization (use with caution) */
    skipSanitization: boolean;
    /** Allow script tags in output (dangerous) */
    allowInsecureScriptTags: boolean;
    /** Add nofollow attribute to links */
    addNofollowToLinks: boolean;
    /** Add target="_blank" to links */
    addTargetBlankToLinks?: boolean;
    /** CSS class to add to internal links */
    cssClassForInternalLinks?: string;
    /** CSS class to add to external links */
    cssClassForExternalLinks?: string;
    /** Disable image rendering */
    doNotShowImages: boolean;
    /** IPFS gateway prefix */
    ipfsPrefix?: string;
    /** Default width for embedded assets */
    assetsWidth: number;
    /** Default height for embedded assets */
    assetsHeight: number;
    /** Function to proxy image URLs */
    imageProxyFn: (url: string) => string;
    /** Function to generate hashtag URLs */
    hashtagUrlFn: (hashtag: string) => string;
    /** Function to generate user profile URLs */
    usertagUrlFn: (account: string) => string;
    /** Function to check if a link is safe */
    isLinkSafeFn: (url: string) => boolean;
    /** Function to determine if external CSS class should be added */
    addExternalCssClassToMatchingLinksFn: (url: string) => boolean;
    /** Optional array of renderer plugins */
    plugins?: RendererPlugin[];
}
