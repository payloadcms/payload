/**
 * Run this script with `pnpm script:license-check` from root
 *
 * Outputs licenses.csv in the root directory
 */

import type { ExecSyncOptions } from 'child_process'

import { PROJECT_ROOT } from '@tools/constants'
import { getPackageDetails } from '@tools/releaser'
import chalk from 'chalk'
import { exec as execOrig } from 'child_process'
import { stringify } from 'csv-stringify/sync'
import fs from 'fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'path'
import util from 'util'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const execOpts: ExecSyncOptions = { stdio: 'inherit', cwd: PROJECT_ROOT }

const exec = util.promisify(execOrig)

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const packageDetails = await getPackageDetails()
  const packages = packageDetails.map((p) => p.shortName)

  header(`\n🔨 Getting all package.json licenses...`)
  const results: { component: string; package: string; license: string; repository: string }[] = []

  for (const pack of packages) {
    info(`Checking ${pack}...`)
    const prodResults = await runLicenseCheck(pack, 'production')
    const devResults = await runLicenseCheck(pack, 'development')
    results.push(...prodResults, ...devResults)
  }

  const outputPath = path.join(PROJECT_ROOT, 'licenses.csv')

  header(`\n💾 Writing to ${outputPath}...`)
  const csvString = stringify(results, { header: true })
  const buffer = Buffer.from(csvString)
  await fs.writeFile(outputPath, buffer)

  header(`🎉 Done!`)
}

function header(message: string) {
  console.log(chalk.bold.green(`${message}\n`))
}

function info(message: string) {
  console.log(chalk.dim(message))
}

async function runLicenseCheck(
  pkg: string,
  type: 'development' | 'production',
): Promise<{ component: string; package: string; license: string; repository: string }[]> {
  const result = await exec(
    `node ${path.resolve(dirname, '../node_modules/license-checker/bin/license-checker')} --summary --direct --start --json`,
    {
      ...execOpts,
      cwd: path.join(PROJECT_ROOT, 'packages', pkg),
    },
  )
  const a: Record<string, { licenses: string; repository: string }> = JSON.parse(result.stdout)
  const results: {
    component: string
    package: string
    license: string
    repository: string
    distributed: 'No' | 'Yes'
  }[] = []
  Object.entries(a).forEach(([key, value]) => {
    if (key.startsWith('@payloadcms/')) {
      return
    }
    results.push({
      component: pkg,
      package: key,
      license: value.licenses,
      repository: value.repository,
      distributed: type === 'production' ? 'Yes' : 'No',
    })
  })

  return results
}
