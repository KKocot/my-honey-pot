// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { AbstractEmbedder, type EmbedMetadata } from "./AbstractEmbedder";

export class TwitterEmbedder extends AbstractEmbedder {
  public type = "twitter";

  private static readonly link_regex =
    /https?:\/\/(?:www\.)?(twitter|x)\.com\/\w+\/status\/(\d+)[^ ]*/i;

  private static readonly id_regex =
    /(?:twitter|x)\.com\/\w+\/status\/(\d+)/i;

  private static extract_metadata(
    data: string
  ): { id: string; url: string } | undefined {
    if (!data) {
      return undefined;
    }

    const m1 = data.match(TwitterEmbedder.link_regex);
    const url = m1 ? m1[0] : undefined;
    if (!url) {
      return undefined;
    }

    const m2 = url.match(TwitterEmbedder.id_regex);
    const id = m2 && m2.length >= 2 ? m2[1] : undefined;
    if (!id) {
      return undefined;
    }

    return { id, url };
  }

  public getEmbedMetadata(child: Text): EmbedMetadata | undefined {
    try {
      const metadata = TwitterEmbedder.extract_metadata(child.data);
      if (!metadata) {
        return undefined;
      }
      return {
        id: metadata.id,
        url: metadata.url,
      };
    } catch (error) {
      console.error("[TwitterEmbedder] Error extracting metadata:", error);
    }
    return undefined;
  }

  public processEmbed(
    id: string,
    _size: { width: number; height: number }
  ): string {
    const tweet_url = `https://platform.twitter.com/embed/Tweet.html?id=${id}`;
    return `<div class="tweet-embed"><iframe src="${tweet_url}" sandbox="allow-scripts allow-same-origin allow-popups" referrerpolicy="no-referrer" loading="lazy"></iframe></div>`;
  }
}
