// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { RendererPlugin } from "./RendererPlugin";

export class ImagePlaceholderPlugin implements RendererPlugin {
  name = "image-placeholder-plugin";

  postProcess(text: string): string {
    return wrap_images_with_placeholders(text);
  }
}

function wrap_images_with_placeholders(html: string): string {
  return html.replace(
    /(<img\b[^>]*>)/gi,
    (match) => {
      // Skip small icons/avatars
      if (
        /width=["']?\d{1,2}["']?/i.test(match) ||
        /class=["'][^"']*avatar/i.test(match)
      ) {
        return match;
      }
      return `<div class="img-placeholder-wrapper"><div class="img-placeholder-skeleton"></div>${match}</div>`;
    }
  );
}
