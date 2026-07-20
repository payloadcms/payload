import { describe, expect, it, vi } from 'vitest'

import { runReleaseBump } from './release-bump.js'

const baseDeps = () => ({
  env: { GITHUB_TOKEN: 'token' } as NodeJS.ProcessEnv,
  log: vi.fn(),
  readBranch: () => 'main',
  run: vi.fn(),
  workspace: {
    bumpVersion: vi.fn(async () => '4.0.0-canary.10'),
    version: vi.fn(async () => '4.0.0-canary.9'),
  },
})

const makeDeps = (
  over: Partial<ReturnType<typeof baseDeps>> = {},
): ReturnType<typeof baseDeps> => ({ ...baseDeps(), ...over })

describe('runReleaseBump', () => {
  it('should bump, configure identity, commit, tag, then push in order', async () => {
    const deps = makeDeps()

    const next = await runReleaseBump({ bump: 'prerelease', deps, dryRun: false, preid: 'canary' })

    expect(next).toBe('4.0.0-canary.10')
    expect(deps.workspace.bumpVersion).toHaveBeenCalledWith('prerelease', { preid: 'canary' })

    const cmds = deps.run.mock.calls.map((call) => call[0] as string)
    expect(cmds).toContain('git add packages/**/package.json package.json')
    expect(cmds).toContain('git commit -m "chore(release): v4.0.0-canary.10"')
    expect(cmds).toContain('git tag -a v4.0.0-canary.10 -m v4.0.0-canary.10')

    const tagIdx = cmds.indexOf('git tag -a v4.0.0-canary.10 -m v4.0.0-canary.10')
    const pushIdx = cmds.findIndex((cmd) => cmd.startsWith('git push --atomic'))
    expect(pushIdx).toBeGreaterThan(tagIdx)
  })

  it('should abort before any git write or bump when not on main', async () => {
    const deps = makeDeps({ readBranch: () => 'feature' })

    await expect(
      runReleaseBump({ bump: 'prerelease', deps, dryRun: false, preid: 'canary' }),
    ).rejects.toThrow(/main/)

    expect(deps.run).not.toHaveBeenCalled()
    expect(deps.workspace.bumpVersion).not.toHaveBeenCalled()
  })

  it('should pass the requested preid through to bumpVersion (not hardcode canary)', async () => {
    const deps = makeDeps({
      workspace: {
        bumpVersion: vi.fn(async () => '4.0.0-beta.0'),
        version: vi.fn(async () => '4.0.0-canary.9'),
      },
    })

    const next = await runReleaseBump({ bump: 'prerelease', deps, dryRun: false, preid: 'beta' })

    expect(next).toBe('4.0.0-beta.0')
    expect(deps.workspace.bumpVersion).toHaveBeenCalledWith('prerelease', { preid: 'beta' })
  })

  it('should log the push and never execute it in dry-run', async () => {
    const deps = makeDeps()

    await runReleaseBump({ bump: 'prerelease', deps, dryRun: true, preid: 'canary' })

    const runCmds = deps.run.mock.calls.map((call) => call[0] as string)
    expect(runCmds.some((cmd) => cmd.startsWith('git push'))).toBe(false)

    const logs = deps.log.mock.calls.map((call) => call[0] as string)
    expect(logs.some((line) => line.includes('git push --atomic'))).toBe(true)
  })
})
