import chalk from 'chalk'
import pLimit from 'p-limit'

import { getPackageDetails } from './getPackageDetails.js'
import { packagePublishList } from './publishList.js'

const npmRequestLimit = pLimit(40)

export const getPackageRegistryVersions = async (): Promise<void> => {
  const packageDetails = await getPackageDetails(packagePublishList)

  const results = await Promise.all(
    packageDetails.map(async (pkg) =>
      npmRequestLimit(async () => {
        // Get published version from npm
        const json = await fetch(`https://registry.npmjs.org/${pkg.name}`).then((res) => res.json())
        const { latest = 'N/A', beta = 'N/A', canary = 'N/A' } = json['dist-tags'] ?? {}
        const msg = `${pkg.name.padEnd(36)}${latest?.padEnd(16)}${beta?.padEnd(16)}${canary}`
        return msg
      }),
    ),
  )

  const header = chalk.bold.green(
    'Package Versions'.padEnd(36) + 'Latest'.padEnd(16) + 'Beta'.padEnd(16) + 'Canary',
  )
  console.log(header)
  console.log()
  console.log(results.sort().join('\n'))
}

if (import.meta.url === new URL(import.meta.url).href) {
  await getPackageRegistryVersions()
}
