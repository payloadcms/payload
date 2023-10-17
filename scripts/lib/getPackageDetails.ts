import path from 'path'
import fse from 'fs-extra'
import chalk from 'chalk'
import chalkTemplate from 'chalk-template'
import simpleGit from 'simple-git'

const git = simpleGit()
const packagesDir = path.resolve(__dirname, '../../packages')

export type PackageDetails = {
  name: string
  newCommits: number
  shortName: string
  packagePath: string
  publishedVersion: string
  publishDate: string
  version: string
}

export const getPackageDetails = async (): Promise<PackageDetails[]> => {
  const packageDirs = fse.readdirSync(packagesDir).filter((d) => d !== 'eslint-config-payload')
  const packageDetails = await Promise.all(
    packageDirs.map(async (dirName) => {
      const packageJson = await fse.readJson(`${packagesDir}/${dirName}/package.json`)
      const isPublic = packageJson.private !== true
      if (!isPublic) return null

      // Get published version from npm
      const json = await fetch(`https://registry.npmjs.org/${packageJson.name}`).then((res) =>
        res.json(),
      )

      const publishedVersion = json?.['dist-tags']?.latest
      const publishDate = json?.time?.[publishedVersion]

      const prevGitTag =
        dirName === 'payload' ? `v${packageJson.version}` : `${dirName}/${packageJson.version}`
      const prevGitTagHash = await git.revparse(prevGitTag)

      const newCommits = await git.log({
        from: prevGitTagHash,
        file: `packages/${dirName}`,
      })

      return {
        name: packageJson.name as string,
        newCommits: newCommits.total,
        shortName: dirName,
        packagePath: `packages/${dirName}`,
        publishedVersion,
        publishDate,
        version: packageJson.version,
      }
    }),
  )

  return packageDetails.filter((p): p is Exclude<typeof p, null> => p !== null)
}

export const showPackageDetails = (details: PackageDetails[]) => {
  console.log(chalkTemplate`

  {bold Packages:}

${details
  .map((p) => {
    const name = p?.newCommits ? chalk.bold.green(p?.shortName.padEnd(28)) : p?.shortName.padEnd(28)
    const publishData = `${p?.publishedVersion} at ${p?.publishDate
      .split(':')
      .slice(0, 2)
      .join(':')
      .replace('T', ' ')}`
    const newCommits = `${p?.newCommits ? `${chalk.bold.green(p?.newCommits)} new commits` : ''}`

    return `  ${name}${publishData}    ${newCommits}`
  })
  .join('\n')}

`)
}
