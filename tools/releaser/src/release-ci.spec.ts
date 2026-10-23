import { describe, expect, it, vi } from 'vitest'

import { runReleaseCi } from './release-ci.js'

const defaultTriggerTag: string | undefined = 'v4.0.0-beta.10'

const baseDeps = () => ({
  addDistTag: vi.fn(async (_args: { name: string; tag: string; version: string }) => {}),
  createDraftGitHubRelease: vi.fn(async () => ({ releaseUrl: 'https://gh/release' })),
  findChangelogBaseTag: vi.fn(async () => 'v4.0.0-beta.9'),
  generateReleaseNotes: vi.fn(async () => ({
    releaseNotes: 'notes',
    releaseUrl: 'https://gh/new',
  })),
  hasGithubToken: true,
  log: vi.fn(),
  triggerTag: defaultTriggerTag,
  workspace: {
    build: vi.fn(async () => {}),
    publish: vi.fn(async () => {}),
    version: vi.fn(async () => '4.0.0-beta.10'),
  },
})

const makeDeps = (
  over: Partial<ReturnType<typeof baseDeps>> = {},
): ReturnType<typeof baseDeps> => ({ ...baseDeps(), ...over })

const betaVersion = '4.0.0-beta.10'

describe('runReleaseCi', () => {
  it('should build, publish, generate notes, and create a draft in order', async () => {
    const deps = makeDeps()

    await runReleaseCi({ deps, dryRun: false })

    expect(deps.workspace.build).toHaveBeenCalledOnce()
    expect(deps.workspace.publish).toHaveBeenCalledWith({ dryRun: false, tag: 'beta' })
    expect(deps.findChangelogBaseTag).toHaveBeenCalledWith({ version: '4.0.0-beta.10' })
    expect(deps.generateReleaseNotes).toHaveBeenCalledWith({
      fromVersion: 'v4.0.0-beta.9',
      toVersion: 'v4.0.0-beta.10',
    })
    expect(deps.createDraftGitHubRelease).toHaveBeenCalledWith({
      branch: 'main',
      releaseNotes: 'notes',
      tag: 'v4.0.0-beta.10',
    })

    const notesOrder = deps.generateReleaseNotes.mock.invocationCallOrder[0]
    const buildOrder = deps.workspace.build.mock.invocationCallOrder[0]
    const publishOrder = deps.workspace.publish.mock.invocationCallOrder[0]
    expect(buildOrder).toBeGreaterThan(notesOrder)
    expect(publishOrder).toBeGreaterThan(buildOrder)
  })

  it('should point latest at each package without a stable release after publish', async () => {
    const deps = makeDeps()

    await runReleaseCi({ deps, dryRun: false })

    expect(deps.addDistTag.mock.calls.map(([args]) => args)).toEqual([
      { name: '@payloadcms/codemod', tag: 'latest', version: betaVersion },
      { name: '@payloadcms/tanstack-start', tag: 'latest', version: betaVersion },
      { name: '@payloadcms/transformer-sharp', tag: 'latest', version: betaVersion },
    ])

    const publishOrder = deps.workspace.publish.mock.invocationCallOrder[0]
    const tagOrder = deps.addDistTag.mock.invocationCallOrder[0]
    const draftOrder = deps.createDraftGitHubRelease.mock.invocationCallOrder[0]
    expect(tagOrder).toBeGreaterThan(publishOrder)
    expect(draftOrder).toBeGreaterThan(tagOrder)
  })

  it('should retry a failed dist-tag once', async () => {
    const addDistTag = vi
      .fn(async (_args: { name: string; tag: string; version: string }) => {})
      .mockRejectedValueOnce(new Error('ECONNRESET'))
    const deps = makeDeps({ addDistTag })

    await runReleaseCi({ deps, dryRun: false })

    expect(
      addDistTag.mock.calls.filter(([args]) => args.name === '@payloadcms/codemod'),
    ).toHaveLength(2)
    expect(deps.log).toHaveBeenCalledWith(
      `Pointed dist-tag 'latest' at @payloadcms/codemod@${betaVersion}`,
    )
  })

  it('should warn per package and still create the draft when dist-tag keeps failing', async () => {
    const addDistTag = vi.fn(async (_args: { name: string; tag: string; version: string }) => {
      throw new Error('E401')
    })
    const deps = makeDeps({ addDistTag })

    await runReleaseCi({ deps, dryRun: false })

    expect(addDistTag).toHaveBeenCalledTimes(6)
    expect(deps.log).toHaveBeenCalledWith(
      `::warning title=dist-tag latest failed::Could not point 'latest' at @payloadcms/codemod@${betaVersion} (E401). Run manually: npm dist-tag add @payloadcms/codemod@${betaVersion} latest`,
    )
    expect(deps.log).toHaveBeenCalledWith(
      expect.stringContaining(
        `npm dist-tag add @payloadcms/transformer-sharp@${betaVersion} latest`,
      ),
    )
    expect(deps.createDraftGitHubRelease).toHaveBeenCalledOnce()
  })

  it('should keep the dist-tag warning annotation on one line', async () => {
    const addDistTag = vi.fn(async (_args: { name: string; tag: string; version: string }) => {
      throw new Error('Command failed\nE403 100% forbidden')
    })
    const deps = makeDeps({ addDistTag })

    await runReleaseCi({ deps, dryRun: false })

    expect(deps.log).toHaveBeenCalledWith(
      expect.stringContaining('(Command failed%0AE403 100%25 forbidden)'),
    )
  })

  it('should derive the beta dist-tag from a beta version', async () => {
    const deps = makeDeps()

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

  it('should refuse a stable v4 version with no prerelease id', async () => {
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

  it('should refuse when no changelog base tag is available', async () => {
    const deps = makeDeps({ findChangelogBaseTag: vi.fn(async () => undefined) })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/changelog base tag/)
    expect(deps.generateReleaseNotes).not.toHaveBeenCalled()
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should refuse a canary version', async () => {
    const deps = makeDeps({
      triggerTag: 'v4.0.0-canary.40',
      workspace: {
        build: vi.fn(async () => {}),
        publish: vi.fn(async () => {}),
        version: vi.fn(async () => '4.0.0-canary.40'),
      },
    })

    await expect(runReleaseCi({ deps, dryRun: false })).rejects.toThrow(/prerelease line must be/)
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should refuse an unsupported prerelease line', async () => {
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

  it('should refuse before building when the trigger tag does not match the version', async () => {
    const deps = makeDeps({ triggerTag: 'v4.0.0-beta.11' })

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
    const deps = makeDeps({ triggerTag: 'v4.0.0-beta.11' })

    await expect(runReleaseCi({ deps, dryRun: true })).rejects.toThrow(/does not match/)
  })

  it('should skip build, publish, and draft in dry-run but still generate notes', async () => {
    const deps = makeDeps()

    await runReleaseCi({ deps, dryRun: true })

    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
    expect(deps.addDistTag).not.toHaveBeenCalled()
    expect(deps.createDraftGitHubRelease).not.toHaveBeenCalled()
    expect(deps.generateReleaseNotes).toHaveBeenCalledOnce()
  })

  it('should log the planned latest moves without tagging in dry-run', async () => {
    const deps = makeDeps()

    await runReleaseCi({ deps, dryRun: true })

    expect(deps.addDistTag).not.toHaveBeenCalled()
    expect(deps.log).toHaveBeenCalledWith(
      `[dry-run] would point dist-tag 'latest' at @payloadcms/tanstack-start@${betaVersion}`,
    )
  })
})
