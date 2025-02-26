import type { PackageDetails } from '@tools/releaser'
import type { ExecSyncOptions } from 'child_process'

import { PROJECT_ROOT } from '@tools/constants'
import { getPackageDetails } from '@tools/releaser'
import chalk from 'chalk'
import { exec as execOrig, execSync } from 'child_process'
import minimist from 'minimist'
import path from 'path'
import util from 'util'

const execOpts: ExecSyncOptions = { stdio: 'inherit', cwd: PROJECT_ROOT }

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
  if (!dest) {
    throw new Error('--dest is required')
  }

  const resolvedDest = path.resolve(path.isAbsolute(dest) ? dest : path.join(PROJECT_ROOT, dest))

  const packageWhitelist = all
    ? undefined
    : [
        'payload',
        'db-mongodb',
        'db-postgres',
        'db-sqlite',
        'db-vercel-postgres',
        'drizzle',
        'graphql',
        'live-preview-react',
        'next',
        'payload-cloud',
        'plugin-cloud',
        'plugin-form-builder',
        'plugin-nested-docs',
        'plugin-redirects',
        'plugin-search',
        'plugin-seo',
        'richtext-lexical',
        'translations',
        'ui',
      ]

  const packageDetails = await getPackageDetails(packageWhitelist)

  // Prebuild all packages
  header(`\n🔨 Prebuilding all packages...`)

  const filtered = packageDetails.filter((p): p is Exclude<typeof p, null> => p !== null)

  if (!noBuild) {
    execSync('pnpm build:all --output-logs=errors-only', execOpts)
  }

  header(`\nOutputting ${filtered.length} packages...

${chalk.white.bold(listPackages(filtered))}`)

  header(`\n📦 Packing all packages to ${resolvedDest}...`)

  await Promise.all(
    filtered.map(async (p) => {
      await exec(`pnpm pack -C ${p.packagePath} --pack-destination ${resolvedDest}`, execOpts)
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
