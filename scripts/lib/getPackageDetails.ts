import fse from 'fs-extra'
import path from 'path'

const packagesDir = path.resolve(__dirname, '../../packages')

export type PackageDetails = {
  name: string
  shortName: string
  packagePath: string
  version: string
}

export const getPackageDetails = async (): Promise<PackageDetails[]> => {
  const packageDirs = fse.readdirSync(packagesDir).filter((d) => d !== 'eslint-config-payload')

  const packageDetails = await Promise.all(
    packageDirs.map(async (dirName) => {
      const packageJson = await fse.readJson(`${packagesDir}/${dirName}/package.json`)
      const isPublic = packageJson.private !== true
      if (!isPublic) return null

      return {
        name: packageJson.name as string,
        shortName: dirName,
        packagePath: path.resolve(packagesDir, dirName),
        version: packageJson.version,
      }
    }),
  )

  return packageDetails.filter((p): p is Exclude<typeof p, null> => p !== null)
}
