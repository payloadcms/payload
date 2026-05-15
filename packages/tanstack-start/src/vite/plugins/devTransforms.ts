import type { PluginOption } from 'vite'

/**
 * Dev-time transforms:
 * - Replaces `process.cwd()` with `"/"` in client code (non-SSR, non-prebundled)
 * - Injects Vite HMR + React Refresh preamble into SSR-rendered HTML (dev only)
 */
export function payloadDevTransforms(): PluginOption {
  const devScripts = `<script type="module" src="/@vite/client"></script>
<script type="module">
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>`

  return {
    name: 'payload:dev-transforms',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        let injected = false
        const origWrite = res.write
        const origEnd = res.end

        function tryInject(chunk: any): any {
          if (injected || chunk == null) {
            return chunk
          }
          const ct = res.getHeader('content-type')
          if (typeof ct !== 'string' || !ct.includes('text/html')) {
            return chunk
          }
          const str =
            typeof chunk === 'string'
              ? chunk
              : Buffer.isBuffer(chunk)
                ? chunk.toString()
                : chunk instanceof Uint8Array
                  ? Buffer.from(chunk).toString()
                  : null
          if (str && str.includes('<head>')) {
            injected = true
            return str.replace('<head>', `<head>${devScripts}`)
          }
          return chunk
        }

        res.write = function (this: any, chunk: any, encodingOrCb?: any, cb?: any) {
          return origWrite.call(this, tryInject(chunk), encodingOrCb, cb)
        } as typeof res.write
        res.end = function (this: any, chunk?: any, encodingOrCb?: any, cb?: any) {
          return origEnd.call(this, tryInject(chunk), encodingOrCb, cb)
        } as typeof res.end
        next()
      })
    },
    transform(code, id, options) {
      if (options?.ssr) {
        return
      }
      if (code.includes('process.cwd') && !id.includes('node_modules/.vite')) {
        return code.replace(/process\.cwd\(\)/g, '"/"')
      }
    },
  }
}
