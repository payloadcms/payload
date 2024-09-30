import type { ExecSyncOptions } from 'child_process'
import type execa from 'execa'

import chalk from 'chalk'
import { exec as execOrig, execSync } from 'child_process'
import fse from 'fs-extra'
import minimist from 'minimist'
import { fileURLToPath } from 'node:url'
import path from 'path'
import util from 'util'

import type { PackageDetails } from './lib/getPackageDetails.js'

import { getPackageDetails } from './lib/getPackageDetails.js'

const execOpts: ExecSyncOptions = { stdio: 'inherit' }
const execaOpts: execa.Options = { stdio: 'inherit' }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const exec = util.promisify(execOrig)

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const all = process.argv.includes('--all')
  process.argv = process.argv.filter((arg) => arg !== '--all')

  const noBuild = process.argv.includes('--no-build')
  process.argv = process.argv.filter((arg) => arg !== '--no-build')

  const args = minimist(process.argv.slice(2))
  const { dest } = args
  if (!dest) throw new Error('--dest is required')

  const resolvedDest = path.resolve(dest)

  const packageWhitelist = all
    ? null
    : [
        'payload',
        'ui',
        'next',
        'db-mongodb',
        'drizzle',
        'db-sqlite',
        'db-postgres',
        'db-vercel-postgres',
        'richtext-lexical',
        'translations',
        'plugin-cloud',
        'graphql',
      ]

  const packageDetails = await getPackageDetails(packageWhitelist)

  // Prebuild all packages
  header(`\n🔨 Prebuilding all packages...`)

  const filtered = packageDetails.filter((p): p is Exclude<typeof p, null> => p !== null)

  if (!noBuild) {
    execSync('pnpm build:all --output-logs=errors-only', { stdio: 'inherit' })
  }

  header(`\nOutputting ${filtered.length} packages...

${chalk.white.bold(listPackages(filtered))}`)

  header(`\n📦 Packing all packages to ${dest}...`)

  await Promise.all(
    filtered.map(async (p) => {
      await exec(`pnpm pack -C ${p.packagePath} --pack-destination ${resolvedDest}`)
    }),
  )

  header(`\n🎉 Done!`)
}

function header(message: string, opts?: { enable?: boolean }) {
  console.log(chalk.bold.green(`${message}\n`))
}

function listPackages(packages: PackageDetails[]) {
  return packages.map((p) => `  - ${p.name}`).join('\n')
}
