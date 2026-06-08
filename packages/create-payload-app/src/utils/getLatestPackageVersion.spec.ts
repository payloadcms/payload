import { afterEach, describe, expect, it, vi } from 'vitest'

import { getLatestPackageVersion } from './getLatestPackageVersion.js'

const mockDistTags = (tags: Record<string, string>) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(tags) }))

describe('getLatestPackageVersion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should resolve the version for the requested tag', async () => {
    mockDistTags({ canary: '3.0.0-canary.abc', latest: '2.9.0' })

    const version = await getLatestPackageVersion({ packageName: 'payload', tag: 'canary' })

    expect(version).toBe('3.0.0-canary.abc')
  })

  it('should default to the latest tag when no tag is provided', async () => {
    mockDistTags({ canary: '3.0.0-canary.abc', latest: '2.9.0' })

    const version = await getLatestPackageVersion({ packageName: 'payload' })

    expect(version).toBe('2.9.0')
  })

  it('should throw a clear error when the requested tag has no published version', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockDistTags({ latest: '2.9.0' })

    await expect(
      getLatestPackageVersion({ packageName: 'payload', tag: 'canary' }),
    ).rejects.toThrow('No "canary" release found for package: payload')
  })
})
