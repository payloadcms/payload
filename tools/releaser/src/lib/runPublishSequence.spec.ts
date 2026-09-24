import { describe, expect, it, vi } from 'vitest'

import type { PackageDetails } from './getPackageDetails.js'

import { runPublishSequence } from './runPublishSequence.js'

const mkPkg = (name: string): PackageDetails => ({
  name,
  packagePath: `packages/${name}`,
  shortName: name,
  version: '4.0.0-canary.10',
})

const packages = ['a', 'b', 'c', 'd', 'e'].map(mkPkg)

describe('runPublishSequence', () => {
  it('should invoke publishOne for every package on the success path', async () => {
    const publishOne = vi.fn(async (pkg: PackageDetails) => ({ name: pkg.name, success: true }))

    const results = await runPublishSequence({ packages, publishOne })

    expect(publishOne).toHaveBeenCalledTimes(5)
    expect(results).toHaveLength(5)
  })

  it('should stop at the first failure and never invoke later packages', async () => {
    const publishOne = vi.fn(async (pkg: PackageDetails) => ({
      name: pkg.name,
      success: pkg.name !== 'c',
    }))

    await expect(runPublishSequence({ packages, publishOne })).rejects.toThrow(/c/)

    expect(publishOne).toHaveBeenCalledTimes(3) // a, b, c — d and e never attempted
    expect(publishOne.mock.calls.map((call) => call[0].name)).toEqual(['a', 'b', 'c'])
  })
})
