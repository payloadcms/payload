import fse from 'fs-extra'
import path from 'path'

const packagesDir = path.resolve(__dirname, '../../packages')

export type PackageDetails = {
  name: string
  packagePath: string
  shortName: string
  version: string
}

const whitelist3_0 = [
  'payload',
  'translations',
  'ui',
  'next',
  'graphql',

  'db-mongodb',
  'richtext-slate',
]

export const getPackageDetails = async (): Promise<PackageDetails[]> => {
  const packageDirs = fse.readdirSync(packagesDir).filter((d) => whitelist3_0.includes(d))

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
