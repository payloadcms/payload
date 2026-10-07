import { describe, expect, it } from 'vitest'

import type { Config } from '../config/types.js'

import { generatePayloadFileURL } from './generatePayloadFileURL.js'

const makeConfig = (overrides: Partial<Config> = {}): Config =>
  ({
    routes: { api: '/api' },
    serverURL: 'https://example.com',
    ...overrides,
  }) as Config

describe('generatePayloadFileURL', () => {
  it('should encode special characters in the filename', () => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'my file (1).png',
      relative: true,
    })

    expect(url).toBe('/api/media/file/my%20file%20(1).png')
  })

  it.each([
    {
      config: makeConfig({ routes: { api: '/custom-api' } }),
      expected: '/custom-api/media/file/logo.png',
      name: 'a relative URL using a custom API route',
      relative: true,
    },
    {
      config: makeConfig(),
      expected: 'https://example.com/api/media/file/logo.png',
      name: 'an absolute URL from serverURL when relative is false',
      relative: false,
    },
  ])('should build $name', ({ config, expected, relative }) => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config,
      filename: 'logo.png',
      relative,
    })

    expect(url).toBe(expected)
  })

  it('should append prefix as a query parameter', () => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'logo.png',
      prefix: 'tenants/acme',
      relative: true,
    })

    expect(url).toBe('/api/media/file/logo.png?prefix=tenants%2Facme')
  })

  it.each([
    {
      expected: 'width=500&withoutEnlargement=true',
      name: 'boolean and number values',
      query: { width: 500, withoutEnlargement: true },
    },
    {
      expected: 'width=500',
      name: 'no undefined values',
      query: { height: undefined, width: 500 },
    },
    {
      expected: 'tag=a&tag=b&tag=c',
      name: 'an array as repeated keys in order',
      query: { tag: ['a', 'b', 'c'] },
    },
    {
      expected: 'height=500&width=400',
      name: 'keys in a deterministic order',
      query: { width: 400, height: 500 },
    },
  ])('should serialize $name in the query', ({ expected, query }) => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'logo.png',
      query,
      relative: true,
    })

    expect(url).toBe(`/api/media/file/logo.png?${expected}`)
  })

  it('should throw when query contains a `prefix` key', () => {
    expect(() =>
      generatePayloadFileURL({
        collectionSlug: 'media',
        config: makeConfig(),
        filename: 'logo.png',
        query: { prefix: 'tenants/acme' },
        relative: true,
      }),
    ).toThrow(/prefix/i)
  })

  it('should copy values out of an input URLSearchParams without mutating it', () => {
    const query = new URLSearchParams({ width: '500' })

    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'logo.png',
      query,
      relative: true,
    })

    expect(url).toBe('/api/media/file/logo.png?width=500')
    expect(Array.from(query.entries())).toEqual([['width', '500']])
  })
})
