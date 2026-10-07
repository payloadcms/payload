import WebSocket from 'ws'

import type { DevReloadStrategy } from '../admin/adapters/devReload.js'

const hmrPath = '/_next/hmr'

/**
 * Default HMR reload strategy using the Next.js dev HMR WebSocket.
 * Used as fallback when no custom devReloadStrategy is provided.
 */
export const defaultNextJsDevReloadStrategy = (): DevReloadStrategy | null => {
  try {
    const url = getHMRURL()

    return {
      connect(onReload) {
        const ws = new WebSocket(url)

        ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data)
            if (
              data.type === 'serverComponentChanges' ||
              data.action === 'serverComponentChanges'
            ) {
              onReload()
            }
          }
        }

        ws.onerror = () => {
          // swallow any websocket connection error
        }

        return () => {
          ws.close()
        }
      },
    }
  } catch (_) {
    return null
  }
}

const getHMRURL = (): string => {
  if (process.env.PAYLOAD_HMR_URL_OVERRIDE) {
    return process.env.PAYLOAD_HMR_URL_OVERRIDE
  }

  const port = process.env.PORT || '3000'
  const hasHTTPS = process.env.USE_HTTPS === 'true' || process.argv.includes('--experimental-https')
  const protocol = hasHTTPS ? 'wss' : 'ws'
  /**
   * Next.js only inlines __NEXT_ASSET_PREFIX into bundled code. In dev, withPayload keeps `payload`
   * external, so fall back to NEXT_BASE_PATH, which withPayload sets on process.env at runtime.
   */
  const prefix = process.env.__NEXT_ASSET_PREFIX || process.env.NEXT_BASE_PATH || ''

  return `${protocol}://localhost:${port}${prefix}${hmrPath}`
}
