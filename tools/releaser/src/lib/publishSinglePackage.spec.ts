import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('child_process', () => ({ execSync: vi.fn(), spawn: vi.fn() }))
vi.mock('./getPackageRegistryVersions.js', () => ({ isVersionPublished: vi.fn() }))

import { spawn } from 'child_process'

import { isVersionPublished } from './getPackageRegistryVersions.js'
import { publishSinglePackage } from './getWorkspace.js'

const pkg = {
  name: 'payload',
  packagePath: 'packages/payload' as const,
  shortName: 'payload',
  version: '4.0.0-canary.10',
}

// A fake ChildProcess that streams optional stderr then emits 'close' with the
// given exit code, once the helper has attached its listeners (mirrors spawn's
// async, non-throwing exit with piped stdout/stderr).
const spawnExiting = (exitCode: number, stderr = '') => {
  const child = Object.assign(new EventEmitter(), {
    stderr: new EventEmitter(),
    stdout: new EventEmitter(),
  })
  queueMicrotask(() => {
    if (stderr) {
      child.stderr.emit('data', Buffer.from(stderr))
    }
    child.emit('close', exitCode)
  })
  return child
}

describe('publishSinglePackage idempotency + retry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should skip-as-success when the version is already published', async () => {
    vi.mocked(isVersionPublished).mockResolvedValue(true)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result).toEqual({ name: 'payload', success: true })
    expect(spawn).not.toHaveBeenCalled()
  })

  it('should publish when the version is not yet published', async () => {
    vi.mocked(isVersionPublished).mockResolvedValue(false)
    vi.mocked(spawn).mockImplementation(() => spawnExiting(0) as never)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result.success).toBe(true)
    expect(spawn).toHaveBeenCalledTimes(1)
  })

  it('should retry once on failure, then succeed', async () => {
    vi.mocked(isVersionPublished).mockResolvedValue(false)
    vi.mocked(spawn)
      .mockImplementationOnce(() => spawnExiting(1) as never)
      .mockImplementationOnce(() => spawnExiting(0) as never)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result.success).toBe(true)
    expect(spawn).toHaveBeenCalledTimes(2)
  })

  it('should treat an "already published" publish conflict as success without retrying', async () => {
    // The registry read (pre-check and recheck) says NOT published (the CDN-lag
    // race), but the publish itself reports the authoritative conflict.
    vi.mocked(isVersionPublished).mockResolvedValue(false)
    vi.mocked(spawn).mockImplementation(
      () =>
        spawnExiting(
          1,
          'npm error code EPUBLISHCONFLICT\nYou cannot publish over the previously published versions: 4.0.0-canary.10',
        ) as never,
    )

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result.success).toBe(true)
    expect(spawn).toHaveBeenCalledTimes(1)
  })

  it('should treat a landed-despite-error version as success after a failed retry', async () => {
    vi.mocked(isVersionPublished).mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    vi.mocked(spawn)
      .mockImplementationOnce(() => spawnExiting(1) as never)
      .mockImplementationOnce(() => spawnExiting(1) as never)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result.success).toBe(true)
  })

  it('should return a failure result when the retry fails and the version has not landed', async () => {
    vi.mocked(isVersionPublished).mockResolvedValue(false)
    vi.mocked(spawn)
      .mockImplementationOnce(() => spawnExiting(1) as never)
      .mockImplementationOnce(() => spawnExiting(1) as never)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result.success).toBe(false)
    expect(result.details).toContain('exit code 1')
    expect(spawn).toHaveBeenCalledTimes(2)
  })

  it('should proceed to publish (not abort) when the registry pre-check throws', async () => {
    vi.mocked(isVersionPublished).mockRejectedValue(new Error('registry down'))
    vi.mocked(spawn).mockImplementation(() => spawnExiting(0) as never)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result.success).toBe(true)
    expect(spawn).toHaveBeenCalledTimes(1)
  })
})
