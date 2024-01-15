import fs from 'fs'
import minimist from 'minimist'
import path from 'path'
import shelljs from 'shelljs'

import { promisify } from 'util'

const readFile = promisify(fs.readFile)

/**
 * Pack all needed packages to a template from the monorepo
 *
 * - Read the package.json file for a template
 * - pnpm pack all the dependencies to template directory
 */

async function main() {
  const {
    _: [template],
  } = minimist(process.argv.slice(2))
  if (!template) throw new Error('Template name is required')

  const templateDir = path.resolve(__dirname, `../templates/${template}`)
  if (!fs.existsSync(templateDir)) throw new Error(`Template ${template} does not exist`)

  const packageJsonContent = await readFile(
    path.resolve(__dirname, `../templates/${template}/package.json`),
    'utf8',
  )

  const packageJson = JSON.parse(packageJsonContent)
  // Get package names from dependencies
  const dependencyDirs = Object.keys(packageJson.dependencies)
    .filter((p) => p.startsWith('@payloadcms'))
    .map((p) => p.replace('@payloadcms/', ''))

  console.log(`Packing ${dependencyDirs.length} dependencies to ${templateDir}`)
  console.log(dependencyDirs.map((d) => `  - ${d}`).join('\n'))
  console.log(`\nPacking each dependency to ${templateDir}\n`)

  const packagesDir = path.resolve(__dirname, '../packages')
  // Pack all dependencies to template directory
  dependencyDirs.forEach((dir) => {
    const packageDir = path.resolve(packagesDir, dir)
    shelljs.exec(`pnpm -C ${packageDir} pack --pack-destination ${templateDir}`)
  })

  console.log('\nDone')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
