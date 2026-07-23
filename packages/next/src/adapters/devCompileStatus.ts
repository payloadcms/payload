/**
 * Turbopack reports `BUILDING` for essentially any compilation activity, including
 * fully cached/no-op ones unrelated to a real code change (e.g. checking an on-demand
 * route entry when navigating). Next's own client works around this by deferring the
 * "building" report by 100ms and suppressing it entirely if `BUILT`/`SYNC` arrives
 * first — see `next/dist/client/dev/hot-reloader/turbopack-hot-reloader-common.js`'s
 * `TurbopackHmr` class. Mirrored here so this badge doesn't flicker on navigation.
 */
const buildingDeferMs = 100

/**
 * Browser-side listener for Next.js's own `/_next/webpack-hmr` socket, the same channel
 * Next's built-in dev-compiling badge is driven by. `BUILDING` means a compile has started,
 * `BUILT`/`SYNC` mean it has finished. See `next/dist/server/dev/hot-reloader-types.d.ts`'s
 * `HMR_MESSAGE_SENT_TO_BROWSER` enum for the full set of message types this socket can send.
 */
export function connectDevCompileStatus({
  onChange,
  url,
  WebSocketImpl = globalThis.WebSocket,
}: {
  onChange: (isCompiling: boolean) => void
  url: string
  WebSocketImpl?: typeof WebSocket
}): () => void {
  if (process.env.NODE_ENV === 'production') {
    return () => {}
  }

  const ws = new WebSocketImpl(url)
  let deferredShow: null | ReturnType<typeof setTimeout> = null

  ws.onmessage = (event) => {
    if (typeof event.data !== 'string') {
      return
    }

    let message: unknown

    try {
      message = JSON.parse(event.data)
    } catch {
      return
    }

    if (typeof message !== 'object' || message === null || !('type' in message)) {
      return
    }

    if (message.type === 'building') {
      if (deferredShow) {
        clearTimeout(deferredShow)
      }
      deferredShow = setTimeout(() => {
        deferredShow = null
        onChange(true)
      }, buildingDeferMs)
    } else if (message.type === 'built' || message.type === 'sync') {
      if (deferredShow) {
        clearTimeout(deferredShow)
        deferredShow = null
        return
      }
      onChange(false)
    }
  }

  ws.onerror = () => {
    // swallow any websocket connection error
  }

  return () => {
    if (deferredShow) {
      clearTimeout(deferredShow)
    }
    ws.close()
  }
}

/**
 * Mirrors Next.js's own client-side `getSocketUrl` (`next/dist/client/dev/hot-reloader/get-socket-url.js`)
 * for the common case of no custom `assetPrefix`/`basePath`.
 */
export function buildDevCompileStatusUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const { hostname, port } = window.location

  return `${protocol}//${hostname}${port ? `:${port}` : ''}/_next/webpack-hmr`
}
