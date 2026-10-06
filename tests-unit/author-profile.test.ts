import { describe, expect, it } from 'vitest'
import { renderAuthorProfileCard, renderProfileElement, renderSocialLinks } from '../src/shared/components/author-profile/render'
import { defaultAuthorProfileLayout } from '../src/shared/components/author-profile/types'
import type { AuthorProfileData, AuthorProfileSettings } from '../src/shared/components/author-profile/types'
import type { SocialLink } from '../src/components/admin/types/social'

const ATTR_RE = /([^\s"'=<>/]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g
const TAG_RE = /<[a-z][^\s/>]*((?:\s*[^\s"'=<>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>/gi

function attributes(html: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (const tag of html.matchAll(TAG_RE)) {
    for (const attr of tag[1].matchAll(ATTR_RE)) {
      const [name, ...rest] = attr[0].split('=')
      out.push([name.trim().toLowerCase(), rest.join('=').trim().replace(/^["']|["']$/g, '')])
    }
  }
  return out
}

const XSS = '<script>alert(1)</script>"><img src=x onerror=alert(1)>'

const data: AuthorProfileData = {
  username: 'alice',
  displayName: XSS,
  about: XSS,
  location: XSS,
  website: 'javascript:alert(1)',
  coverImage: "https://x.com/a.png');background:url('javascript:alert(1)",
  avatarUrl: 'javascript:alert(1)',
  reputation: 50,
  followers: 1,
  following: 1,
  postCount: 1,
  joinDate: XSS,
  hivePower: 0,
  votingPower: 0,
  hiveBalance: 0,
  hbdBalance: 0,
}

function settings(socialLinks: SocialLink[] = []): AuthorProfileSettings {
  return {
    layout: defaultAuthorProfileLayout,
    avatarSize: 64,
    coverHeight: 120,
    usernameSize: 16,
    displayNameSize: 20,
    aboutSize: 14,
    statsSize: 14,
    metaSize: 12,
    socialLinks,
  }
}

describe('author-profile render', () => {
  it.each(['displayName', 'about', 'location', 'joinDate'])('escapes %s', (id) => {
    const html = renderProfileElement(id, data, settings()) ?? ''
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })

  it('drops a javascript: website', () => {
    expect(renderProfileElement('website', data, settings())).toBeNull()
  })

  it('falls back to the default avatar for a javascript: avatar', () => {
    expect(renderProfileElement('avatar', data, settings())).toContain('src="/hive-logo.png"')
  })

  it('full card has no inline handlers and no javascript: URLs in attributes', () => {
    const html = renderAuthorProfileCard({ ...data, website: 'example.com' }, settings())
    const attrs = attributes(html)
    expect(attrs.filter(([name]) => name.startsWith('on'))).toEqual([])
    expect(attrs.filter(([, value]) => /^\s*javascript:/i.test(value))).toEqual([])
    expect(html).not.toContain('<script')
  })

  it('cover image cannot break out of the CSS url() token', () => {
    const html = renderProfileElement('coverImage', data, settings()) ?? ''
    const style = html.match(/style="([^"]*)"/)?.[1] ?? ''
    const url_token = style.match(/url\('([^']*)'\)/)?.[1]
    if (url_token !== undefined) expect(url_token).not.toMatch(/['"()\\\s]/)
    expect(style.match(/url\(/g)?.length ?? 0).toBeLessThanOrEqual(1)
  })
})

describe('author-profile social links', () => {
  const link = (platform: SocialLink['platform'], username: string, url?: string): SocialLink => ({ id: 'l', platform, username, url })

  it.each([
    link('custom', 'javascript:alert(1)'),
    link('custom', 'JavaScript:alert(1)'),
    link('custom', 'data:text/html,<script>alert(1)</script>'),
    link('x', 'javascript:alert(1)'),
    link('x', '', 'javascript:alert(1)'),
  ])('rejects unsafe link %j', (l) => {
    const html = renderSocialLinks([l])
    const attrs = attributes(html)
    expect(attrs.filter(([, value]) => /^\s*(?:javascript|data):/i.test(value))).toEqual([])
    expect(attrs.filter(([name]) => name.startsWith('on'))).toEqual([])
  })

  it('custom link with attribute breakout stays inside href', () => {
    const html = renderSocialLinks([link('custom', 'https://example.com/"onmouseover="alert(1)')])
    expect(attributes(html).filter(([name]) => name.startsWith('on'))).toEqual([])
  })

  it('renders a valid https custom link', () => {
    expect(renderSocialLinks([link('custom', 'https://example.com/')])).toContain('href="https://example.com/"')
  })
})
