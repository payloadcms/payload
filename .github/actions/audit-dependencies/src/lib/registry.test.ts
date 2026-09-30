import { describe, expect, it, vi } from 'vitest'

import type { FetchLike } from './registry'

import { createRegistryClient } from './registry'

const ok = (body: unknown): ReturnType<FetchLike> =>
  Promise.resolve({ json: () => Promise.resolve(body), ok: true })

describe('createRegistryClient', () => {
  it('parses versions and dist-tags from an abbreviated packument', async () => {
    const fetchImpl = vi.fn<FetchLike>(() =>
      ok({
        'dist-tags': { latest: '2.0.0' },
        versions: {
          '1.0.0': { dependencies: { minimatch: '^9.0.0' } },
          '2.0.0': { dependencies: {} },
        },
      }),
    )
    const client = createRegistryClient({ fetchImpl })

    const packument = await client.fetchPackument('example')

    expect(packument?.distTags.latest).toBe('2.0.0')
    expect(packument?.versions['1.0.0'].dependencies).toEqual({ minimatch: '^9.0.0' })
  })

  it('caches by name so concurrent callers share one request', async () => {
    const fetchImpl = vi.fn<FetchLike>(() => ok({ 'dist-tags': {}, versions: {} }))
    const client = createRegistryClient({ fetchImpl })

    await Promise.all([client.fetchPackument('example'), client.fetchPackument('example')])
    await client.fetchPackument('example')

    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('encodes the scope slash but keeps the leading @', async () => {
    const fetchImpl = vi.fn<FetchLike>(() => ok({ 'dist-tags': {}, versions: {} }))
    const client = createRegistryClient({ fetchImpl, registryUrl: 'https://reg.test' })

    await client.fetchPackument('@scope/name')

    expect(fetchImpl).toHaveBeenCalledWith('https://reg.test/@scope%2Fname', expect.anything())
  })

  it('returns null on a non-ok response without throwing', async () => {
    const fetchImpl = vi.fn<FetchLike>(() =>
      Promise.resolve({ json: () => Promise.resolve({}), ok: false }),
    )
    const client = createRegistryClient({ fetchImpl })

    expect(await client.fetchPackument('missing')).toBeNull()
  })
})
