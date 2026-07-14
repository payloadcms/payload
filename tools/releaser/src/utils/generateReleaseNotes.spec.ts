import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('open', () => ({ default: vi.fn() }))
vi.mock('./getLatestCommits.js', () => ({ getLatestCommits: vi.fn(async () => []) }))
vi.mock('./getRecommendedBump.js', () => ({ getRecommendedBump: vi.fn(async () => 'patch') }))

import open from 'open'

import { generateReleaseNotes } from './generateReleaseNotes.js'

describe('generateReleaseNotes open() behavior', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('should open the browser only when openReleaseUrl === true', async () => {
    // No contributors fetched when there are no commits.
    vi.stubGlobal('fetch', vi.fn())

    await generateReleaseNotes({
      fromVersion: 'v4.0.0-canary.5',
      toVersion: 'HEAD',
      openReleaseUrl: true,
    })

    expect(open).toHaveBeenCalledTimes(1)
  })

  it('should NOT open the browser when openReleaseUrl is falsy (CI path)', async () => {
    vi.stubGlobal('fetch', vi.fn())

    await generateReleaseNotes({
      fromVersion: 'v4.0.0-canary.5',
      toVersion: 'HEAD',
    })

    expect(open).not.toHaveBeenCalled()
  })
})
