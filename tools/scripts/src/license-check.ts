import type { ExecSyncOptions } from 'child_process'

import { PROJECT_ROOT } from '@tools/constants'
import chalk from 'chalk'
import { exec as execOrig } from 'child_process'
import { stringify } from 'csv-stringify/sync'
import fs from 'fs/promises'
import util from 'util'

const execOpts: ExecSyncOptions = { stdio: 'inherit', cwd: PROJECT_ROOT }

const exec = util.promisify(execOrig)

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const packages = [
    'create-payload-app',
    'db-mongodb',
    'db-postgres',
    'db-sqlite',
    'db-vercel-postgres',
    'drizzle',
    'email-nodemailer',
    'email-resend',
    'eslint-config',
    'eslint-plugin',
    'graphql',
    'live-preview',
    'live-preview-react',
    'live-preview-vue',
    'next',
    'payload',
    'payload-cloud',
    'plugin-cloud-storage',
    'plugin-form-builder',
    'plugin-import-export',
    'plugin-multi-tenant',
    'plugin-nested-docs',
    'plugin-redirects',
    'plugin-relationship-object-ids',
    'plugin-search',
    'plugin-sentry',
    'plugin-seo',
    'plugin-stripe',
    'richtext-lexical',
    'richtext-slate',
    'storage-azure',
    'storage-gcs',
    'storage-s3',
    'storage-uploadthing',
    'storage-vercel-blob',
    'translations',
    'ui',
  ]

  header(`\n🔨 Getting all package.json licenses...`)
  // run license-checker for each package
  const results: { component: string; package: string; license: string; repository: string }[] = []

  for (const pack of packages) {
    const result = await exec(
      `license-checker --summary --direct --start --json packages/${pack}`,
      execOpts,
    )
    const a: Record<string, { licenses: string; repository: string }> = JSON.parse(result.stdout)
    Object.entries(a).forEach(([key, value]) => {
      results.push({
        component: pack,
        package: key,
        license: value.licenses,
        repository: value.repository,
      })
    })
  }

  header(`\n🔨 Writing to license.csv...`)
  const csvString = stringify(results, { header: true })
  const buffer = Buffer.from(csvString)
  await fs.writeFile('licenses.csv', buffer)

  header(`\n🎉 Done!`)
}

function header(message: string) {
  console.log(chalk.bold.green(`${message}\n`))
}
