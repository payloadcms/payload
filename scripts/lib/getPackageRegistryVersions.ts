import chalk from 'chalk'
import pLimit from 'p-limit'

import { getPackageDetails } from './getPackageDetails.js'

const npmRequestLimit = pLimit(40)

const packages = [
  'payload',
  'translations',
  'ui',
  'next',
  'graphql',
  'db-mongodb',
  'db-postgres',
  'richtext-slate',
  'richtext-lexical',

  'create-payload-app',

  'email-nodemailer',

  'storage-s3',
  'storage-azure',
  'storage-gcs',
  'storage-vercel-blob',

  // Plugins
  'plugin-cloud',
  'plugin-cloud-storage',
  'plugin-form-builder',
  'plugin-nested-docs',
  'plugin-redirects',
  'plugin-search',
  'plugin-seo',
  // 'plugin-stripe',
  // 'plugin-sentry',
]

export const getPackageRegistryVersions = async (): Promise<void> => {
  const packageDetails = await getPackageDetails(packages)

  const results = await Promise.all(
    packageDetails.map(async (pkg) =>
      npmRequestLimit(async () => {
        // Get published version from npm
        const json = await fetch(`https://registry.npmjs.org/${pkg.name}`).then((res) => res.json())
        const { latest = 'N/A', beta = 'N/A', alpha = 'N/A' } = json['dist-tags'] ?? {}
        const msg = `${chalk.bold(pkg.name.padEnd(32))} latest: ${latest?.padEnd(
          16,
        )} beta: ${beta?.padEnd(16)} alpha: ${alpha}`
        return msg
      }),
    ),
  )

  console.log(results.join('\n'))
}

if (import.meta.url === new URL(import.meta.url).href) {
  await getPackageRegistryVersions()
}
