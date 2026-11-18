import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('globby', () => ({ default: vi.fn() }))
vi.mock('fs-extra', () => ({ default: { readJson: vi.fn() } }))

import fse from 'fs-extra'
import globby from 'globby'

import { getPackageDetails } from './getPackageDetails.js'

const privateShortNames = new Set(['private-pkg'])

describe('getPackageDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(globby).mockResolvedValue(
      ['next', 'private-pkg', 'ui', 'payload', 'translations'].map(
        (shortName) => `/repo/packages/${shortName}/package.json`,
      ),
    )
    vi.mocked(fse.readJson).mockImplementation(async (packageJsonPath: string) => {
      const shortName = packageJsonPath.split('/').at(-2) ?? ''
      return {
        name: shortName === 'payload' ? 'payload' : `@payloadcms/${shortName}`,
        private: privateShortNames.has(shortName),
        version: '4.0.0-beta.2',
      }
    })
  })

  it('should return packages in whitelist order regardless of glob order', async () => {
    const details = await getPackageDetails(['translations', 'payload', 'ui', 'next'])

    expect(details.map((pkg) => pkg.shortName)).toEqual(['translations', 'payload', 'ui', 'next'])
  })

  it('should throw when a whitelist entry is missing', async () => {
    await expect(getPackageDetails(['translations', 'missing', 'payload'])).rejects.toThrow(
      'Package "missing" in publish list is missing or private',
    )
  })

  it('should throw when a whitelist entry is private', async () => {
    await expect(getPackageDetails(['translations', 'private-pkg'])).rejects.toThrow(
      'Package "private-pkg" in publish list is missing or private',
    )
  })

  it('should return every public package when no whitelist is given', async () => {
    const details = await getPackageDetails()

    expect(details.map((pkg) => pkg.shortName)).toEqual(['next', 'ui', 'payload', 'translations'])
  })

  it('should derive name, path, and version from each package.json', async () => {
    const [details] = await getPackageDetails(['ui'])

    expect(details).toEqual({
      name: '@payloadcms/ui',
      packagePath: 'packages/ui',
      shortName: 'ui',
      version: '4.0.0-beta.2',
    })
  })
})
