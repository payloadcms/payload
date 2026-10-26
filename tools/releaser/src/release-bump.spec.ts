import { describe, expect, it, vi } from 'vitest'

import { runReleaseBump } from './release-bump.js'

const baseDeps = () => ({
  env: { GITHUB_TOKEN: 'token' } as NodeJS.ProcessEnv,
  getCommitBump: vi.fn(async (): Promise<null | string> => 'patch'),
  isPublished: vi.fn(async () => false),
  log: vi.fn(),
  readBranch: () => '3.x',
  run: vi.fn(),
  workspace: {
    bumpVersion: vi.fn(async () => '3.90.3'),
    version: vi.fn(async () => '3.90.2'),
  },
})

const makeDeps = (
  over: Partial<ReturnType<typeof baseDeps>> = {},
): ReturnType<typeof baseDeps> => ({ ...baseDeps(), ...over })

describe('runReleaseBump', () => {
  it('should bump, configure identity, commit, tag, then push in order', async () => {
    const deps = makeDeps()

    const next = await runReleaseBump({ bump: 'auto', deps, dryRun: false })

    expect(next).toBe('3.90.3')
    expect(deps.workspace.bumpVersion).toHaveBeenCalledWith('patch')

    const cmds = deps.run.mock.calls.map((call) => call[0] as string)
    expect(cmds).toContain('git add packages/**/package.json package.json')
    expect(cmds).toContain('git commit -m "chore(release): v3.90.3"')
    expect(cmds).toContain('git tag -a v3.90.3 -m v3.90.3')

    const tagIdx = cmds.indexOf('git tag -a v3.90.3 -m v3.90.3')
    const pushIdx = cmds.findIndex((cmd) => cmd.startsWith('git push --atomic'))
    expect(pushIdx).toBeGreaterThan(tagIdx)
  })

  it('should abort before any git write or bump when not on 3.x', async () => {
    const deps = makeDeps({ readBranch: () => 'main' })

    await expect(runReleaseBump({ bump: 'auto', deps, dryRun: false })).rejects.toThrow(/3\.x/)

    expect(deps.run).not.toHaveBeenCalled()
    expect(deps.workspace.bumpVersion).not.toHaveBeenCalled()
  })

  it('should bump a minor version', async () => {
    const deps = makeDeps({
      getCommitBump: vi.fn(async (): Promise<null | string> => 'minor'),
      workspace: {
        bumpVersion: vi.fn(async () => '3.91.0'),
        version: vi.fn(async () => '3.90.2'),
      },
    })

    const next = await runReleaseBump({ bump: 'auto', deps, dryRun: false })

    expect(next).toBe('3.91.0')
    expect(deps.workspace.bumpVersion).toHaveBeenCalledWith('minor')
  })

  it('should abort before any git write when the computed version is already published', async () => {
    const deps = makeDeps({ isPublished: vi.fn(async () => true) })

    await expect(runReleaseBump({ bump: 'auto', deps, dryRun: false })).rejects.toThrow(
      /already published/,
    )

    expect(deps.isPublished).toHaveBeenCalledWith({
      name: 'payload',
      version: '3.90.3',
    })
    expect(deps.run).not.toHaveBeenCalled()
  })

  it('should abort when the registry check fails rather than assuming unpublished', async () => {
    const deps = makeDeps({
      isPublished: vi.fn(async () => {
        throw new Error('503 Service Unavailable')
      }),
    })

    await expect(runReleaseBump({ bump: 'auto', deps, dryRun: false })).rejects.toThrow(/503/)

    expect(deps.run).not.toHaveBeenCalled()
  })

  it('should run the already-published guard in dry-run too', async () => {
    const deps = makeDeps({ isPublished: vi.fn(async () => true) })

    await expect(runReleaseBump({ bump: 'auto', deps, dryRun: true })).rejects.toThrow(
      /already published/,
    )
  })

  it('should log the push and never execute it in dry-run', async () => {
    const deps = makeDeps()

    await runReleaseBump({ bump: 'auto', deps, dryRun: true })

    const runCmds = deps.run.mock.calls.map((call) => call[0] as string)
    expect(runCmds.some((cmd) => cmd.startsWith('git push'))).toBe(false)

    const logs = deps.log.mock.calls.map((call) => call[0] as string)
    expect(logs.some((line) => line.includes('git push --atomic'))).toBe(true)
  })
})
