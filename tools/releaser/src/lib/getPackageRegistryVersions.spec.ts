import { describe, expect, it, vi } from 'vitest'

import { isVersionPublished } from './getPackageRegistryVersions.js'

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
    const fetchImpl = vi.fn(async () => ({ ok: false }) as Response)

    const result = await isVersionPublished({
      name: 'payload',
      version: '4.0.0-canary.999',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result).toBe(false)
  })
})
