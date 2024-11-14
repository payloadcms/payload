import fse from 'fs-extra'
import globby from 'globby'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '../../')

export type PackageDetails = {
  /** Name in package.json / npm registry */
  name: string
  /** Full path to package relative to project root */
  packagePath: `packages/${string}`
  /** Short name is the directory name */
  shortName: string
  /** Version in package.json */
  version: string
}

/**
 * Accepts package whitelist (directory names inside packages dir) and returns details for each package
 */
export const getPackageDetails = async (packages: string[]): Promise<PackageDetails[]> => {
  // Fetch all package.json files, filter out packages not in the whitelist
  const packageJsons = await globby('packages/*/package.json', {
    cwd: projectRoot,
    absolute: true,
  })

  const packageDetails = await Promise.all(
    packageJsons.map(async (packageJsonPath) => {
      const packageJson = await fse.readJson(packageJsonPath)
      const isPublic = packageJson.private !== true
      if (!isPublic) return null

      const isInWhitelist = packages
        ? packages.includes(path.basename(path.dirname(packageJsonPath)))
        : true
      if (!isInWhitelist) return null

      return {
        name: packageJson.name as string,
        packagePath: path.relative(projectRoot, dirname(packageJsonPath)),
        shortName: path.dirname(packageJsonPath),
        version: packageJson.version,
      } as PackageDetails
    }),
  )

  return packageDetails.filter((p): p is Exclude<typeof p, null> => p !== null)
}
