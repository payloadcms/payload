import { describe, expect, it, vi } from 'vitest'

import { runReleaseCi } from './release-ci.js'

const baseDeps = () => ({
  createDraftGitHubRelease: vi.fn(async () => ({ releaseUrl: 'https://gh/release' })),
  findChangelogBaseTag: vi.fn(async () => 'v4.0.0-canary.9'),
  generateReleaseNotes: vi.fn(async () => ({
    releaseNotes: 'notes',
    releaseUrl: 'https://gh/new',
  })),
  hasGithubToken: true,
  log: vi.fn(),
  workspace: {
    build: vi.fn(async () => {}),
    publish: vi.fn(async () => {}),
    version: vi.fn(async () => '4.0.0-canary.10'),
  },
})

const makeDeps = (
  over: Partial<ReturnType<typeof baseDeps>> = {},
): ReturnType<typeof baseDeps> => ({ ...baseDeps(), ...over })

describe('runReleaseCi', () => {
  it('should build, publish, generate notes, and create a draft in order', async () => {
    const deps = makeDeps()

    await runReleaseCi({ deps, dryRun: false })

    expect(deps.workspace.build).toHaveBeenCalledOnce()
    expect(deps.workspace.publish).toHaveBeenCalledWith({ dryRun: false, tag: 'canary' })
    expect(deps.findChangelogBaseTag).toHaveBeenCalledWith({ version: '4.0.0-canary.10' })
    expect(deps.generateReleaseNotes).toHaveBeenCalledWith({
      fromVersion: 'v4.0.0-canary.9',
      toVersion: 'HEAD',
    })
    expect(deps.createDraftGitHubRelease).toHaveBeenCalledWith({
      branch: 'main',
      releaseNotes: 'notes',
      tag: 'v4.0.0-canary.10',
    })

    const notesOrder = deps.generateReleaseNotes.mock.invocationCallOrder[0]
    const buildOrder = deps.workspace.build.mock.invocationCallOrder[0]
    const publishOrder = deps.workspace.publish.mock.invocationCallOrder[0]
    expect(buildOrder).toBeGreaterThan(notesOrder)
    expect(publishOrder).toBeGreaterThan(buildOrder)
  })

  it('should derive the beta dist-tag from a beta version', async () => {
    const deps = makeDeps({
      workspace: {
        build: vi.fn(async () => {}),
        publish: vi.fn(async () => {}),
        version: vi.fn(async () => '4.0.0-beta.3'),
      },
    })

    await runReleaseCi({ deps, dryRun: false })

    expect(deps.workspace.publish).toHaveBeenCalledWith({ dryRun: false, tag: 'beta' })
  })

  it('should refuse before building when GITHUB_TOKEN is missing', async () => {
    const deps = makeDeps({ hasGithubToken: false })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/GITHUB_TOKEN/)
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should refuse a non-v4 version before building (major guard)', async () => {
    const deps = makeDeps({
      workspace: {
        build: vi.fn(async () => {}),
        publish: vi.fn(async () => {}),
        version: vi.fn(async () => '3.85.2'),
      },
    })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/pinned to v4/)
    expect(deps.workspace.build).not.toHaveBeenCalled()
  })

  it('should refuse a stable v4 version with no beta/canary id', async () => {
    const deps = makeDeps({
      workspace: {
        build: vi.fn(async () => {}),
        publish: vi.fn(async () => {}),
        version: vi.fn(async () => '4.0.0'),
      },
    })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/prerelease line must be/)
    expect(deps.workspace.build).not.toHaveBeenCalled()
  })

  it('should refuse an unsupported prerelease line instead of defaulting to latest', async () => {
    const deps = makeDeps({
      workspace: {
        build: vi.fn(async () => {}),
        publish: vi.fn(async () => {}),
        version: vi.fn(async () => '4.1.0-internal.abc1234'),
      },
    })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/prerelease line must be/)
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should skip build, publish, and draft in dry-run but still generate notes', async () => {
    const deps = makeDeps()

    await runReleaseCi({ deps, dryRun: true })

    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
    expect(deps.createDraftGitHubRelease).not.toHaveBeenCalled()
    expect(deps.generateReleaseNotes).toHaveBeenCalledOnce()
  })
})
