import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { is_relative_internal, renderPostBody } from '../src/lib/renderer'
import { StaticConfig } from '../src/lib/renderer/StaticConfig'

const ATTR_RE = /([^\s"'=<>/]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g
const TAG_RE = /<([a-z][^\s/>]*)((?:\s*[^\s"'=<>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>/gi

interface Tag {
  name: string
  attrs: Record<string, string>
}

function tags(html: string): Tag[] {
  const out: Tag[] = []
  for (const m of html.matchAll(TAG_RE)) {
    const attrs: Record<string, string> = {}
    for (const a of m[2].matchAll(ATTR_RE)) {
      const eq = a[0].indexOf('=')
      const name = (eq === -1 ? a[0] : a[0].slice(0, eq)).trim().toLowerCase()
      attrs[name] = eq === -1 ? '' : a[0].slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    }
    out.push({ name: m[1].toLowerCase(), attrs })
  }
  return out
}

function iframes(html: string): Tag[] {
  return tags(html).filter((t) => t.name === 'iframe')
}

function links(html: string): Tag[] {
  return tags(html).filter((t) => t.name === 'a')
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('iframe whitelist (StaticConfig)', () => {
  const whitelisted = (src: string): string | null => {
    for (const item of StaticConfig.sanitization.iframeWhitelist) {
      if (item.re.test(src)) return item.fn(src)
    }
    return null
  }

  it.each([
    'https://wwwxyoutube.com/embed/x',
    'https://player-twitch.tv/?channel=x',
    'https://player-twitch.tv/',
    'https://youtube.com@evil.com/embed/x',
    'https://www.youtube.com.evil.com/embed/x',
    'https://evil.com/?https://www.youtube.com/embed/x',
    'javascript:alert(1)//youtube.com/embed/x',
  ])('rejects %j', (src) => {
    expect(whitelisted(src)).toBeNull()
  })

  it('rebuilds a valid youtube src from the extracted id', () => {
    expect(whitelisted('https://www.youtube.com/embed/abc_DEF-1?autoplay=1#t')).toBe('https://www.youtube.com/embed/abc_DEF-1')
  })
})

describe('renderPostBody iframes', () => {
  it.each([
    'https://wwwxyoutube.com/embed/x',
    'https://player-twitch.tv/',
    'https://player-twitch.tv/?channel=x',
    'https://youtube.com@evil.com/embed/x',
  ])('drops non-whitelisted iframe %j', (src) => {
    const html = renderPostBody(`<iframe src="${src}"></iframe>`)
    expect(iframes(html)).toEqual([])
  })

  it('keeps a valid youtube iframe with a forced sandbox', () => {
    const html = renderPostBody('<iframe src="https://www.youtube.com/embed/abc123"></iframe>')
    const [frame] = iframes(html)
    expect(frame).toBeDefined()
    expect(frame.attrs.src).toBe('https://www.youtube.com/embed/abc123')
    expect(frame.attrs.sandbox).toBe(StaticConfig.sanitization.iframeSandbox)
  })

  it('ignores author-supplied sandbox and allow', () => {
    const html = renderPostBody(
      '<iframe src="https://www.youtube.com/embed/abc123" sandbox="allow-top-navigation allow-scripts allow-same-origin allow-forms allow-modals" allow="camera; microphone; geolocation" srcdoc="<script>alert(1)</script>" onload="alert(1)"></iframe>'
    )
    const [frame] = iframes(html)
    expect(frame).toBeDefined()
    expect(frame.attrs.sandbox).toBe(StaticConfig.sanitization.iframeSandbox)
    expect(frame.attrs.sandbox).not.toContain('allow-top-navigation')
    expect(frame.attrs.allow).not.toMatch(/camera|microphone|geolocation/)
    expect(frame.attrs.srcdoc).toBeUndefined()
    expect(frame.attrs.onload).toBeUndefined()
  })
})

describe('renderPostBody script and handler removal', () => {
  it('removes <script>', () => {
    const html = renderPostBody('hello <script>alert(1)</script> world')
    expect(tags(html).some((t) => t.name === 'script')).toBe(false)
  })

  it('removes inline handlers from <img>', () => {
    const html = renderPostBody('<img src="https://images.hive.blog/x.png" onerror="alert(1)">')
    const handlers = tags(html).flatMap((t) => Object.keys(t.attrs).filter((n) => n.startsWith('on')))
    expect(handlers).toEqual([])
  })

  it('removes javascript: hrefs', () => {
    for (const body of [
      '<a href="javascript:alert(1)">x</a>',
      '<a href="JaVaScRiPt:alert(1)">x</a>',
      '<a href=" javascript:alert(1)">x</a>',
      '[x](javascript:alert(1))',
    ]) {
      const html = renderPostBody(body)
      const bad = tags(html).filter((t) => Object.values(t.attrs).some((v) => /javascript:/i.test(v)))
      expect(bad, body).toEqual([])
    }
  })
})

describe('renderPostBody protocol-relative links', () => {
  it.each(['//evil.com', '/\\evil.com'])('treats %j as external', (href) => {
    const html = renderPostBody(`<a href="${href}">x</a>`)
    const [a] = links(html)
    expect(a).toBeDefined()
    expect(a.attrs.class ?? '').toContain('link-external')
  })

  it('leaves a same-origin path without link-external', () => {
    const [a] = links(renderPostBody('<a href="/@alice/post">x</a>'))
    expect(a).toBeDefined()
    expect(a.attrs.class ?? '').not.toContain('link-external')
  })
})

describe('renderPostBody provider embeds', () => {
  it.each([
    ['vimeo', 'http://player.vimeo.com/video/123456?h=abcdef12&autoplay=1', 'https://player.vimeo.com/video/123456?h=abcdef12'],
    [
      'twitch',
      '//player.twitch.tv/?channel=somechan&parent=example.com&evil=1',
      'https://player.twitch.tv/?channel=somechan&parent=example.com',
    ],
    [
      'soundcloud',
      'https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F123&color=red',
      'https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F123&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true',
    ],
    [
      'spotify',
      'http://open.spotify.com/EMBED/Track/4uLU6hMCjMI75M1A2tKUQC?si=x',
      'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC',
    ],
    ['3speak', 'https://www.3speak.tv/watch?v=alice/abc-123&extra=1', 'https://3speak.tv/embed?v=alice/abc-123'],
    ['twitter', 'https://x.com/alice/status/1234567890', 'https://platform.twitter.com/embed/Tweet.html?id=1234567890'],
  ])('rebuilds a valid %s iframe as an https src', (_provider, src, expected) => {
    const [frame] = iframes(renderPostBody(`<iframe src="${src}"></iframe>`))
    expect(frame).toBeDefined()
    expect(frame.attrs.src.replace(/&amp;/g, '&')).toBe(expected)
    expect(frame.attrs.sandbox).toBe(StaticConfig.sanitization.iframeSandbox)
  })
})

describe('is_relative_internal', () => {
  it.each(['/\t/evil.com', '/\n/evil.com', '/\r/evil.com', '//evil.com', '/\\evil.com', 'https://evil.com', ''])(
    'rejects %j',
    (url) => {
      expect(is_relative_internal(url)).toBe(false)
    }
  )

  it('accepts a plain site path', () => {
    expect(is_relative_internal('/@alice/post')).toBe(true)
  })

  it('marks a tab-smuggled protocol-relative link as external', () => {
    const [a] = links(renderPostBody('<a href="/&#9;/evil.com">x</a>'))
    if (a) expect(a.attrs.class ?? '').toContain('link-external')
  })
})
