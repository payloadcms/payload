import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packagesDir = path.resolve(__dirname, '../../packages')

export type PackageDetails = {
  /** Name in package.json / npm registry */
  name: string
  /** Full path to package */
  packagePath: string
  /** Short name is the directory name */
  shortName: string
  /** Version in package.json */
  version: string
}

export const getPackageDetails = async (packages: string[]): Promise<PackageDetails[]> => {
  const packageDirs = fse.readdirSync(packagesDir).filter((d) => packages.includes(d))

  const packageDetails = await Promise.all(
    packageDirs.map(async (dirName) => {
      const packageJson = await fse.readJson(`${packagesDir}/${dirName}/package.json`)
      const isPublic = packageJson.private !== true
      if (!isPublic) return null

      return {
        name: packageJson.name as string,
        packagePath: path.resolve(packagesDir, dirName),
        shortName: dirName,
        version: packageJson.version,
      }
    }),
  )

  return packageDetails.filter((p): p is Exclude<typeof p, null> => p !== null)
}
