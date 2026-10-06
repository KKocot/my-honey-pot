import { describe, expect, it } from 'vitest'
import type { BridgePost } from '@hiveio/workerbee/blog-logic'
import { renderPostCard, renderPostCardContent, renderPostsGrid } from '../src/shared/components/post-card/render'
import { getPostThumbnail, getThumbnailUrl } from '../src/shared/components/post-card/utils'
import type { PostCardData, PostCardSettings, PostsGridSettings } from '../src/shared/components/post-card/types'

const ATTR_RE = /([^\s"'=<>/]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g
const TAG_RE = /<[a-z][^\s/>]*((?:\s*[^\s"'=<>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>/gi

function inline_handlers(html: string): string[] {
  const names: string[] = []
  for (const tag of html.matchAll(TAG_RE)) {
    for (const attr of tag[1].matchAll(ATTR_RE)) names.push(attr[1].toLowerCase())
  }
  return names.filter((name) => name.startsWith('on'))
}

function tag_attrs(tag_body: string): Map<string, string> {
  const attrs = new Map<string, string>()
  for (const attr of tag_body.matchAll(ATTR_RE)) {
    const raw = attr[0].slice(attr[1].length).replace(/^\s*=\s*/, '')
    attrs.set(attr[1].toLowerCase(), raw.replace(/^(["'])([\s\S]*)\1$/, '$2'))
  }
  return attrs
}

function overlay_links(html: string): Map<string, string>[] {
  const links: Map<string, string>[] = []
  for (const tag of html.matchAll(TAG_RE)) {
    if (!/^<a\b/i.test(tag[0])) continue
    const attrs = tag_attrs(tag[1])
    if ((attrs.get('class') ?? '').split(/\s+/).includes('post-card-link')) links.push(attrs)
  }
  return links
}

function overlay_link_hrefs(html: string): string[] {
  return overlay_links(html).map((attrs) => attrs.get('href') ?? '')
}

function max_anchor_depth(html: string): number {
  let depth = 0
  let max = 0
  for (const match of html.matchAll(/<(\/?)a\b[^>]*>/gi)) {
    depth += match[1] ? -1 : 1
    max = Math.max(max, depth)
  }
  return max
}

const settings: PostCardSettings = {
  thumbnailSizePx: 96,
  cardPaddingPx: 16,
  cardBorderRadiusPx: 8,
  titleSizePx: 18,
  summaryMaxLength: 120,
  maxTags: 3,
  cardBorder: true,
  postCardLayout: {
    sections: [
      {
        id: 's1',
        orientation: 'horizontal',
        children: [
          { type: 'element', id: 'thumbnail' },
          { type: 'element', id: 'avatar' },
          { type: 'element', id: 'title' },
          { type: 'element', id: 'summary' },
          { type: 'element', id: 'tags' },
        ],
      },
    ],
  },
}

function bridge_post(image: unknown): BridgePost {
  return { json_metadata: JSON.stringify({ image: [image] }) } as unknown as BridgePost
}

function card_data(overrides: Partial<PostCardData> = {}): PostCardData {
  return {
    permlink: 'post',
    title: '<script>alert(1)</script>',
    body: '<img src=x onerror=alert(1)>',
    thumbnail: null,
    tags: ['"><svg onload=alert(1)>'],
    publishedAt: new Date('2026-01-01T00:00:00Z'),
    votesCount: 1,
    commentsCount: 0,
    payout: 0,
    author: 'alice"><img src=x onerror=alert(1)>',
    ...overrides,
  }
}

const ATTRIBUTE_BREAKOUT_IMAGES = [
  'https://x" onerror=alert(1)',
  'https://x.com/a.png" onerror=alert(1)',
  "https://x.com/a.png' onerror='alert(1)",
  'javascript:alert(1)',
]

describe('post-card thumbnail', () => {
  // WHATWG URL keeps "'" in paths; renderers rely on escape_html + double-quoted attributes for it.
  it.each(ATTRIBUTE_BREAKOUT_IMAGES)('getPostThumbnail never emits a double quote or space for %j', (image) => {
    const thumb = getPostThumbnail(bridge_post(image), settings.thumbnailSizePx)
    if (thumb !== null) {
      expect(thumb).toMatch(/^https:\/\//)
      expect(thumb).not.toMatch(/["\s<>]/)
    }
  })

  it('rejects javascript: thumbnails', () => {
    expect(getPostThumbnail(bridge_post('javascript:alert(1)'), 96)).toBeNull()
    expect(getThumbnailUrl('javascript:alert(1)', 96)).toBeNull()
  })

  it.each(ATTRIBUTE_BREAKOUT_IMAGES)('rendered card has no inline handler for %j', (image) => {
    const thumbnail = getPostThumbnail(bridge_post(image), settings.thumbnailSizePx)
    for (const vertical of [false, true]) {
      const html = renderPostCard(card_data({ thumbnail }), settings, vertical)
      expect(inline_handlers(html)).toEqual([])
    }
  })

  it('escapes a raw malicious thumbnail passed directly in card data', () => {
    const html = renderPostCardContent(card_data({ thumbnail: 'https://x.com/a.png" onerror="alert(1)' }), settings)
    expect(inline_handlers(html)).toEqual([])
  })
})

describe('post-card text fields', () => {
  it('escapes title, summary, tags and author', () => {
    const html = renderPostCard(card_data(), settings)
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<svg onload')
    expect(inline_handlers(html)).toEqual([])
  })

  it.each(['javascript:alert(1)', '//evil.com', '/\\evil.com', '" onmouseover="alert(1)'])(
    'falls back to the permlink for unsafe link href %j',
    (link) => {
      const html = renderPostCard(card_data(), settings, false, link)
      expect(html.startsWith('<article')).toBe(true)
      expect(overlay_link_hrefs(html)).toEqual(['/post'])
    }
  )

  it('keeps a safe relative link href', () => {
    expect(overlay_link_hrefs(renderPostCard(card_data(), settings, false, '/@alice/post'))).toEqual(['/@alice/post'])
  })

  it('labels the overlay link with the title, falling back to the permlink', () => {
    const titled = overlay_links(renderPostCard(card_data({ title: 'Hello & bye' }), settings))
    expect(titled.map((a) => a.get('aria-label'))).toEqual(['Hello &amp; bye'])
    const untitled = overlay_links(renderPostCard(card_data({ title: '' }), settings))
    expect(untitled.map((a) => a.get('aria-label'))).toEqual(['post'])
  })

  it('opens an external (reblog) link in a new tab with noopener noreferrer', () => {
    const [link] = overlay_links(renderPostCard(card_data(), settings, false, 'https://hive.blog/@bob/post'))
    expect(link.get('href')).toBe('https://hive.blog/@bob/post')
    expect(link.get('target')).toBe('_blank')
    expect(link.get('rel')).toBe('noopener noreferrer')
  })

  it('keeps internal links in the same tab', () => {
    const [link] = overlay_links(renderPostCard(card_data(), settings, false, '/@alice/post'))
    expect(link.has('target')).toBe(false)
    expect(link.has('rel')).toBe(false)
  })

  it('never nests anchors', () => {
    for (const vertical of [false, true]) {
      const html = renderPostCard(card_data({ author: 'alice' }), settings, vertical, '/@alice/post')
      const opened = html.match(/<a\b/gi)?.length ?? 0
      expect(opened).toBeGreaterThanOrEqual(2)
      expect(html.match(/<\/a>/gi)?.length).toBe(opened)
      expect(max_anchor_depth(html)).toBe(1)
    }
  })
})

function article_attrs(html: string): Map<string, string> {
  const match = html.match(TAG_RE)
  expect(match?.[0].startsWith('<article')).toBe(true)
  return tag_attrs(match![0].replace(/^<article/, '').replace(/>$/, ''))
}

function untrusted(overrides: Record<string, unknown>): PostCardSettings {
  return { ...settings, ...overrides } as PostCardSettings
}

const BREAKOUTS = ['" onmouseover="alert(1)', '"><script>alert(1)</script>', "' onfocus='alert(1)"]

function expect_no_breakout(html: string) {
  expect(html).not.toContain('<script')
  expect(inline_handlers(html)).toEqual([])
  expect(html.match(/<article\b/g)?.length).toBe(1)
}

describe('post-card untrusted settings', () => {
  it('renders valid settings unchanged', () => {
    const html = renderPostCard(
      card_data({ author: 'alice' }),
      untrusted({ cardHoverEffect: 'lift', cardHoverShadow: 'xl', cardTransitionDuration: 300, cardHoverScale: 1.05 })
    )
    const attrs = article_attrs(html)
    expect(attrs.get('class')).toContain('hover-lift')
    expect(attrs.get('data-shadow')).toBe('xl')
    expect(attrs.get('style')).toBe(
      'padding: 16px; border-radius: 8px; border: 1px solid var(--color-border); --card-transition: 300ms; --card-hover-scale: 1.05; '
    )
  })

  it.each(BREAKOUTS)('does not let string payload %j escape attributes', (payload) => {
    const html = renderPostCard(
      card_data({ author: 'alice' }),
      untrusted({
        cardHoverEffect: payload,
        cardHoverShadow: payload,
        cardPaddingPx: payload,
        cardBorderRadiusPx: payload,
        cardTransitionDuration: payload,
        cardHoverScale: payload,
        cardHoverBrightness: payload,
        thumbnailSizePx: payload,
        titleSizePx: payload,
      }),
      false,
      undefined,
      payload
    )
    expect_no_breakout(html)
    const style = article_attrs(html).get('style') ?? ''
    expect(style).toMatch(/^padding: 24px; border-radius: 16px;/)
    expect(html).toContain('font-size: 20px;')
  })

  it('falls back to "none" for an unknown hover effect', () => {
    const attrs = article_attrs(renderPostCard(card_data(), untrusted({ cardHoverEffect: 'explode', cardHoverShadow: 'lg' })))
    expect(attrs.get('class')).not.toMatch(/hover-/)
    expect(attrs.has('data-shadow')).toBe(false)
  })

  it('falls back to "md" for an unknown shadow size', () => {
    for (const shadow of ['huge', '__proto__', 'constructor']) {
      const attrs = article_attrs(renderPostCard(card_data(), untrusted({ cardHoverEffect: 'shadow', cardHoverShadow: shadow })))
      expect(attrs.get('data-shadow')).toBe('md')
    }
  })

  it.each([NaN, Infinity, -Infinity])('uses defaults for non-finite number %s', (value) => {
    const style = article_attrs(
      renderPostCard(
        card_data(),
        untrusted({ cardHoverEffect: 'lift', cardPaddingPx: value, cardBorderRadiusPx: value, cardTransitionDuration: value, cardHoverScale: value })
      )
    ).get('style')
    expect(style).toContain('padding: 24px; border-radius: 16px;')
    if (Number.isNaN(value)) expect(style).not.toContain('--card-')
    else expect(style).toContain('--card-transition: 200ms; --card-hover-scale: 1.02;')
    expect(style).not.toMatch(/NaN|Infinity/)
  })

  it('clamps negative and oversized numbers to the admin slider range', () => {
    const style = article_attrs(
      renderPostCard(
        card_data(),
        untrusted({ cardHoverEffect: 'glow', cardPaddingPx: -10, cardBorderRadiusPx: 9999, cardTransitionDuration: -5, cardHoverBrightness: 50 })
      )
    ).get('style')
    expect(style).toContain('padding: 0px; border-radius: 48px;')
    expect(style).toContain('--card-transition: 50ms; --card-hover-brightness: 1.2;')
  })

  it('clamps thumbnail, title size and tag count', () => {
    const html = renderPostCardContent(
      card_data({ thumbnail: 'https://x.com/a.png', tags: ['a', 'b', 'c'] }),
      untrusted({ thumbnailSizePx: -1, titleSizePx: Infinity, maxTags: NaN })
    )
    expect(html).toContain('width: 32px; height: 32px;')
    expect(html).toContain('font-size: 20px;')
    expect(html.match(/#[abc]</g)?.length).toBe(3)
  })

  it.each(BREAKOUTS)('escapes extraStyle %j', (payload) => {
    expect_no_breakout(renderPostCard(card_data({ author: 'alice' }), settings, false, undefined, payload))
  })
})

describe('posts grid untrusted settings', () => {
  const grid = (overrides: Record<string, unknown>) =>
    renderPostsGrid(['<article></article>'], { layout: 'grid', columns: 2, gap_px: 24, ...overrides } as PostsGridSettings)

  it('renders valid settings unchanged', () => {
    expect(grid({ columns: 3, gap_px: 16 })).toBe(
      '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;"><article></article></div>'
    )
  })

  it.each(BREAKOUTS)('does not let %j escape the style attribute', (payload) => {
    for (const layout of ['grid', 'list', 'masonry']) {
      const html = grid({ layout, columns: payload, gap_px: payload })
      expect(html).not.toContain('<script')
      expect(inline_handlers(html)).toEqual([])
      expect(html).toContain('24px')
    }
  })

  it('clamps non-finite and out-of-range values', () => {
    expect(grid({ columns: NaN, gap_px: -Infinity })).toContain('repeat(2, 1fr); gap: 24px;')
    expect(grid({ columns: 99, gap_px: -3 })).toContain('repeat(4, 1fr); gap: 0px;')
  })
})
