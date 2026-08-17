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

  it('should honor a custom API route from config.routes.api', () => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig({ routes: { api: '/custom-api' } }),
      filename: 'logo.png',
      relative: true,
    })

    expect(url).toBe('/custom-api/media/file/logo.png')
  })

  it('should build an absolute URL from config.serverURL when relative is false', () => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig({ serverURL: 'https://example.com' }),
      filename: 'logo.png',
      relative: false,
    })

    expect(url).toBe('https://example.com/api/media/file/logo.png')
  })

  it('should build a relative URL when relative is true, ignoring serverURL', () => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig({ serverURL: 'https://example.com' }),
      filename: 'logo.png',
      relative: true,
    })

    expect(url).toBe('/api/media/file/logo.png')
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

  it('should serialize boolean and number query values', () => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'logo.png',
      query: { width: 500, withoutEnlargement: true },
      relative: true,
    })

    expect(url).toBe('/api/media/file/logo.png?width=500&withoutEnlargement=true')
  })

  it('should omit query keys whose value is undefined', () => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'logo.png',
      query: { height: undefined, width: 500 },
      relative: true,
    })

    expect(url).toBe('/api/media/file/logo.png?width=500')
  })

  it('should serialize an array query value as repeated keys, preserving order', () => {
    const url = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'logo.png',
      query: { tag: ['a', 'b', 'c'] },
      relative: true,
    })

    expect(url).toBe('/api/media/file/logo.png?tag=a&tag=b&tag=c')
  })

  it('should produce a deterministic key order regardless of input object key order', () => {
    const first = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'logo.png',
      query: { height: 500, width: 400 },
      relative: true,
    })
    const second = generatePayloadFileURL({
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'logo.png',
      query: { width: 400, height: 500 },
      relative: true,
    })

    expect(first).toBe(second)
    expect(first).toBe('/api/media/file/logo.png?height=500&width=400')
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

  it('should ignore an external document url and always target the Payload endpoint', () => {
    const argsWithExternalUrl = {
      collectionSlug: 'media',
      config: makeConfig(),
      filename: 'logo.png',
      relative: true,
      url: 'https://cdn.example.com/logo.png',
    }

    const url = generatePayloadFileURL(
      argsWithExternalUrl as unknown as Parameters<typeof generatePayloadFileURL>[0],
    )

    expect(url).toBe('/api/media/file/logo.png')
  })
})
