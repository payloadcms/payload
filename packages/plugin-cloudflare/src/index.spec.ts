import type { Config } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { cloudflarePlugin } from './index.js'

// Exercise Payload's real plugin factory without loading the CMS and its Node-only dependencies.
vi.mock('payload', () => import('../../payload/src/config/definePlugin.js'))

const config: Config = {
  collections: [
    { slug: 'posts', fields: [] },
    { slug: 'media', fields: [], upload: true },
    { slug: 'disabled-uploads', fields: [], upload: false },
  ],
  secret: 'test-secret',
}

describe('cloudflarePlugin', () => {
  it('should apply Workers defaults without changing the input config', async () => {
    const result = await cloudflarePlugin()(config)

    expect(result.auth?.passwordHashIterations).toBe(100000)
    expect(result.logger).toBeDefined()
    expect(result.collections?.[1]?.upload).toEqual({ crop: false, focalPoint: false })
    expect(result.collections?.[0]).toBe(config.collections?.[0])
    expect(result.collections?.[2]).toBe(config.collections?.[2])
    expect(config.auth).toBeUndefined()
    expect(config.logger).toBeUndefined()
    expect(config.collections?.[1]?.upload).toBe(true)
  })

  it('should preserve explicit auth, logger, and upload settings', async () => {
    const incoming: Config = {
      ...config,
      auth: { jwtOrder: ['cookie'], passwordHashIterations: 600000 },
      logger: 'sync',
      collections: [
        {
          slug: 'media',
          fields: [{ name: 'alt', type: 'text', required: true }],
          upload: { crop: true, focalPoint: true, mimeTypes: ['image/*'], skipSafeFetch: false },
        },
      ],
    }

    const result = await cloudflarePlugin({ useNativeFetch: true })(incoming)

    expect(result.auth).toEqual(incoming.auth)
    expect(result.logger).toBe('sync')
    expect(result.collections).toEqual(incoming.collections)
  })

  it('should retain the input config when disabled', async () => {
    expect(await cloudflarePlugin({ enabled: false })(config)).toBe(config)
  })

  it('should leave logger selection to Payload when console logging is disabled', async () => {
    const result = await cloudflarePlugin({ useConsoleLogger: false })(config)

    expect(result.logger).toBeUndefined()
  })

  it('should only default to native fetch when explicitly enabled', async () => {
    const defaultResult = await cloudflarePlugin()(config)
    const nativeFetchResult = await cloudflarePlugin({ useNativeFetch: true })(config)

    expect(defaultResult.collections?.[1]?.upload).not.toHaveProperty('skipSafeFetch')
    expect(nativeFetchResult.collections?.[1]?.upload).toHaveProperty('skipSafeFetch', true)
  })

  it('should preserve a remote-fetch allowlist when native fetch is enabled', async () => {
    const skipSafeFetch = [{ hostname: 'trusted.example.com', protocol: 'https:' as const }]
    const incoming: Config = {
      ...config,
      collections: [{ slug: 'media', fields: [], upload: { skipSafeFetch } }],
    }
    const result = await cloudflarePlugin({ useNativeFetch: true })(incoming)

    expect(result.collections?.[0]?.upload).toHaveProperty('skipSafeFetch', skipSafeFetch)
  })

  it('should expose plugin metadata and run after plugins with the default order', () => {
    const plugin = cloudflarePlugin()

    expect(plugin.slug).toBe('@payloadcms/plugin-cloudflare')
    expect(plugin.order).toBeGreaterThan(0)
  })
})
