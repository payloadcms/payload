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
