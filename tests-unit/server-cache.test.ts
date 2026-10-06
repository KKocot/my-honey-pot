import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@hiveio/workerbee/blog-logic', () => ({
  configureEndpoints: vi.fn(),
  resetWax: vi.fn(),
  getWax: vi.fn(),
  withRetry: vi.fn(),
  DataProvider: vi.fn(),
}))

const { read_through_server_cache, server_cache_keys, with_hive_timeout, HiveUnavailableError } = await import(
  '../src/lib/queries'
)
const { resetWax } = await import('@hiveio/workerbee/blog-logic')

let key_seq = 0
const next_key = () => `test:${++key_seq}`

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('read_through_server_cache', () => {
  it('serves a cached value within the 60 s TTL and reloads after it', async () => {
    const key = next_key()
    const load = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')
    expect(await read_through_server_cache(key, load, () => true)).toBe('first')
    vi.advanceTimersByTime(59_000)
    expect(await read_through_server_cache(key, load, () => true)).toBe('first')
    expect(load).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(2_000)
    expect(await read_through_server_cache(key, load, () => true)).toBe('second')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shares one in-flight load between concurrent readers', async () => {
    const key = next_key()
    let resolve!: (value: string) => void
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)))
    const a = read_through_server_cache(key, load, () => true)
    const b = read_through_server_cache(key, load, () => true)
    resolve('shared')
    expect(await Promise.all([a, b])).toEqual(['shared', 'shared'])
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('does not cache rejected loads', async () => {
    const key = next_key()
    const load = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok')
    await expect(read_through_server_cache(key, load, () => true)).rejects.toThrow('boom')
    expect(await read_through_server_cache(key, load, () => true)).toBe('ok')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('does not cache values rejected by is_cacheable (null)', async () => {
    const key = next_key()
    const load = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('found')
    const is_cacheable = (value: string | null) => value !== null
    expect(await read_through_server_cache(key, load, is_cacheable)).toBeNull()
    expect(await read_through_server_cache(key, load, is_cacheable)).toBe('found')
    expect(load).toHaveBeenCalledTimes(2)
  })
})

describe('server_cache_keys', () => {
  it('normalizes account names to lowercase', () => {
    expect(server_cache_keys.single_post('Alice', 'Post')).toBe(server_cache_keys.single_post('alice', 'Post'))
    expect(server_cache_keys.blog_config('BOB')).toBe(server_cache_keys.blog_config('bob'))
    expect(server_cache_keys.profile('Bob')).toBe('profile:bob')
  })
})

describe('with_hive_timeout', () => {
  it('rejects with HiveUnavailableError after the deadline and resets wax', async () => {
    const pending = with_hive_timeout('op', () => new Promise<never>(() => {}), 4000)
    const assertion = expect(pending).rejects.toBeInstanceOf(HiveUnavailableError)
    await vi.advanceTimersByTimeAsync(4000)
    await assertion
    expect(resetWax).toHaveBeenCalledTimes(1)
  })

  it('resolves a call that finishes before the deadline', async () => {
    const pending = with_hive_timeout('op', () => Promise.resolve(42), 4000)
    expect(await pending).toBe(42)
    expect(resetWax).not.toHaveBeenCalled()
  })

  it('wraps transport errors in HiveUnavailableError', async () => {
    await expect(with_hive_timeout('op', () => Promise.reject(new Error('ECONNRESET')))).rejects.toBeInstanceOf(
      HiveUnavailableError
    )
  })

  it('passes "does not exist" errors through unchanged', async () => {
    const not_found = new Error('Post alice/x does not exist')
    await expect(with_hive_timeout('op', () => Promise.reject(not_found))).rejects.toBe(not_found)
  })
})
