// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type {AssetEmbedderOptions} from './AssetEmbedder';
import linksRe from './Links';
import {AbstractEmbedder, type EmbedMetadata} from './AbstractEmbedder';

export class TwitchEmbedder extends AbstractEmbedder {
    public type = 'twitch';
    private readonly domain: string;

    public constructor(options: AssetEmbedderOptions) {
        super();
        this.domain = new URL(options.baseUrl).hostname;
    }

    public getEmbedMetadata(child: Text): EmbedMetadata | undefined {
        try {
            const data = child.data;
            const twitch = this.twitchId(data);
            if (!twitch) {
                return undefined;
            }

            return {
                ...twitch
            };
        } catch (error) {
            console.error('[TwitchEmbedder] Error extracting metadata:', error);
        }
        return undefined;
    }

    public processEmbed(id: string, size: {width: number; height: number}): string {
        const url = `https://player.twitch.tv/${id}&parent=${this.domain}`;
        return `<div class="videoWrapper"><iframe src="${url}" width="${size.width}" height="${size.height}" frameborder="0" allowfullscreen="allowfullscreen" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="no-referrer" loading="lazy"></iframe></div>`;
    }

    private twitchId(data: unknown): { id: string; url: string; canonical: string } | null {
        if (typeof data !== 'string') {
            return null;
        }
        const m = data.match(linksRe.twitch);
        if (!m || m.length < 3) {
            return null;
        }

        return {
            id: m[1] === `videos` ? `?video=${m[2]}` : `?channel=${m[2]}`,
            url: m[0],
            canonical: m[1] === `videos` ? `https://player.twitch.tv/?video=${m[2]}` : `https://player.twitch.tv/?channel=${m[2]}`
        };
    }
}
