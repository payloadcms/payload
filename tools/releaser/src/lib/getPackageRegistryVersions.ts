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
 * Network errors, timeouts, 429, and 5xx are retried first (3 attempts, 15 s timeout each).
 */
export const isVersionPublished = async ({
  fetchImpl = fetch,
  name,
  sleep = defaultSleep,
  version,
}: {
  fetchImpl?: typeof fetch
  name: string
  sleep?: (ms: number) => Promise<void>
  version: string
}): Promise<boolean> => {
  const res = await fetchWithRetry({
    fetchImpl,
    sleep,
    url: `https://registry.npmjs.org/${name}/${version}`,
  })
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

const maxAttempts = 3
const baseBackoffMs = 1000
/** Bounds a stalled registry connection; a timed-out attempt counts as a network error. */
const attemptTimeoutMs = 15_000

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const isTransientStatus = (status: number): boolean => status === 429 || status >= 500

/**
 * Fetches a registry URL, retrying only network errors, 429, and 5xx with exponential
 * backoff. Every other response is returned for the caller to interpret. When attempts
 * run out, the last transient response is returned (so the caller throws on its status)
 * or the last network error is rethrown, so a persistent failure is never swallowed.
 */
const fetchWithRetry = async ({
  fetchImpl,
  sleep,
  url,
}: {
  fetchImpl: typeof fetch
  sleep: (ms: number) => Promise<void>
  url: string
}): Promise<Response> => {
  for (let attempt = 1; ; attempt++) {
    const isLastAttempt = attempt === maxAttempts
    let res: Response
    try {
      res = await fetchImpl(url, { signal: AbortSignal.timeout(attemptTimeoutMs) })
    } catch (err) {
      if (isLastAttempt) {
        throw err
      }
      await sleep(baseBackoffMs * 2 ** (attempt - 1))
      continue
    }
    if (!isTransientStatus(res.status) || isLastAttempt) {
      return res
    }
    // Releases the pooled connection; an unread body holds it until GC
    await res.body?.cancel()
    await sleep(baseBackoffMs * 2 ** (attempt - 1))
  }
}
