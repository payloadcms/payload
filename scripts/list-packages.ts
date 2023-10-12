import path from 'path'
import fse from 'fs-extra'
import chalk from 'chalk'
import chalkTemplate from 'chalk-template'
import simpleGit from 'simple-git'

const git = simpleGit()

const packagesDir = path.resolve(__dirname, '../packages')

async function main() {
  // List all public packages excluding eslint-config-payload
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

      const prevGitTag = `${dirName}/${packageJson.version}`
      const prevGitTagHash = await git.revparse(prevGitTag)

      const newCommits = await git.log({
        from: prevGitTagHash,
        file: `packages/${dirName}`,
      })

      return {
        name: packageJson.name,
        newCommits: newCommits.total,
        packageDir: dirName,
        packagePath: `packages/${dirName}`,
        publishedVersion,
        publishDate,
        version: packageJson.version,
      }
    }),
  )
  console.log(chalkTemplate`

  {bold Packages:}

${packageDetails
  .map((p) => {
    const name = p?.newCommits
      ? chalk.bold.green(p?.packageDir.padEnd(28))
      : p?.packageDir.padEnd(28)
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

// console.log(packageNames)

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
