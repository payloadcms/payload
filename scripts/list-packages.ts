import path from 'path'
import fse from 'fs-extra'
import chalk from 'chalk'
import chalkTemplate from 'chalk-template'

const packagesPath = path.resolve(__dirname, '../packages')

async function main() {
  // List all public packages excluding eslint-config-payload
  const packageDirs = fse.readdirSync(packagesPath).filter((d) => d !== 'eslint-config-payload')
  const packageDetails = await Promise.all(
    packageDirs.map(async (dir) => {
      const packageJson = await fse.readJson(`${packagesPath}/${dir}/package.json`)
      const isPublic = packageJson.private !== true
      if (!isPublic) return null

      // Get published version from npm
      const json = await fetch(`https://registry.npmjs.org/${packageJson.name}`).then((res) =>
        res.json(),
      )

      const publishedVersion = json?.['dist-tags']?.latest
      const publishDate = json?.time?.[publishedVersion]

      return {
        name: packageJson.name,
        packageDir: dir,
        packagePath: `packages/${dir}`,
        publishedVersion,
        publishDate,
        version: packageJson.version,
      }
    }),
  )
  console.log(chalkTemplate`

  {bold.green Package List:}

${packageDetails
  .map(
    (p) =>
      `  ${chalk.bold(p?.packageDir.padEnd(28))} ${p?.publishedVersion} at ${p?.publishDate
        .split(':')
        .slice(0, 2)
        .join(':')
        .replace('T', ' ')}`,
  )
  .join('\n')}

`)
}

// console.log(packageNames)

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
