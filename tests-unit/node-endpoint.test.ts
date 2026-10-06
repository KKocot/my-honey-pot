import { afterEach, describe, expect, it, vi } from 'vitest'
import { get_current_endpoint } from '../src/lib/node-endpoint'
import { HIVE_API_ENDPOINT } from '../src/lib/config'

function stub_storage(value: string | null): void {
  vi.stubGlobal('window', {
    localStorage: { getItem: (key: string) => (key === 'hive-node-endpoint' ? value : null) },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('get_current_endpoint', () => {
  it('returns the default endpoint without window', () => {
    expect(get_current_endpoint()).toBe(HIVE_API_ENDPOINT)
  })

  it.each([
    JSON.stringify('http://api.example.com'),
    JSON.stringify('javascript:alert(1)'),
    JSON.stringify('JAVASCRIPT:alert(1)'),
    JSON.stringify('data:text/plain,x'),
    JSON.stringify('ws://api.example.com'),
    JSON.stringify(''),
    JSON.stringify(42),
    JSON.stringify({ url: 'https://api.example.com' }),
    'https://api.example.com',
    'not json',
    null,
  ])('falls back to the default for stored %j', (stored) => {
    stub_storage(stored)
    expect(get_current_endpoint()).toBe(HIVE_API_ENDPOINT)
  })

  it('uses a stored https endpoint', () => {
    stub_storage(JSON.stringify('https://api.example.com'))
    expect(get_current_endpoint()).toBe('https://api.example.com')
  })
})
