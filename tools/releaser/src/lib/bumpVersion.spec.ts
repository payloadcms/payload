import { PROJECT_ROOT, ROOT_PACKAGE_JSON } from '@tools/constants'
import fse from 'fs-extra'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('fs-extra', () => {
  const readJSON = vi.fn(async () => ({ version: '4.0.0-canary.9' }))
  const writeJSON = vi.fn(async () => undefined)
  return { default: { readJSON, writeJSON }, readJSON, writeJSON }
})
vi.mock('./getPackageDetails.js', () => ({
  getPackageDetails: vi.fn(async () => []),
}))

import { getPackageDetails } from './getPackageDetails.js'
import { getWorkspace } from './getWorkspace.js'

describe('bumpVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fse.readJSON).mockImplementation(async () => ({ version: '4.0.0-canary.9' }))
    vi.mocked(getPackageDetails).mockResolvedValue([])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    { version: '4.0.0-canary.37', expected: '4.0.0-beta.0', preid: 'beta' as const },
    { version: '4.0.0-beta.0', expected: '4.0.0-beta.1', preid: 'beta' as const },
  ])(
    'should bump $version to $expected in the root and release packages',
    async ({ version, expected, preid }) => {
      vi.mocked(fse.readJSON).mockImplementation(async () => ({ version }))
      vi.mocked(getPackageDetails).mockResolvedValue([
        { name: 'payload', packagePath: 'packages/payload', shortName: 'payload', version },
        { name: '@payloadcms/ui', packagePath: 'packages/ui', shortName: 'ui', version },
      ])

      const workspace = getWorkspace()

      const next = await workspace.bumpVersion('prerelease', { preid })

      expect(next).toBe(expected)
      expect(fse.writeJSON).toHaveBeenCalledTimes(3)
      for (const packageJsonPath of [
        ROOT_PACKAGE_JSON,
        path.resolve(PROJECT_ROOT, 'packages/payload/package.json'),
        path.resolve(PROJECT_ROOT, 'packages/ui/package.json'),
      ]) {
        expect(fse.writeJSON).toHaveBeenCalledWith(
          packageJsonPath,
          { version: expected },
          { spaces: 2 },
        )
      }
    },
  )

  it('should write the date-based canary version without reading the registry', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const next = await getWorkspace().bumpVersion('canary', {
      date: new Date('2026-11-12T07:00:00Z'),
    })

    // Root fixture 4.0.0-canary.9 has base 4.0.0.
    expect(next).toBe('4.0.0-canary.20261112')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(fse.writeJSON).toHaveBeenCalledWith(
      ROOT_PACKAGE_JSON,
      { version: '4.0.0-canary.20261112' },
      { spaces: 2 },
    )
  })
})
