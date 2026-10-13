import { describe, expect, it, vi } from 'vitest'

import type { StableDistTag } from './lib/stableDistTag.js'

import { runReleaseCi } from './release-ci.js'
import { NOT_LATEST_PUBLISH_REMINDER } from './utils/createDraftGitHubRelease.js'

const defaultTriggerTag: string | undefined = 'v3.90.3'

const latestMap = (): Map<string, StableDistTag> =>
  new Map<string, StableDistTag>([
    ['payload', 'latest'],
    ['@payloadcms/ui', 'latest'],
  ])

const baseDeps = () => ({
  createDraftGitHubRelease: vi.fn(async () => ({ releaseUrl: 'https://gh/release' })),
  findChangelogBaseTag: vi.fn(async () => 'v3.90.2'),
  generateReleaseNotes: vi.fn(async () => ({
    releaseNotes: 'notes',
    releaseUrl: 'https://gh/new',
  })),
  hasGithubToken: true,
  listPackageNames: vi.fn(async () => ['payload', '@payloadcms/ui']),
  log: vi.fn(),
  resolveDistTags: vi.fn(async (_args: { names: string[] }) => latestMap()),
  triggerTag: defaultTriggerTag,
  workspace: {
    build: vi.fn(async () => {}),
    publish: vi.fn(async () => {}),
    version: vi.fn(async () => '3.90.3'),
  },
})

const makeDeps = (
  over: Partial<ReturnType<typeof baseDeps>> = {},
): ReturnType<typeof baseDeps> => ({ ...baseDeps(), ...over })

const depsWithVersion = (version: string): ReturnType<typeof baseDeps> =>
  makeDeps({
    workspace: {
      build: vi.fn(async () => {}),
      publish: vi.fn(async () => {}),
      version: vi.fn(async () => version),
    },
  })

describe('runReleaseCi', () => {
  it('should resolve dist-tags, build, publish, generate notes, and create a draft in order', async () => {
    const distTags = latestMap()
    const deps = makeDeps({ resolveDistTags: vi.fn(async () => distTags) })

    await runReleaseCi({ deps, dryRun: false })

    expect(deps.resolveDistTags).toHaveBeenCalledWith({ names: ['payload', '@payloadcms/ui'] })
    expect(deps.workspace.build).toHaveBeenCalledOnce()
    expect(deps.workspace.publish).toHaveBeenCalledWith({ dryRun: false, tag: distTags })
    expect(deps.findChangelogBaseTag).toHaveBeenCalledWith({ version: '3.90.3' })
    expect(deps.generateReleaseNotes).toHaveBeenCalledWith({
      fromVersion: 'v3.90.2',
      toVersion: 'v3.90.3',
    })
    expect(deps.createDraftGitHubRelease).toHaveBeenCalledWith({
      branch: '3.x',
      makeLatest: true,
      releaseNotes: 'notes',
      tag: 'v3.90.3',
    })
    expect(deps.log).not.toHaveBeenCalledWith(NOT_LATEST_PUBLISH_REMINDER)

    const resolveOrder = deps.resolveDistTags.mock.invocationCallOrder[0]
    const notesOrder = deps.generateReleaseNotes.mock.invocationCallOrder[0]
    const buildOrder = deps.workspace.build.mock.invocationCallOrder[0]
    const publishOrder = deps.workspace.publish.mock.invocationCallOrder[0]
    expect(buildOrder).toBeGreaterThan(resolveOrder)
    expect(buildOrder).toBeGreaterThan(notesOrder)
    expect(publishOrder).toBeGreaterThan(buildOrder)
  })

  it('should publish to payload-3 and set makeLatest false when payload resolves to payload-3', async () => {
    const distTags = new Map<string, StableDistTag>([
      ['payload', 'payload-3'],
      ['@payloadcms/ui', 'payload-3'],
    ])
    const deps = makeDeps({ resolveDistTags: vi.fn(async () => distTags) })

    await runReleaseCi({ deps, dryRun: false })

    expect(deps.workspace.publish).toHaveBeenCalledWith({ dryRun: false, tag: distTags })
    expect(deps.createDraftGitHubRelease).toHaveBeenCalledWith({
      branch: '3.x',
      makeLatest: false,
      releaseNotes: 'notes',
      tag: 'v3.90.3',
    })
    expect(deps.log).toHaveBeenCalledWith(NOT_LATEST_PUBLISH_REMINDER)
  })

  it('should refuse before building when dist-tag resolution fails', async () => {
    const deps = makeDeps({
      resolveDistTags: vi.fn(async () => {
        throw new Error('registry down')
      }),
    })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/registry down/)
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should refuse before building when the map has no payload entry', async () => {
    const deps = makeDeps({
      resolveDistTags: vi.fn(
        async () => new Map<string, StableDistTag>([['@payloadcms/ui', 'latest']]),
      ),
    })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/payload/)
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
    expect(deps.createDraftGitHubRelease).not.toHaveBeenCalled()
  })

  it('should refuse before building when GITHUB_TOKEN is missing', async () => {
    const deps = makeDeps({ hasGithubToken: false })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/GITHUB_TOKEN/)
    expect(deps.resolveDistTags).not.toHaveBeenCalled()
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should refuse a non-v3 version before building (major guard)', async () => {
    const deps = depsWithVersion('4.0.0')

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/pinned to v3/)
    expect(deps.resolveDistTags).not.toHaveBeenCalled()
    expect(deps.workspace.build).not.toHaveBeenCalled()
  })

  it('should refuse a prerelease version', async () => {
    const deps = depsWithVersion('3.91.0-internal.abc1234')

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/prerelease/)
    expect(deps.resolveDistTags).not.toHaveBeenCalled()
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should refuse when no changelog base tag is available', async () => {
    const deps = makeDeps({ findChangelogBaseTag: vi.fn(async () => undefined) })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/changelog base tag/)
    expect(deps.generateReleaseNotes).not.toHaveBeenCalled()
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should refuse before building when the trigger tag does not match the version', async () => {
    const deps = makeDeps({ triggerTag: 'v3.90.4' })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/does not match/)
    expect(deps.generateReleaseNotes).not.toHaveBeenCalled()
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should refuse before building when the trigger tag is missing', async () => {
    const deps = makeDeps({ triggerTag: undefined })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/does not match/)
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should allow a missing trigger tag in dry-run', async () => {
    const deps = makeDeps({ triggerTag: undefined })

    await runReleaseCi({ deps, dryRun: true })

    expect(deps.generateReleaseNotes).toHaveBeenCalledOnce()
  })

  it('should refuse a mismatched trigger tag in dry-run', async () => {
    const deps = makeDeps({ triggerTag: 'v3.90.4' })

    await expect(runReleaseCi({ deps, dryRun: true })).rejects.toThrow(/does not match/)
  })

  it('should skip build, publish, and draft in dry-run but still resolve dist-tags and generate notes', async () => {
    const deps = makeDeps()

    await runReleaseCi({ deps, dryRun: true })

    expect(deps.resolveDistTags).toHaveBeenCalledOnce()
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining('payload -> latest'))
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
    expect(deps.createDraftGitHubRelease).not.toHaveBeenCalled()
    expect(deps.generateReleaseNotes).toHaveBeenCalledOnce()
  })
})
