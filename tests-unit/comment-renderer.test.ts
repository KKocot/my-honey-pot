import { describe, expect, it } from 'vitest'
import { render_comment_body } from '../src/lib/comment_renderer'

describe('render_comment_body (SSR, no window)', () => {
  it('runs without a DOM', () => {
    expect(typeof window).toBe('undefined')
  })

  it('returns empty string for empty or blank body', () => {
    expect(render_comment_body('')).toBe('')
    expect(render_comment_body('   \n ')).toBe('')
  })

  it('strips event handler attributes from img', () => {
    const html = render_comment_body('<img src=x onerror=alert(1)>')
    expect(html).not.toMatch(/onerror/i)
    expect(html).not.toMatch(/alert\(1\)/)
  })

  it('strips script tags and their content', () => {
    const html = render_comment_body('hello <script>alert(1)</script> world')
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/alert\(1\)/)
    expect(html).toContain('hello')
  })

  it('drops iframes, including YouTube embeds', () => {
    const html = render_comment_body(
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>\n\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ'
    )
    expect(html).not.toMatch(/<iframe/i)
  })

  it('drops tags outside the comment allowlist', () => {
    const html = render_comment_body('<video src="https://x.com/a.mp4"></video><u>u</u><font>f</font> text')
    expect(html).not.toMatch(/<(video|u|font)\b/i)
    expect(html).toContain('text')
  })

  it('drops non-allowlisted URL schemes', () => {
    const html = render_comment_body('<a href="ftp://x.com/a">ftp</a> <a href="//evil.com">rel</a>')
    expect(html).not.toMatch(/href="ftp:/i)
    expect(html).not.toMatch(/href="\/\/evil/i)
  })

  it('still renders markdown', () => {
    expect(render_comment_body('**bold**')).toMatch(/<strong>bold<\/strong>/)
  })
})
