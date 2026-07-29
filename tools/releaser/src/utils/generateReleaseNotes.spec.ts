import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./getLatestCommits.js', () => ({ getLatestCommits: vi.fn(async () => []) }))
vi.mock('./getRecommendedBump.js', () => ({ getRecommendedBump: vi.fn(async () => 'patch') }))

import { generateReleaseNotes } from './generateReleaseNotes.js'

describe('generateReleaseNotes', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('should return a prefilled releases/new URL for the version', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const { releaseUrl } = await generateReleaseNotes({
      fromVersion: 'v4.0.0-canary.5',
      toVersion: 'HEAD',
    })

    expect(releaseUrl).toContain('github.com/payloadcms/payload/releases/new')
    // A canary (non-'latest') version is flagged as a prerelease in the URL.
    expect(releaseUrl).toContain('prerelease=1')
  })
})
