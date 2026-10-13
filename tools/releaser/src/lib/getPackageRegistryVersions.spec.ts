import { describe, expect, it, vi } from 'vitest'

import { getLatestPublishedVersion, isVersionPublished } from './getPackageRegistryVersions.js'

describe('getLatestPublishedVersion', () => {
  it('should return the latest version on 200', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ version: '3.90.2' }))

    const result = await getLatestPublishedVersion({ name: '@payloadcms/ui', fetchImpl })

    expect(result).toBe('3.90.2')
    expect(fetchImpl).toHaveBeenCalledWith('https://registry.npmjs.org/@payloadcms/ui/latest')
  })

  it('should return undefined on 404', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }))

    const result = await getLatestPublishedVersion({ name: 'payload', fetchImpl })

    expect(result).toBeUndefined()
  })

  it('should throw on 500', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 500 }))

    await expect(getLatestPublishedVersion({ name: 'payload', fetchImpl })).rejects.toThrow(/500/)
  })

  it('should throw on 429', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 429 }))

    await expect(getLatestPublishedVersion({ name: 'payload', fetchImpl })).rejects.toThrow(/429/)
  })

  it('should throw when the body has no version', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ name: 'payload' }))

    await expect(getLatestPublishedVersion({ name: 'payload', fetchImpl })).rejects.toThrow(
      /version/,
    )
  })
})

describe('isVersionPublished', () => {
  it('should return true when the registry returns 200 for name/version', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }) as Response)

    const result = await isVersionPublished({
      name: 'payload',
      version: '4.0.0-canary.9',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toBe(true)
    expect(fetchImpl).toHaveBeenCalledWith('https://registry.npmjs.org/payload/4.0.0-canary.9')
  })

  it('should return false when the registry returns 404', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }) as Response)

    const result = await isVersionPublished({
      name: 'payload',
      version: '4.0.0-canary.999',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toBe(false)
  })

  it('should throw on a non-404 error status rather than reporting not-published', async () => {
    const fetchImpl = vi.fn(
      async () => ({ ok: false, status: 503, statusText: 'Service Unavailable' }) as Response,
    )

    await expect(
      isVersionPublished({
        name: 'payload',
        version: '4.0.0-canary.10',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/503/)
  })
})
