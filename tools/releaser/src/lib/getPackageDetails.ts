import { PROJECT_ROOT } from '@tools/constants'
import fse from 'fs-extra'
import globby from 'globby'
import path, { dirname } from 'path'

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
 * Accepts package whitelist (directory names inside packages dir) and returns details for each package
 */
export const getPackageDetails = async (packages?: null | string[]): Promise<PackageDetails[]> => {
  // Fetch all package.json files, filter out packages not in the whitelist
  const packageJsons = await globby('packages/*/package.json', {
    cwd: PROJECT_ROOT,
    absolute: true,
  })

  const packageDetails = await Promise.all(
    packageJsons.map(async (packageJsonPath) => {
      const packageJson = await fse.readJson(packageJsonPath)
      const isPublic = packageJson.private !== true
      if (!isPublic) {
        return null
      }

      const isInWhitelist = packages
        ? packages.includes(path.basename(path.dirname(packageJsonPath)))
        : true
      if (!isInWhitelist) {
        return null
      }

      return {
        name: packageJson.name as string,
        packagePath: path.relative(PROJECT_ROOT, dirname(packageJsonPath)),
        shortName: path.basename(path.dirname(packageJsonPath)),
        version: packageJson.version,
      } as PackageDetails
    }),
  )

  return packageDetails.filter((p): p is Exclude<typeof p, null> => p !== null)
}
