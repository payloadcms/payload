import type { GitCommit } from 'changelogen'

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./getLatestCommits.js', () => ({ getLatestCommits: vi.fn(async () => []) }))
vi.mock('./getRecommendedBump.js', () => ({ getRecommendedBump: vi.fn(async () => 'patch') }))

import { generateReleaseNotes } from './generateReleaseNotes.js'
import { getLatestCommits } from './getLatestCommits.js'

const featureCommit: GitCommit = {
  author: { email: 'dev@example.com', name: 'Dev' },
  authors: [{ email: 'dev@example.com', name: 'Dev' }],
  body: '',
  description: 'add a new field',
  isBreaking: false,
  message: 'feat: add a new field',
  references: [{ type: 'hash', value: '1234567890abcdef' }],
  scope: '',
  shortHash: '1234567',
  type: 'feat',
}

const releaseBumpCommit: GitCommit = {
  author: { email: 'bot@example.com', name: 'github-actions[bot]' },
  authors: [{ email: 'bot@example.com', name: 'github-actions[bot]' }],
  body: '',
  description: 'v4.0.0-canary.10',
  isBreaking: false,
  message: 'chore(release): v4.0.0-canary.10',
  references: [{ type: 'hash', value: 'abcdef1234567890' }],
  scope: 'release',
  shortHash: 'abcdef1',
  type: 'chore',
}

describe('generateReleaseNotes', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('should return a prefilled releases/new URL for the version', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const { releaseTag, releaseUrl } = await generateReleaseNotes({
      fromVersion: 'v4.0.0-canary.5',
      toVersion: 'HEAD',
    })

    expect(releaseTag).toBe('v4.0.0-canary.6')
    expect(releaseUrl).toContain('github.com/payloadcms/payload/releases/new')
    // A canary (non-'latest') version is flagged as a prerelease in the URL.
    expect(releaseUrl).toContain('prerelease=1')
  })

  it('should calculate the release tag when toVersion is not a valid tag', async () => {
    const { releaseTag } = await generateReleaseNotes({
      fromVersion: 'v4.0.0-canary.5',
      toVersion: 'v4-preview-branch',
    })

    expect(getLatestCommits).toHaveBeenCalledWith('v4.0.0-canary.5', 'v4-preview-branch')
    expect(releaseTag).toBe('v4.0.0-canary.6')
  })

  it('should include changes between the previous and new tag without the bump commit', async () => {
    vi.mocked(getLatestCommits).mockResolvedValueOnce([releaseBumpCommit, featureCommit])
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ author: { email: 'dev@example.com', login: 'dev' } }),
      })),
    )

    const { changelog, releaseNotes, releaseTag, releaseUrl } = await generateReleaseNotes({
      fromVersion: 'v4.0.0-canary.8',
      toVersion: 'v4.0.0-canary.10',
    })

    expect(getLatestCommits).toHaveBeenCalledWith('v4.0.0-canary.8', 'v4.0.0-canary.10')
    expect(releaseTag).toBe('v4.0.0-canary.10')
    expect(changelog).toContain(
      'github.com/payloadcms/payload/compare/v4.0.0-canary.8...v4.0.0-canary.10',
    )
    expect(releaseNotes).toContain('add a new field')
    expect(releaseNotes).not.toContain('**release:** v4.0.0-canary.10')
    expect(releaseUrl).toContain('tag=v4.0.0-canary.10')
  })

  it('should write notes without sections for a tagged release with no changes', async () => {
    const { releaseNotes, releaseTag } = await generateReleaseNotes({
      fromVersion: 'v4.0.0-canary.9',
      toVersion: 'v4.0.0-canary.10',
    })

    expect(releaseTag).toBe('v4.0.0-canary.10')
    expect(releaseNotes).not.toContain('###')
  })

  it('should write notes without sections for a tagged release with only its bump commit', async () => {
    vi.mocked(getLatestCommits).mockResolvedValueOnce([releaseBumpCommit])

    const { releaseNotes } = await generateReleaseNotes({
      fromVersion: 'v4.0.0-canary.9',
      toVersion: 'v4.0.0-canary.10',
    })

    expect(releaseNotes).not.toContain('###')
    expect(releaseNotes).not.toContain('**release:** v4.0.0-canary.10')
  })

  it('should write notes without sections for a tagged release with only current and unpublished prior bump commits', async () => {
    vi.mocked(getLatestCommits).mockResolvedValueOnce([
      releaseBumpCommit,
      {
        ...releaseBumpCommit,
        description: 'v4.0.0-canary.8',
        message: 'chore(release): v4.0.0-canary.8',
      },
    ])

    const { releaseNotes } = await generateReleaseNotes({
      fromVersion: 'v4.0.0-canary.7',
      toVersion: 'v4.0.0-canary.10',
    })

    expect(releaseNotes).not.toContain('###')
    expect(releaseNotes).not.toContain('v4.0.0-canary.8')
  })
})
