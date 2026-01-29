import type {LocalizationOptions} from '../Localization';
import {AbstractEmbedder} from './AbstractEmbedder';
import {SpotifyEmbedder} from './SpotifyEmbedder';
import {ThreeSpeakEmbedder} from './ThreeSpeakEmbedder';
import {TwitchEmbedder} from './TwitchEmbedder';
import {VimeoEmbedder} from './VimeoEmbedder';
import {YoutubeEmbedder} from './YoutubeEmbedder';

export class AssetEmbedder {
    private readonly options: AssetEmbedderOptions;
    private readonly localization: LocalizationOptions;
    private readonly embedders: AbstractEmbedder[];

    public constructor(options: AssetEmbedderOptions, localization: LocalizationOptions) {
        AssetEmbedder.validate(options);
        this.options = options;
        this.localization = localization;
        this.embedders = [
            //
            new YoutubeEmbedder(),
            new VimeoEmbedder(),
            new TwitchEmbedder(options),
            new SpotifyEmbedder(),
            new ThreeSpeakEmbedder()
        ];
    }

    public static validate(o: AssetEmbedderOptions) {
        if (!o || typeof o !== 'object') throw new Error('AssetEmbedderOptions must be an object');
        if (o.ipfsPrefix !== undefined && typeof o.ipfsPrefix !== 'string') throw new Error('AssetEmbedderOptions.ipfsPrefix must be a string');
        if (!Number.isInteger(o.width) || o.width <= 0) throw new Error('AssetEmbedderOptions.width must be a positive integer');
        if (!Number.isInteger(o.height) || o.height <= 0) throw new Error('AssetEmbedderOptions.height must be a positive integer');
        if (typeof o.hideImages !== 'boolean') throw new Error('AssetEmbedderOptions.hideImages must be a boolean');
        if (!o.baseUrl || typeof o.baseUrl !== 'string') throw new Error('AssetEmbedderOptions.baseUrl must be a non-empty string');
        if (typeof o.imageProxyFn !== 'function') throw new Error('AssetEmbedderOptions.imageProxyFn must be a function');
        if (typeof o.hashtagUrlFn !== 'function') throw new Error('AssetEmbedderOptions.hashtagUrlFn must be a function');
        if (typeof o.usertagUrlFn !== 'function') throw new Error('AssetEmbedderOptions.usertagUrlFn must be a function');
    }

    /**
     * Processes the input string and embeds media assets like videos, music, etc.
     * Uses the configured width and height from the embedder options.
     *
     * @param input - The input string containing URLs or markdown content to process
     * @returns The processed string with embedded media assets replacing the original URLs
     */
    public insertAssets(input: string): string {
        const size = {
            width: this.options.width,
            height: this.options.height
        };
        return this.insertMarkedEmbedsToRenderedOutput(input, size);
    }

    /**
     * Processes input text that contains embed markers and replaces them with actual embedded content.
     * This method is typically used after initial markdown rendering to handle any special embed markers.
     *
     * @param input - The input string containing embed markers to be processed
     * @param size - Object containing width and height dimensions for the embedded content
     * @param size.width - The width to use for embedded content
     * @param size.height - The height to use for embedded content
     * @returns The processed string with embed markers replaced by actual embedded content
     */
    public insertMarkedEmbedsToRenderedOutput(input: string, size: {width: number; height: number}): string {
        return AbstractEmbedder.insertAllEmbeds(this.embedders, input, size);
    }

    public processTextNodeAndInsertEmbeds(node: HTMLObjectElement): {links: string[]; images: string[]} {
        const out: {links: string[]; images: string[]} = {links: [], images: []};

        for (const embedder of this.embedders) {
            const metadata = embedder.getEmbedMetadata(node);
            if (metadata) {
                node.data = node.data.replace(metadata.url, AbstractEmbedder.getEmbedMarker(metadata.id, embedder.type));
                if (metadata.image) out.images.push(metadata.image);
                if (metadata.link) out.links.push(metadata.link);
            }
        }
        return out;
    }
}

export interface AssetEmbedderOptions {
    ipfsPrefix?: string;
    width: number;
    height: number;
    hideImages: boolean;
    baseUrl: string;
    imageProxyFn: (url: string) => string;
    hashtagUrlFn: (hashtag: string) => string;
    usertagUrlFn: (account: string) => string;
}
