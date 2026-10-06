import { beforeEach, describe, expect, it, vi } from 'vitest'

const discussion = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('@hiveio/workerbee/blog-logic', () => ({
  configureEndpoints: vi.fn(),
  DataProvider: class {},
  getWax: vi.fn(),
  withRetry: vi.fn(async () => discussion.current),
}))

const { fetch_post_replies } = await import('../src/lib/queries')

function comment(author: string, permlink: string, parent_author: string, parent_permlink: string) {
  return {
    author,
    permlink,
    parent_author,
    parent_permlink,
    body: 'x',
    created: '2026-01-01T00:00:00',
    author_reputation: 50,
    author_role: 'guest',
    stats: { gray: false, hide: false },
  }
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('fetch_post_replies', () => {
  beforeEach(() => {
    discussion.current = {
      'owner/my-threads': comment('owner', 'my-threads', '', 'hive'),
      'owner/t1': comment('owner', 't1', 'owner', 'my-threads'),
      'mallory/spoof': comment('mallory', 'spoof', 'owner', 'my-threads'),
      'mallory/reply': comment('mallory', 'reply', 'owner', 't1'),
      'owner/t2': comment('owner', 't2', 'owner', 'my-threads'),
    }
  })

  it('keeps only the owner\'s top-level entries for my-threads', async () => {
    const result = await fetch_post_replies('owner', 'my-threads')
    expect(result.tree.map((n) => n.comment.author)).toEqual(['owner', 'owner'])
    expect(result.total_count).toBe(2)
  })

  it('keeps replies from others nested under an owner thread', async () => {
    const result = await fetch_post_replies('owner', 'my-threads')
    const t1 = result.tree.find((n) => n.comment.permlink === 't1')
    expect(t1?.children.map((n) => n.comment.author)).toEqual(['mallory'])
  })

  it('does not filter regular posts', async () => {
    discussion.current = {
      'owner/post': comment('owner', 'post', '', 'hive'),
      'mallory/c': comment('mallory', 'c', 'owner', 'post'),
    }
    const result = await fetch_post_replies('owner', 'post')
    expect(result.tree.map((n) => n.comment.author)).toEqual(['mallory'])
  })
})
