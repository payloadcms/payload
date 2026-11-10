import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('fs-extra', () => ({
  default: { readJSON: vi.fn(), writeJSON: vi.fn() },
}))
vi.mock('child_process', () => ({ execSync: vi.fn(), spawn: vi.fn() }))
vi.mock('./getPackageDetails.js', () => ({ getPackageDetails: vi.fn() }))

import { execSync } from 'child_process'
import fse from 'fs-extra'

import { getPackageDetails } from './getPackageDetails.js'
import { getWorkspace } from './getWorkspace.js'

const packages = [
  { name: 'payload', packagePath: 'packages/payload', shortName: 'payload', version: '3.90.2' },
  { name: '@payloadcms/ui', packagePath: 'packages/ui', shortName: 'ui', version: '3.90.2' },
]

const writtenVersions = () =>
  vi.mocked(fse.writeJSON).mock.calls.map(([, json]) => (json as { version: string }).version)

describe('bumpVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.mocked(fse.readJSON).mockResolvedValue({ version: '3.90.2' })
    vi.mocked(getPackageDetails).mockResolvedValue(packages)
  })

  it.each([
    ['patch', '3.90.3'],
    ['minor', '3.91.0'],
  ] as const)('should bump 3.90.2 with %s to %s', async (bump, expected) => {
    const result = await getWorkspace().bumpVersion(bump)

    expect(result).toBe(expected)
    expect(writtenVersions()).toEqual([expected, expected, expected])
  })

  it('should produce an internal version from the next minor', async () => {
    vi.mocked(execSync).mockReturnValue('abc1234\n')

    const result = await getWorkspace().bumpVersion('internal')

    expect(result).toBe('3.91.0-internal.abc1234')
  })

  it('should throw for an unsupported bump type', async () => {
    // @ts-expect-error prerelease bumps are not part of the supported union
    await expect(getWorkspace().bumpVersion('prerelease')).rejects.toThrow(/Invalid bump type/)
    expect(fse.writeJSON).not.toHaveBeenCalled()
  })
})
