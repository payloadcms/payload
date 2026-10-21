import { describe, expect, it, vi } from 'vitest'

import { runReleaseBump } from './release-bump.js'

const baseDeps = () => ({
  env: { GITHUB_TOKEN: 'token' } as NodeJS.ProcessEnv,
  findChangelogBaseTag: vi.fn(async (): Promise<string | undefined> => 'v4.0.0-beta.9'),
  generateReleaseNotes: vi.fn(async () => ({ releaseNotes: '## notes' })),
  getCommitBump: vi.fn(async (): Promise<null | string> => 'minor'),
  isPublished: vi.fn(async () => false),
  log: vi.fn(),
  readBranch: () => 'main',
  run: vi.fn(),
  workspace: {
    bumpVersion: vi.fn(async () => '4.0.0-beta.10'),
    version: vi.fn(async () => '4.0.0-beta.9'),
  },
  writeSummary: vi.fn(),
})

const makeDeps = (
  over: Partial<ReturnType<typeof baseDeps>> = {},
): ReturnType<typeof baseDeps> => ({ ...baseDeps(), ...over })

describe('runReleaseBump', () => {
  it('should bump, configure identity, commit, tag, then push in order', async () => {
    const deps = makeDeps()

    const next = await runReleaseBump({ bump: 'auto', deps, dryRun: false, preid: 'beta' })

    expect(next).toBe('4.0.0-beta.10')
    expect(deps.workspace.bumpVersion).toHaveBeenCalledWith('prerelease', { preid: 'beta' })

    const cmds = deps.run.mock.calls.map((call) => call[0] as string)
    expect(cmds).toContain('git add packages/**/package.json package.json')
    expect(cmds).toContain('git commit -m "chore(release): v4.0.0-beta.10"')
    expect(cmds).toContain('git tag -a v4.0.0-beta.10 -m v4.0.0-beta.10')

    const tagIdx = cmds.indexOf('git tag -a v4.0.0-beta.10 -m v4.0.0-beta.10')
    const pushIdx = cmds.findIndex((cmd) => cmd.startsWith('git push --atomic'))
    expect(pushIdx).toBeGreaterThan(tagIdx)
  })

  it('should abort before any git write or bump when not on main', async () => {
    const deps = makeDeps({ readBranch: () => 'feature' })

    await expect(
      runReleaseBump({ bump: 'auto', deps, dryRun: false, preid: 'beta' }),
    ).rejects.toThrow(/main/)

    expect(deps.run).not.toHaveBeenCalled()
    expect(deps.workspace.bumpVersion).not.toHaveBeenCalled()
  })

  it('should bump a canary version onto the requested beta line', async () => {
    const deps = makeDeps({
      workspace: {
        bumpVersion: vi.fn(async () => '4.0.0-beta.0'),
        version: vi.fn(async () => '4.0.0-canary.9'),
      },
    })

    const next = await runReleaseBump({ bump: 'auto', deps, dryRun: false, preid: 'beta' })

    expect(next).toBe('4.0.0-beta.0')
    expect(deps.workspace.bumpVersion).toHaveBeenCalledWith('prerelease', { preid: 'beta' })
  })

  it('should abort before any git write when the computed version is already published', async () => {
    const deps = makeDeps({ isPublished: vi.fn(async () => true) })

    await expect(
      runReleaseBump({ bump: 'auto', deps, dryRun: false, preid: 'beta' }),
    ).rejects.toThrow(/already published/)

    expect(deps.isPublished).toHaveBeenCalledWith({
      name: 'payload',
      version: '4.0.0-beta.10',
    })
    expect(deps.run).not.toHaveBeenCalled()
  })

  it('should abort when the registry check fails rather than assuming unpublished', async () => {
    const deps = makeDeps({
      isPublished: vi.fn(async () => {
        throw new Error('503 Service Unavailable')
      }),
    })

    await expect(
      runReleaseBump({ bump: 'auto', deps, dryRun: false, preid: 'beta' }),
    ).rejects.toThrow(/503/)

    expect(deps.run).not.toHaveBeenCalled()
  })

  it('should run the already-published guard in dry-run too', async () => {
    const deps = makeDeps({ isPublished: vi.fn(async () => true) })

    await expect(
      runReleaseBump({ bump: 'auto', deps, dryRun: true, preid: 'beta' }),
    ).rejects.toThrow(/already published/)
  })

  it('should log the push and never execute it in dry-run', async () => {
    const deps = makeDeps()

    await runReleaseBump({ bump: 'auto', deps, dryRun: true, preid: 'beta' })

    const runCmds = deps.run.mock.calls.map((call) => call[0] as string)
    expect(runCmds.some((cmd) => cmd.startsWith('git push'))).toBe(false)

    const logs = deps.log.mock.calls.map((call) => call[0] as string)
    expect(logs.some((line) => line.includes('git push --atomic'))).toBe(true)
  })

  it('should preview release notes for the bumped version in dry-run', async () => {
    const deps = makeDeps()

    await runReleaseBump({ bump: 'auto', deps, dryRun: true, preid: 'beta' })

    expect(deps.findChangelogBaseTag).toHaveBeenCalledWith({ version: '4.0.0-beta.10' })
    expect(deps.generateReleaseNotes).toHaveBeenCalledWith({
      fromVersion: 'v4.0.0-beta.9',
      releaseTag: 'v4.0.0-beta.10',
      toVersion: 'HEAD',
    })

    const logs = deps.log.mock.calls.map((call) => call[0] as string)
    expect(logs.some((line) => line.includes('## notes'))).toBe(true)
    expect(deps.writeSummary).toHaveBeenCalledWith('## notes')
  })

  it('should fail the dry run when no changelog base tag exists', async () => {
    const deps = makeDeps({ findChangelogBaseTag: vi.fn(async () => undefined) })

    await expect(
      runReleaseBump({ bump: 'auto', deps, dryRun: true, preid: 'beta' }),
    ).rejects.toThrow(/changelog base tag/)

    expect(deps.run).not.toHaveBeenCalled()
  })

  it('should not generate notes on a real run', async () => {
    const deps = makeDeps()

    await runReleaseBump({ bump: 'auto', deps, dryRun: false, preid: 'beta' })

    expect(deps.findChangelogBaseTag).not.toHaveBeenCalled()
    expect(deps.generateReleaseNotes).not.toHaveBeenCalled()
    expect(deps.writeSummary).not.toHaveBeenCalled()
  })
})
