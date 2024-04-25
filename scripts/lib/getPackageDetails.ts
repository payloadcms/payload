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

export const getPackageDetails = async (packages: string[]): Promise<PackageDetails[]> => {
  const packageJsons = await globby('packages/*/package.json', {
    cwd: projectRoot,
    absolute: true,
  })

  const packageDetails = await Promise.all(
    packageJsons.map(async (packageJsonPath) => {
      const packageJson = await fse.readJson(packageJsonPath)
      const isPublic = packageJson.private !== true
      if (!isPublic) return null

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
