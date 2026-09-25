import type { PluginOption, ViteDevServer } from 'vite'

/**
 * Compiles the admin panel as soon as the dev server is listening, instead of
 * waiting for the first navigation to trigger it.
 *
 * The admin's server-side module graph is ~1,900 modules deep (most of
 * `@payloadcms/ui`), and it can't be externalized or pre-bundled — the RSC
 * pipeline has to see each module's `'use client'` directives and CSS imports
 * (see `config/external.ts`). Vite has no persistent cache for that transform, so
 * it runs on every dev boot and takes several seconds. Left on-demand, the whole
 * cost lands on the developer's first `/admin` request, and it lands there no
 * matter how long they waited before navigating.
 *
 * Issuing one request at startup overlaps that work with the developer switching
 * to their browser. Measured on a blank template (Apple M4 Max), navigating 6s
 * after `pnpm dev` cut the wait from ~8.2s to ~4.0s; navigating 12s after cut it
 * from ~8.0s to ~0.05s. Total CPU work is unchanged — this only moves it off the
 * critical path.
 *
 * Note this also initializes Payload and connects to the database at boot rather
 * than on first request. Disable with `warmAdmin: false` when that is unwanted —
 * for example if you rarely open the admin and would rather not spend the CPU.
 */
export function payloadWarmAdmin({ adminPath }: { adminPath: string }): PluginOption {
  return {
    name: 'payload:warm-admin',
    apply: 'serve',
    configureServer(server) {
      // No `httpServer` in middleware mode — the host owns listening, so there is
      // no point at which we could know the URL to warm.
      server.httpServer?.once('listening', () => {
        // `resolvedUrls` is assigned by `server.listen()` just after the http
        // server emits `listening`, so defer a tick to read the final value.
        setImmediate(() => {
          void warmAdminPanel({ adminPath, server })
        })
      })
    },
  }
}

/**
 * Requests the admin panel once and drains the response, so the full render —
 * and every transform it pulls in — completes. Never rejects: a failed warm-up
 * must not take the dev server down with it.
 */
async function warmAdminPanel({
  adminPath,
  server,
}: {
  adminPath: string
  server: ViteDevServer
}): Promise<void> {
  const localUrl = server.resolvedUrls?.local?.[0]

  if (!localUrl) {
    return
  }

  // `localUrl` already carries Vite's `base`, so resolve the admin path against
  // it rather than concatenating onto the origin.
  const base = localUrl.endsWith('/') ? localUrl : `${localUrl}/`
  const url = new URL(adminPath.replace(/^\/+/, ''), base)
  const startedAt = performance.now()

  try {
    const response = await fetch(url, { redirect: 'follow' })
    await response.arrayBuffer()

    const elapsedSeconds = ((performance.now() - startedAt) / 1000).toFixed(1)
    server.config.logger.info(`warmed admin panel in ${elapsedSeconds}s`, { timestamp: true })
  } catch {
    // Warming is best-effort. The route still compiles on demand, so a failure
    // here (server closed mid-warm, custom `routes.admin`, unreachable database)
    // costs nothing but the optimization.
  }
}
