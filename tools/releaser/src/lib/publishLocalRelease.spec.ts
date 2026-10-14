import { describe, expect, it, vi } from 'vitest'

import type { PackageDetails } from './getPackageDetails.js'
import type { StableDistTag } from './stableDistTag.js'

import { publishLocalRelease } from './publishLocalRelease.js'

const previousVersion = '3.90.2'
const version = '3.90.3'

const mkPkg = (name: string): PackageDetails => ({
  name,
  packagePath: `packages/${name}`,
  shortName: name,
  version: previousVersion,
})

const packages = ['translations', 'payload', 'ui'].map(mkPkg)

const distTags = new Map<string, StableDistTag>(packages.map((pkg) => [pkg.name, 'latest']))

const getLatestVersion = vi.fn(async () => previousVersion)

/** Mirrors the publish pre-check: a version npm already has is skipped as a success. */
const publishedOnNpm = new Set([previousVersion])

const publishUnlessOnNpm = async ({ pkg }: { pkg: PackageDetails; tag: StableDistTag }) => ({
  details: publishedOnNpm.has(pkg.version) ? 'skipped' : 'published',
  name: pkg.name,
  success: true,
})

describe('publishLocalRelease', () => {
  it('should publish every package with the release version when the previous version is on npm', async () => {
    const publishFirst = vi.fn(publishUnlessOnNpm)
    const publishRest = vi.fn(publishUnlessOnNpm)

    const outcome = await publishLocalRelease({
      distTags,
      getLatestVersion,
      packages,
      publishFirst,
      publishRest,
      version,
    })

    const publishedPackages = [...publishFirst.mock.calls, ...publishRest.mock.calls].map(
      ([args]) => args.pkg,
    )
    const results = await Promise.all(
      [...publishFirst.mock.results, ...publishRest.mock.results].map(({ value }) => value),
    )

    expect(outcome).toEqual({ isComplete: true })
    expect(publishedPackages.map((pkg) => pkg.version)).toEqual([version, version, version])
    expect(results.map((result) => result.details)).toEqual(['published', 'published', 'published'])
  })

  it('should publish only the first package interactively', async () => {
    const publishFirst = vi.fn(publishUnlessOnNpm)
    const publishRest = vi.fn(publishUnlessOnNpm)

    await publishLocalRelease({
      distTags,
      getLatestVersion,
      packages,
      publishFirst,
      publishRest,
      version,
    })

    expect(publishFirst.mock.calls.map(([args]) => args.pkg.name)).toEqual(['translations'])
    expect(publishRest.mock.calls.map(([args]) => args.pkg.name)).toEqual(['payload', 'ui'])
  })

  it('should stop at the first failure and return the failed result', async () => {
    const failedResult = { details: 'pnpm publish failed', name: 'payload', success: false }
    const publishRest = vi.fn(async () => failedResult)

    const outcome = await publishLocalRelease({
      distTags,
      getLatestVersion,
      packages,
      publishFirst: publishUnlessOnNpm,
      publishRest,
      version,
    })

    expect(outcome).toMatchObject({ failedResult, isComplete: false })
    expect(publishRest).toHaveBeenCalledTimes(1)
  })

  it('should return the guard refusal as the failed result', async () => {
    const publishFirst = vi.fn(publishUnlessOnNpm)

    const outcome = await publishLocalRelease({
      distTags,
      getLatestVersion: async () => '4.0.0',
      packages,
      publishFirst,
      publishRest: publishUnlessOnNpm,
      version,
    })

    expect(outcome).toMatchObject({
      failedResult: { name: 'translations', success: false },
      isComplete: false,
    })
    expect(publishFirst).not.toHaveBeenCalled()
  })
})
