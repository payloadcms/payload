import { describe, expect, it, vi } from 'vitest'

import { getLatestPublishedVersion, isVersionPublished } from './getPackageRegistryVersions.js'

const sleep = vi.fn(async () => {})

describe('getLatestPublishedVersion', () => {
  it('should return the latest version on 200', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ version: '3.90.2' }))

    const result = await getLatestPublishedVersion({ name: '@payloadcms/ui', fetchImpl, sleep })

    expect(result).toBe('3.90.2')
    expect(fetchImpl).toHaveBeenCalledWith('https://registry.npmjs.org/@payloadcms/ui/latest')
  })

  it('should return undefined on 404 without retrying', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }))

    const result = await getLatestPublishedVersion({ name: 'payload', fetchImpl, sleep })

    expect(result).toBeUndefined()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('should throw after three attempts on persistent 500', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 500 }))

    await expect(getLatestPublishedVersion({ name: 'payload', fetchImpl, sleep })).rejects.toThrow(
      /500/,
    )
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('should retry a 500 and return the version from the next 200', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ version: '3.90.2' }))

    const result = await getLatestPublishedVersion({ name: 'payload', fetchImpl, sleep })

    expect(result).toBe('3.90.2')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('should throw after three 429 responses', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 429 }))

    await expect(getLatestPublishedVersion({ name: 'payload', fetchImpl, sleep })).rejects.toThrow(
      /429/,
    )
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('should retry rejected fetches and return the version from the next 200', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(Response.json({ version: '3.90.2' }))

    const result = await getLatestPublishedVersion({ name: 'payload', fetchImpl, sleep })

    expect(result).toBe('3.90.2')
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('should throw the network error after three rejected fetches', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'))

    await expect(getLatestPublishedVersion({ name: 'payload', fetchImpl, sleep })).rejects.toThrow(
      /fetch failed/,
    )
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('should back off between attempts', async () => {
    const localSleep = vi.fn(async () => {})
    const fetchImpl = vi.fn(async () => new Response(null, { status: 503 }))

    await expect(
      getLatestPublishedVersion({ name: 'payload', fetchImpl, sleep: localSleep }),
    ).rejects.toThrow(/503/)

    expect(localSleep.mock.calls).toEqual([[1000], [2000]])
  })

  it('should not retry other 4xx and should throw', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 400 }))

    await expect(getLatestPublishedVersion({ name: 'payload', fetchImpl, sleep })).rejects.toThrow(
      /400/,
    )
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('should throw without retrying when the body has no version', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ name: 'payload' }))

    await expect(getLatestPublishedVersion({ name: 'payload', fetchImpl, sleep })).rejects.toThrow(
      /version/,
    )
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe('isVersionPublished', () => {
  it('should return true when the registry returns 200 for name/version', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }) as Response)

    const result = await isVersionPublished({
      name: 'payload',
      version: '4.0.0-canary.9',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep,
    })

    expect(result).toBe(true)
    expect(fetchImpl).toHaveBeenCalledWith('https://registry.npmjs.org/payload/4.0.0-canary.9')
  })

  it('should return false when the registry returns 404 without retrying', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }) as Response)

    const result = await isVersionPublished({
      name: 'payload',
      version: '4.0.0-canary.999',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep,
    })

    expect(result).toBe(false)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('should throw after three attempts on persistent 503 rather than reporting not-published', async () => {
    const fetchImpl = vi.fn(
      async () => ({ ok: false, status: 503, statusText: 'Service Unavailable' }) as Response,
    )

    await expect(
      isVersionPublished({
        name: 'payload',
        version: '4.0.0-canary.10',
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleep,
      }),
    ).rejects.toThrow(/503/)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('should retry a 503 and return true from the next 200', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))

    const result = await isVersionPublished({
      name: 'payload',
      version: '4.0.0-canary.10',
      fetchImpl,
      sleep,
    })

    expect(result).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('should not retry other 4xx and should throw', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 403 }))

    await expect(
      isVersionPublished({ name: 'payload', version: '4.0.0', fetchImpl, sleep }),
    ).rejects.toThrow(/403/)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
