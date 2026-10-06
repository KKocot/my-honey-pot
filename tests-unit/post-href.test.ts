import { describe, expect, it } from 'vitest'
import { get_post_href } from '../src/shared/components/post-card/utils'
import { renderPostCardContent } from '../src/shared/components/post-card/render'
import type { PostCardData, PostCardSettings } from '../src/shared/components/post-card/types'
import { HIVE_BLOG_URL } from '../src/lib/config'

const blog_origin = new URL(HIVE_BLOG_URL).origin

describe('get_post_href', () => {
  it('links the owner post to the local route', () => {
    expect(get_post_href('alice', 'my-post', 'alice')).toBe('/my-post')
  })

  it('compares the owner case-insensitively', () => {
    expect(get_post_href('Alice', 'my-post', 'aLICE')).toBe('/my-post')
  })

  it('links a foreign post (reblog) to HIVE_BLOG_URL', () => {
    expect(get_post_href('bob', 'his-post', 'alice')).toBe(`${blog_origin}/@bob/his-post`)
  })

  it('encodes a hostile permlink on the local route', () => {
    expect(get_post_href('alice', '../x?y#z', 'alice')).toBe('/..%2Fx%3Fy%23z')
  })

  it.each([
    ['bob/../../evil', 'p'],
    ['bob@evil.com', 'p'],
    ['bob', '../../@evil/x'],
    ['bob', '//evil.com'],
  ])('keeps a hostile author/permlink (%j, %j) on the Hive frontend', (author, permlink) => {
    const href = get_post_href(author, permlink, 'alice')
    const url = new URL(href)
    expect(url.origin).toBe(blog_origin)
    expect(url.pathname.startsWith(`/@${encodeURIComponent(author)}/`)).toBe(true)
  })
})

describe('post-card avatar and thumbnail', () => {
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
          ],
        },
      ],
    },
  } as PostCardSettings

  const data: PostCardData = {
    permlink: 'post',
    title: 't',
    body: 'b',
    thumbnail: 'https://images.hive.blog/x.png',
    tags: [],
    publishedAt: new Date('2026-01-01T00:00:00Z'),
    votesCount: 0,
    commentsCount: 0,
    payout: 0,
    author: 'bob',
  }

  it.each([false, true])('links the avatar to the external Hive profile (vertical=%s)', (vertical) => {
    const html = renderPostCardContent(data, settings, vertical)
    expect(html).toContain(`href="${blog_origin}/@bob" target="_blank" rel="noopener noreferrer"`)
    expect(html).not.toContain('href="/@bob"')
  })

  it.each([false, true])('marks the thumbnail to be hidden on load error (vertical=%s)', (vertical) => {
    const html = renderPostCardContent(data, settings, vertical)
    expect(html).toMatch(/<img src="https:\/\/images\.hive\.blog\/x\.png" alt="" data-fallback="hide"/)
  })
})
