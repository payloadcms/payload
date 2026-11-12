import { describe, expect, it, vi } from 'vitest'

import { getDistTag } from './getPackageRegistryVersions.js'

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
