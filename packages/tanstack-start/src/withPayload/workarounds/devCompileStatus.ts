import type { HmrContext, PluginOption } from 'vite'

const debounceMs = 100
const eventName = 'payload:compiling'

/**
 * Broadcasts a "compiling" signal to the browser over Vite's HMR websocket. Vite has no
 * native "build started/finished" event the way Webpack/Turbopack does — it transforms
 * modules lazily, on demand — so this approximates it from `handleHotUpdate` timing: any
 * hot update sets `isCompiling: true` immediately, and a burst of updates within
 * `debounceMs` of each other collapses into a single `isCompiling: false` once activity
 * settles.
 */
export function payloadDevCompileStatus(): PluginOption {
  let hideTimeout: NodeJS.Timeout | null = null

  return {
    name: 'payload:dev-compile-status',
    apply: 'serve',
    handleHotUpdate(ctx: HmrContext) {
      ctx.server.ws.send({ type: 'custom', data: { isCompiling: true }, event: eventName })

      if (hideTimeout) {
        clearTimeout(hideTimeout)
      }

      hideTimeout = setTimeout(() => {
        hideTimeout = null
        ctx.server.ws.send({ type: 'custom', data: { isCompiling: false }, event: eventName })
      }, debounceMs)
    },
  }
}
