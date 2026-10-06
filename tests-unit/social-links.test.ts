import { describe, expect, it } from 'vitest'
import { build_social_url, type SocialLink } from '../src/components/admin/types/social'
import { renderSocialLinks } from '../src/shared/components/author-profile/render'

const unknown_link = { platform: 'myspace', username: 'alice' } as unknown as SocialLink

describe('build_social_url', () => {
  it('returns an empty string for a platform missing from platformInfos', () => {
    expect(build_social_url(unknown_link)).toBe('')
  })

  it('does not treat inherited Object keys as platforms', () => {
    expect(build_social_url({ platform: 'constructor', username: 'alice' } as unknown as SocialLink)).toBe('')
  })

  it('still builds a known platform URL', () => {
    expect(build_social_url({ platform: 'x', username: 'alice' } as SocialLink)).toBe('https://x.com/alice')
  })
})

describe('renderSocialLinks with stale platforms', () => {
  it('skips an unknown platform without rendering an empty <a>', () => {
    expect(renderSocialLinks([unknown_link])).toBe('')
  })

  it('renders the known links next to an unknown one', () => {
    const html = renderSocialLinks([unknown_link, { platform: 'x', username: 'alice' } as SocialLink])
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).toContain('href="https://x.com/alice"')
  })
})
