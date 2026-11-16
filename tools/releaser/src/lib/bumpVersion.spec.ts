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

const stubRegistryCanary = (canary: string): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ json: async () => ({ 'dist-tags': { canary } }) })),
  )
}

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
    { version: '4.0.0-canary.37', expected: '4.0.0-canary.38', preid: 'canary' as const },
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

  // The live canary path (publish-prerelease.ts calls bumpVersion('canary')):
  // derives the next iteration from the registry's current canary dist-tag, NOT
  // from the committed version. This legacy registry-fetch derivation is slated
  // for removal once canary derives from the committed version.
  it('should increment the canary iteration from the registry dist-tag', async () => {
    stubRegistryCanary('4.0.0-canary.9')
    const workspace = getWorkspace()

    const next = await workspace.bumpVersion('canary')

    expect(next).toBe('4.0.0-canary.10')
  })

  it('should reset the canary iteration to 0 when the registry canary is on a different minor base', async () => {
    stubRegistryCanary('3.99.0-canary.5')
    const workspace = getWorkspace()

    const next = await workspace.bumpVersion('canary')

    // committed 4.0.0-canary.9 --minor -> 4.0.0 base; registry mismatch -> .0
    expect(next).toBe('4.0.0-canary.0')
  })
})
