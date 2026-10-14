import type { PackageDetails } from './getPackageDetails.js'
import type { PublishResult } from './runPublishSequence.js'
import type { GetLatestVersion, StableDistTag } from './stableDistTag.js'

import { runPublishSequence } from './runPublishSequence.js'
import { publishWithStableDistTag } from './stableDistTag.js'

type PublishPackage = (args: { pkg: PackageDetails; tag: StableDistTag }) => Promise<PublishResult>

export type LocalPublishOutcome =
  | { error: unknown; failedResult: PublishResult | undefined; isComplete: false }
  | { isComplete: true }

/**
 * Publishes a local release in list order and stops at the first failure. Package details read
 * before the bump hold the previous version, so each package carries the release version: the
 * publish pre-check would otherwise find the previous version on npm and skip the package.
 */
export const publishLocalRelease = async ({
  distTags,
  dryRun,
  getLatestVersion,
  packages,
  publishFirst,
  publishRest,
  version,
}: {
  distTags: ReadonlyMap<string, StableDistTag>
  dryRun?: boolean
  getLatestVersion: GetLatestVersion
  packages: PackageDetails[]
  /** Publishes the first package, which prompts for the npm OTP. */
  publishFirst: PublishPackage
  publishRest: PublishPackage
  version: string
}): Promise<LocalPublishOutcome> => {
  const releasePackages = packages.map((pkg) => ({ ...pkg, version }))
  const [firstPackage] = releasePackages
  let failedResult: PublishResult | undefined

  try {
    await runPublishSequence({
      packages: releasePackages,
      publishOne: async (pkg) => {
        const publish = pkg === firstPackage ? publishFirst : publishRest
        const result = await publishWithStableDistTag({
          distTags,
          dryRun,
          getLatestVersion,
          pkg,
          publish: ({ tag }) => publish({ pkg, tag }),
          version,
        })
        if (!result.success) {
          failedResult = result
        }
        return result
      },
    })
    return { isComplete: true }
  } catch (error: unknown) {
    return { error, failedResult, isComplete: false }
  }
}
