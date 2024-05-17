import type { ExecSyncOptions } from 'child_process'

import chalk from 'chalk'
import { exec as execOrig, execSync } from 'child_process'
import execa from 'execa'
import fse from 'fs-extra'
import minimist from 'minimist'
import { fileURLToPath } from 'node:url'
import path from 'path'
import util from 'util'

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
  const args = minimist(process.argv.slice(2))
  const { dest } = args
  if (!dest) throw new Error('--dest is required')

  const resolvedDest = path.resolve(dest)

  const packageWhitelist = [
    'payload',
    'ui',
    'next',
    'db-mongodb',
    'richtext-lexical',
    'translations',
    'graphql',
  ]

  const packageDetails = await getPackageDetails(packageWhitelist)

  // Prebuild all packages
  header(`\n🔨 Prebuilding all packages...`)

  await execa('pnpm', ['install'], execaOpts)

  const filtered = packageDetails.filter((p): p is Exclude<typeof p, null> => p !== null)

  header(`\nOutputting ${filtered.length} packages...

${chalk.white.bold(filtered.map((p) => p.name).join('\n'))}
`)

  execSync('pnpm build:all --output-logs=errors-only', { stdio: 'inherit' })

  header(`\n 📦 Packing all packages to ${dest}...`)

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
