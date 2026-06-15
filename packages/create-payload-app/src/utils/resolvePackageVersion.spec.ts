import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolvePackageVersion } from './resolvePackageVersion.js'

const mockRegistry = ({
  distTags,
  validVersions = [],
}: {
  distTags: Record<string, string>
  validVersions?: string[]
}) =>
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.endsWith('/dist-tags')) {
        return Promise.resolve({ json: () => Promise.resolve(distTags) })
      }

      const version = url.split('/').pop() ?? ''
      return Promise.resolve({ status: validVersions.includes(version) ? 200 : 404 })
    }),
  )

describe('resolvePackageVersion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should resolve a dist-tag to its concrete version', async () => {
    mockRegistry({ distTags: { canary: '3.0.0-canary.abc', latest: '2.9.0' } })

    const version = await resolvePackageVersion({ packageName: 'payload', versionOrTag: 'canary' })

    expect(version).toBe('3.0.0-canary.abc')
  })

  it('should default to the latest tag when no value is provided', async () => {
    mockRegistry({ distTags: { canary: '3.0.0-canary.abc', latest: '2.9.0' } })

    const version = await resolvePackageVersion({ packageName: 'payload' })

    expect(version).toBe('2.9.0')
  })

  it('should return an explicit version when it exists on the registry', async () => {
    mockRegistry({ distTags: { latest: '2.9.0' }, validVersions: ['3.1.0'] })

    const version = await resolvePackageVersion({ packageName: 'payload', versionOrTag: '3.1.0' })

    expect(version).toBe('3.1.0')
  })

  it('should throw a clear error when neither a tag nor a version is found', async () => {
    mockRegistry({ distTags: { latest: '2.9.0' } })

    await expect(
      resolvePackageVersion({ packageName: 'payload', versionOrTag: 'nope' }),
    ).rejects.toThrow('No version or tag "nope" found for package: payload')
  })
})
