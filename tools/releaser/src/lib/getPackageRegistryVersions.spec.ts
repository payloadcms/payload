import { describe, expect, it, vi } from 'vitest'

import { getDistTag, isVersionPublished } from './getPackageRegistryVersions.js'

const serviceUnavailable = { ok: false, status: 503, statusText: 'Service Unavailable' } as Response
const okResponse = { ok: true, status: 200 } as Response

describe('isVersionPublished', () => {
  it('should return true when the registry returns 200 for name/version', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }) as Response)

    const result = await isVersionPublished({
      name: 'payload',
      sleep: vi.fn(async () => {}),
      version: '4.0.0-canary.9',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toBe(true)
    expect(fetchImpl).toHaveBeenCalledWith('https://registry.npmjs.org/payload/4.0.0-canary.9', {
      signal: expect.any(AbortSignal),
    })
  })

  it('should return false when the registry returns 404', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }) as Response)

    const result = await isVersionPublished({
      name: 'payload',
      sleep: vi.fn(async () => {}),
      version: '4.0.0-canary.999',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toBe(false)
  })

  it('should throw on a non-404 error status rather than reporting not-published', async () => {
    const fetchImpl = vi.fn(async () => serviceUnavailable)

    await expect(
      isVersionPublished({
        name: 'payload',
        sleep: vi.fn(async () => {}),
        version: '4.0.0-canary.10',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/503/)
  })

  it('should retry a 503 and return true from the next 200', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(serviceUnavailable)
      .mockResolvedValueOnce(okResponse)

    const result = await isVersionPublished({
      name: 'payload',
      sleep: vi.fn(async () => {}),
      version: '4.0.0-canary.10',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('should retry a 429 and return true from the next 200', async () => {
    const tooManyRequests = { ok: false, status: 429, statusText: 'Too Many Requests' } as Response
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(tooManyRequests)
      .mockResolvedValueOnce(okResponse)

    const result = await isVersionPublished({
      name: 'payload',
      sleep: vi.fn(async () => {}),
      version: '4.0.0-canary.10',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('should cancel the transient response body before retrying', async () => {
    const cancel = vi.fn(async () => {})
    const transientWithBody = { ...serviceUnavailable, body: { cancel } } as unknown as Response
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(transientWithBody)
      .mockResolvedValueOnce(okResponse)

    await isVersionPublished({
      name: 'payload',
      sleep: vi.fn(async () => {}),
      version: '4.0.0-canary.10',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('should throw after three attempts on persistent 503', async () => {
    const fetchImpl = vi.fn(async () => serviceUnavailable)

    await expect(
      isVersionPublished({
        name: 'payload',
        sleep: vi.fn(async () => {}),
        version: '4.0.0-canary.10',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/503/)

    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('should not retry other 4xx and should throw', async () => {
    const fetchImpl = vi.fn(
      async () => ({ ok: false, status: 400, statusText: 'Bad Request' }) as Response,
    )

    await expect(
      isVersionPublished({
        name: 'payload',
        sleep: vi.fn(async () => {}),
        version: '4.0.0-canary.10',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/400/)

    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('should retry a timed-out attempt', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'))
      .mockResolvedValueOnce(okResponse)

    const result = await isVersionPublished({
      name: 'payload',
      sleep: vi.fn(async () => {}),
      version: '4.0.0-canary.10',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toBe(true)
  })

  it('should throw the network error after three rejected fetches', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'))

    await expect(
      isVersionPublished({
        name: 'payload',
        sleep: vi.fn(async () => {}),
        version: '4.0.0-canary.10',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/fetch failed/)

    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('should back off between attempts', async () => {
    const sleep = vi.fn(async () => {})
    const fetchImpl = vi.fn(async () => serviceUnavailable)

    await expect(
      isVersionPublished({
        name: 'payload',
        sleep,
        version: '4.0.0-canary.10',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/503/)

    expect(sleep.mock.calls).toEqual([[1000], [2000]])
  })
})

const sleep = async (): Promise<void> => {}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status })

describe('getDistTag', () => {
  it('should return the requested dist-tag version', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ beta: '4.0.0-beta.8', canary: '4.0.0-canary.39' }),
    )

    const version = await getDistTag({
      fetchImpl,
      name: '@payloadcms/translations',
      sleep,
      tag: 'canary',
    })

    expect(version).toBe('4.0.0-canary.39')
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://registry.npmjs.org/-/package/@payloadcms/translations/dist-tags',
      expect.anything(),
    )
  })

  it('should return undefined when the tag is absent', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ latest: '3.93.0' }))

    expect(await getDistTag({ fetchImpl, name: 'payload', sleep, tag: 'canary' })).toBeUndefined()
  })

  it('should return undefined on 404', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: 'Not found' }, 404))

    expect(await getDistTag({ fetchImpl, name: 'new-pkg', sleep, tag: 'canary' })).toBeUndefined()
  })

  it('should throw on a non-404 error status after retries', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 500))

    await expect(getDistTag({ fetchImpl, name: 'payload', sleep, tag: 'canary' })).rejects.toThrow(
      /500/,
    )
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })
})
