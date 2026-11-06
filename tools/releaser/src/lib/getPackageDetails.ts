import { PROJECT_ROOT } from '@tools/constants'
import fse from 'fs-extra'
import globby from 'globby'
import path from 'path'

export type PackageDetails = {
  /** Name in package.json / npm registry */
  name: string
  /** Full path to package relative to project root */
  packagePath: `packages/${string}`
  /**
   * Short name is the directory name of the package
   *
   * @example payload, db-mongodb, ui, etc
   * */
  shortName: string
  /** Version in package.json */
  version: string
}

/**
 * Accepts package whitelist (directory names inside packages dir) and returns details for each
 * public package. With a whitelist, results follow the whitelist order, so a topologically ordered
 * list publishes every dependency before its dependents. Without one, results follow glob order.
 * Throws when a whitelist entry is missing or private, so no listed package drops out of a release.
 */
export const getPackageDetails = async (packages?: null | string[]): Promise<PackageDetails[]> => {
  const packageJsons = await globby('packages/*/package.json', {
    cwd: PROJECT_ROOT,
    absolute: true,
  })

  const allDetails = await Promise.all(
    packageJsons.map(async (packageJsonPath): Promise<null | PackageDetails> => {
      const packageJson = await fse.readJson(packageJsonPath)
      if (packageJson.private === true) {
        return null
      }

      const shortName = path.basename(path.dirname(packageJsonPath))
      return {
        name: packageJson.name,
        packagePath: `packages/${shortName}`,
        shortName,
        version: packageJson.version,
      }
    }),
  )

  const publicDetails = allDetails.filter((details) => details !== null)
  if (!packages) {
    return publicDetails
  }

  const detailsByShortName = new Map(publicDetails.map((details) => [details.shortName, details]))
  return packages.map((shortName) => {
    const details = detailsByShortName.get(shortName)
    if (!details) {
      throw new Error(`Package "${shortName}" in publish list is missing or private`)
    }
    return details
  })
}
