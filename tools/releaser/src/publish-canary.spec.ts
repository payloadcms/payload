import { describe, expect, it, vi } from 'vitest'

import type { PublishCanaryDeps } from './publish-canary.js'

import { runPublishCanary } from './publish-canary.js'

const version = '4.0.0-canary.20261112'

const makeDeps = ({ isAtHead = false }: { isAtHead?: boolean } = {}) => {
  const workspace = {
    build: vi.fn(async () => {}),
    bumpVersion: vi.fn(async () => version),
    publish: vi.fn(async () => {}),
  }
  const deps = {
    assertCanaryVersionFromHead: vi.fn(async () => {}),
    getHead: vi.fn(() => 'abc123'),
    isCanaryAtHead: vi.fn(async () => isAtHead),
    log: vi.fn(),
    workspace,
  } satisfies PublishCanaryDeps
  return deps
}

describe('runPublishCanary', () => {
  it('should bump, guard, build, then publish with the canary tag in order', async () => {
    const deps = makeDeps()

    const result = await runPublishCanary({ deps, dryRun: false, shouldSkipIfUnchanged: false })

    expect(result).toBe('published')
    expect(deps.workspace.bumpVersion).toHaveBeenCalledWith('canary')
    expect(deps.assertCanaryVersionFromHead).toHaveBeenCalledWith({ head: 'abc123', version })
    expect(deps.workspace.publish).toHaveBeenCalledWith({ dryRun: false, tag: 'canary' })
    const callOrder = [
      deps.workspace.bumpVersion,
      deps.assertCanaryVersionFromHead,
      deps.workspace.build,
      deps.workspace.publish,
    ].map((fn) => fn.mock.invocationCallOrder[0])
    expect(callOrder).toEqual([...callOrder].sort((a, b) => (a ?? 0) - (b ?? 0)))
  })

  it('should skip without bumping when skip is requested and the canary is at HEAD', async () => {
    const deps = makeDeps({ isAtHead: true })

    const result = await runPublishCanary({ deps, dryRun: false, shouldSkipIfUnchanged: true })

    expect(result).toBe('skipped')
    expect(deps.isCanaryAtHead).toHaveBeenCalledWith({ head: 'abc123' })
    expect(deps.workspace.bumpVersion).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should publish when skip is requested and the canary is not at HEAD', async () => {
    const deps = makeDeps({ isAtHead: false })

    const result = await runPublishCanary({ deps, dryRun: false, shouldSkipIfUnchanged: true })

    expect(result).toBe('published')
    expect(deps.workspace.publish).toHaveBeenCalledOnce()
  })

  it('should not run the skip check when skip is not requested', async () => {
    const deps = makeDeps({ isAtHead: true })

    const result = await runPublishCanary({ deps, dryRun: false, shouldSkipIfUnchanged: false })

    expect(result).toBe('published')
    expect(deps.isCanaryAtHead).not.toHaveBeenCalled()
  })

  it('should stop before build when the guard throws', async () => {
    const deps = makeDeps()
    deps.assertCanaryVersionFromHead.mockRejectedValueOnce(new Error('one canary per UTC day'))

    await expect(
      runPublishCanary({ deps, dryRun: false, shouldSkipIfUnchanged: false }),
    ).rejects.toThrow('one canary per UTC day')
    expect(deps.workspace.build).not.toHaveBeenCalled()
    expect(deps.workspace.publish).not.toHaveBeenCalled()
  })

  it('should warn and continue when the same-day guard throws in a dry run', async () => {
    const deps = makeDeps()
    deps.assertCanaryVersionFromHead.mockRejectedValueOnce(new Error('one canary per UTC day'))

    const result = await runPublishCanary({ deps, dryRun: true, shouldSkipIfUnchanged: false })

    expect(result).toBe('published')
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining('a real run would fail'))
    expect(deps.workspace.build).toHaveBeenCalledOnce()
    expect(deps.workspace.publish).toHaveBeenCalledWith({ dryRun: true, tag: 'canary' })
  })

  it('should pass dryRun to publish', async () => {
    const deps = makeDeps()

    await runPublishCanary({ deps, dryRun: true, shouldSkipIfUnchanged: false })

    expect(deps.workspace.publish).toHaveBeenCalledWith({ dryRun: true, tag: 'canary' })
  })
})
