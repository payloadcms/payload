import { compareVersions, parseVersion } from './dependencies/versionUtils.js'
import { getNextVersion } from './getNextVersion.js'

/** Next.js serves the dev HMR WebSocket on this path from 16.3 onwards. */
const modernHMRPath = '/_next/hmr'

/** Next.js served the dev HMR WebSocket on this path before 16.3. */
const legacyHMRPath = '/_next/webpack-hmr'

const firstModernHMRPathVersion = '16.3.0'

/**
 * Builds the URL of the Next.js dev HMR WebSocket, on the path served by the
 * installed Next.js version. `PAYLOAD_HMR_URL_OVERRIDE` is used verbatim.
 */
export const getNextJsHMRURL = (): string => {
  if (process.env.PAYLOAD_HMR_URL_OVERRIDE) {
    return process.env.PAYLOAD_HMR_URL_OVERRIDE
  }

  const port = process.env.PORT || '3000'
  const hasHTTPS = process.env.USE_HTTPS === 'true' || process.argv.includes('--experimental-https')
  const protocol = hasHTTPS ? 'wss' : 'ws'
  // The __NEXT_ASSET_PREFIX env variable is set for both assetPrefix and basePath (tested in Next.js 15.1.6)
  const prefix = process.env.__NEXT_ASSET_PREFIX ?? ''

  return `${protocol}://localhost:${port}${prefix}${getHMRPath()}`
}

/**
 * Pre-release identifiers are ignored, so that a `16.3.0-canary` build maps to the 16.3 path.
 * An unreadable version uses the current path, as Payload being unable to resolve Next.js
 * normally means it is not running under Next.js, where this strategy does not apply.
 */
const getHMRPath = (): string => {
  const nextVersion = getNextVersion()

  if (!nextVersion) {
    return modernHMRPath
  }

  const mainVersion = parseVersion(nextVersion).parts.join('.')

  return compareVersions(mainVersion, firstModernHMRPathVersion) === 'lower'
    ? legacyHMRPath
    : modernHMRPath
}
