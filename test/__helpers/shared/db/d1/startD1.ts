import type { D1Database } from '@cloudflare/workers-types'
import type { PlatformProxy } from 'wrangler'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPlatformProxy } from 'wrangler'

const dirname = path.dirname(fileURLToPath(import.meta.url))

declare global {
  // Read by the generated `test/databaseAdapter.js` when `PAYLOAD_DATABASE=d1`.
  var d1: D1Database | undefined
}

let proxy: PlatformProxy<{ D1: D1Database }> | undefined

/**
 * Starts an in-memory D1 database through wrangler's local Miniflare runtime and exposes its
 * binding as `global.d1`.
 */
export async function startD1(): Promise<void> {
  proxy = await getPlatformProxy<{ D1: D1Database }>({
    configPath: path.resolve(dirname, 'wrangler.jsonc'),
    persist: false,
  })

  global.d1 = proxy.env.D1
}

/**
 * Stops the database started by `startD1`. Any later use of the binding throws, so call this only
 * once Payload is destroyed.
 */
export async function stopD1(): Promise<void> {
  const current = proxy

  proxy = undefined
  global.d1 = undefined

  await current?.dispose()
}
