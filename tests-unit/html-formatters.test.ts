import { describe, expect, it } from 'vitest'
import { escape_html, safe_url, safe_relative_path, safe_css_url } from '../src/shared/formatters/html'

describe('escape_html', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escape_html(`<script>"x" & 'y'</script>`)).toBe(
      '&lt;script&gt;&quot;x&quot; &amp; &#039;y&#039;&lt;/script&gt;'
    )
  })
})

describe('safe_url', () => {
  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '',
    '   ',
    '/relative/path',
    '//evil.com/x',
  ])('rejects %j', (raw) => {
    expect(safe_url(raw)).toBe('')
  })

  it.each([undefined, null, 42, {}])('rejects non-string %j', (raw) => {
    expect(safe_url(raw)).toBe('')
  })

  it('accepts a valid https URL', () => {
    expect(safe_url('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
  })

  it('percent-encodes quotes and angle brackets so they cannot break an attribute', () => {
    const out = safe_url('https://example.com/a"><script>alert(1)</script>')
    expect(out).not.toBe('')
    expect(out).not.toMatch(/["<>]/)
  })

  it('respects a custom protocol allowlist', () => {
    expect(safe_url('http://example.com/', ['https:'])).toBe('')
  })
})

describe('safe_relative_path', () => {
  it('accepts a same-origin path', () => {
    expect(safe_relative_path('/x')).toBe('/x')
  })

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'x', '', '/x\n', '/x\u0000'])('rejects %j', (raw) => {
    expect(safe_relative_path(raw)).toBe('')
  })

  it('rejects non-strings', () => {
    expect(safe_relative_path(undefined)).toBe('')
  })
})

describe('safe_css_url', () => {
  it('accepts a plain https URL', () => {
    expect(safe_css_url('https://example.com/a.png')).toBe('https://example.com/a.png')
  })

  it('encodes characters able to close a CSS url() token', () => {
    const out = safe_css_url("https://example.com/a');background:url('x)")
    expect(out).not.toMatch(/['"()\\\s]/)
  })

  it.each(['javascript:alert(1)', 'data:image/png;base64,AAAA', ''])('rejects %j', (raw) => {
    expect(safe_css_url(raw)).toBe('')
  })
})
