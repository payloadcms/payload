import chalk from 'chalk'
import pLimit from 'p-limit'

import { getPackageDetails } from './getPackageDetails.js'
import { packagePublishList } from './publishList.js'

const npmRequestLimit = pLimit(40)

/**
 * Checks whether a specific `name@version` is published to the npm registry.
 * `GET /{name}/{version}` returns 200 when published and 404 when not. Any other
 * status (5xx, 429, etc.) throws rather than being conflated with "not published",
 * so callers can distinguish a genuine absence from a transient registry failure.
 */
export const isVersionPublished = async ({
  fetchImpl = fetch,
  name,
  version,
}: {
  fetchImpl?: typeof fetch
  name: string
  version: string
}): Promise<boolean> => {
  const res = await fetchImpl(`https://registry.npmjs.org/${name}/${version}`)
  if (res.ok) {
    return true
  }
  if (res.status === 404) {
    return false
  }
  throw new Error(
    `Failed to check ${name}@${version} on the npm registry: ${res.status} ${res.statusText}`,
  )
}

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
