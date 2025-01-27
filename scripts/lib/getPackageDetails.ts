import path from 'path'
import fse from 'fs-extra'
import chalk from 'chalk'
import chalkTemplate from 'chalk-template'
import simpleGit from 'simple-git'

const git = simpleGit()
const packagesDir = path.resolve(__dirname, '../../packages')

export type PackageDetails = {
  commitMessage: string
  name: string
  newCommits: number
  shortName: string
  packagePath: string
  prevGitTag: string
  prevGitTagHash: string
  publishedVersion: string
  publishDate: string
  version: string
}

export const getPackageDetails = async (pkg?: string): Promise<PackageDetails[]> => {
  let packageDirs: string[] = []
  if (pkg) {
    packageDirs = fse.readdirSync(packagesDir).filter((d) => d === pkg)
  } else {
    packageDirs = fse
      .readdirSync(packagesDir)
      .filter((d) => d !== 'eslint-config-payload' && d !== 'live-preview-vue')
  }

  const packageDetails = await Promise.all(
    packageDirs.map(async (dirName) => {
      const pjsonPathFromRoot = `${packagesDir}/${dirName}/package.json`
      const pjsonExists = await fse.pathExists(pjsonPathFromRoot)
      if (!pjsonExists) return null
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
        commitMessage: newCommits.latest?.message ?? '',
        name: packageJson.name as string,
        newCommits: newCommits.total,
        shortName: dirName,
        packagePath: `packages/${dirName}`,
        prevGitTag,
        prevGitTagHash,
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
    const name = p?.newCommits
      ? chalk.bold.green(p?.shortName.padEnd(28))
      : chalk.dim(p?.shortName.padEnd(28))
    const publishData = `${p?.publishedVersion.padEnd(8)}${p?.publishDate.split('T')[0]}`
    const newCommits = p?.newCommits ? chalk.bold.green(`⇡${p?.newCommits}  `) : '    '
    const commitMessage = p?.commitMessage
      ? chalk.dim(
          p.commitMessage.length < 57
            ? p.commitMessage
            : p.commitMessage.substring(0, 60).concat('...'),
        )
      : ''

    return `  ${name}${newCommits}${publishData}    ${commitMessage}`
  })
  .join('\n')}

`)
}
