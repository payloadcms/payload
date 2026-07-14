import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('execa', () => ({ default: vi.fn() }))
vi.mock('./getPackageRegistryVersions.js', () => ({ isVersionPublished: vi.fn() }))

import execa from 'execa'

import { isVersionPublished } from './getPackageRegistryVersions.js'
import { publishSinglePackage } from './getWorkspace.js'

const pkg = {
  name: 'payload',
  packagePath: 'packages/payload' as const,
  shortName: 'payload',
  version: '4.0.0-canary.10',
}

describe('publishSinglePackage idempotency + retry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should skip-as-success when the version is already published', async () => {
    vi.mocked(isVersionPublished).mockResolvedValue(true)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result).toEqual({ name: 'payload', success: true })
    expect(execa).not.toHaveBeenCalled()
  })

  it('should publish when the version is not yet published', async () => {
    vi.mocked(isVersionPublished).mockResolvedValue(false)
    vi.mocked(execa).mockResolvedValue({ exitCode: 0, stderr: '' } as never)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result.success).toBe(true)
    expect(execa).toHaveBeenCalledTimes(1)
  })

  it('should retry once on failure, then succeed', async () => {
    vi.mocked(isVersionPublished).mockResolvedValue(false)
    vi.mocked(execa)
      .mockResolvedValueOnce({ exitCode: 1, stderr: 'boom' } as never)
      .mockResolvedValueOnce({ exitCode: 0, stderr: '' } as never)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result.success).toBe(true)
    expect(execa).toHaveBeenCalledTimes(2)
  })

  it('should treat a landed-despite-error version as success after a failed retry', async () => {
    vi.mocked(isVersionPublished).mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    vi.mocked(execa)
      .mockResolvedValueOnce({ exitCode: 1, stderr: 'boom' } as never)
      .mockResolvedValueOnce({ exitCode: 1, stderr: 'boom again' } as never)

    const result = await publishSinglePackage(pkg, { tag: 'canary' })

    expect(result.success).toBe(true)
  })
})
