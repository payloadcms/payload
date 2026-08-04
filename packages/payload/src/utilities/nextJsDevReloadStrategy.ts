import WebSocket from 'ws'

import type { DevReloadStrategy } from '../admin/adapters/devReload.js'

import { compareVersions, parseVersion } from './dependencies/versionUtils.js'
import { getNextVersion } from './getNextVersion.js'

/** Next.js serves the dev HMR WebSocket on this path from 16.3 onwards. */
const modernHMRPath = '/_next/hmr'

/** Next.js served the dev HMR WebSocket on this path before 16.3. */
const legacyHMRPath = '/_next/webpack-hmr'

const firstModernHMRPathVersion = '16.3.0'

/**
 * Default HMR reload strategy using the Next.js dev HMR WebSocket.
 * Used as fallback when no custom devReloadStrategy is provided.
 */
export const defaultNextJsDevReloadStrategy = (): DevReloadStrategy | null => {
  try {
    const urls = getHMRURLs()

    return {
      connect(onReload) {
        const sockets = urls.map((url) => new WebSocket(url))

        let openSocket: null | WebSocket = null

        for (const socket of sockets) {
          // Next.js answers only on the path its own version serves, and leaves an
          // upgrade request to any other path open and unanswered, so that a custom
          // WebSocket server can claim it. That means a wrong path never errors and
          // never closes - the only reliable signal is which socket opens.
          socket.onopen = () => {
            openSocket = socket

            for (const otherSocket of sockets) {
              if (otherSocket !== socket) {
                otherSocket.close()
              }
            }
          }

          socket.onmessage = (event) => {
            if (socket !== openSocket || typeof event.data !== 'string') {
              return
            }

            const data = JSON.parse(event.data)

            if (
              data.type === 'serverComponentChanges' ||
              data.action === 'serverComponentChanges'
            ) {
              onReload()
            }
          }

          socket.onerror = () => {
            // swallow any websocket connection error
          }
        }

        return () => {
          for (const socket of sockets) {
            socket.close()
          }
        }
      },
    }
  } catch (_) {
    return null
  }
}

/**
 * Returns every HMR URL to connect to. Normally this is the single URL that the installed
 * Next.js version serves. If that version cannot be read, both known paths are returned and
 * raced instead, so that HMR still works rather than depending on a correct guess.
 *
 * A `PAYLOAD_HMR_URL_OVERRIDE` is used verbatim and on its own, as it states exactly
 * which endpoint to connect to.
 */
const getHMRURLs = (): string[] => {
  if (process.env.PAYLOAD_HMR_URL_OVERRIDE) {
    return [process.env.PAYLOAD_HMR_URL_OVERRIDE]
  }

  const port = process.env.PORT || '3000'
  const hasHTTPS = process.env.USE_HTTPS === 'true' || process.argv.includes('--experimental-https')
  const protocol = hasHTTPS ? 'wss' : 'ws'
  const prefix = process.env.__NEXT_ASSET_PREFIX ?? ''

  return getHMRPaths().map((hmrPath) => `${protocol}://localhost:${port}${prefix}${hmrPath}`)
}

const getHMRPaths = (): string[] => {
  const nextVersion = getNextVersion()

  if (!nextVersion) {
    return [modernHMRPath, legacyHMRPath]
  }

  const { parts, preReleases } = parseVersion(nextVersion)
  const mainVersion = parts.join('.')

  // The rename landed partway through the pre-releases of `firstModernHMRPathVersion`, so
  // its pre-releases serve either path. Race both rather than guess which one.
  if (preReleases.length && mainVersion === firstModernHMRPathVersion) {
    return [modernHMRPath, legacyHMRPath]
  }

  return compareVersions(mainVersion, firstModernHMRPathVersion) === 'lower'
    ? [legacyHMRPath]
    : [modernHMRPath]
}
