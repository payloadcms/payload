import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { Destroy } from 'payload'

import { destroy as drizzleDestroy } from '@payloadcms/drizzle'

import type { AuroraServerlessAdapter } from './types.js'

/**
 * Clears the shared adapter state (via `@payloadcms/drizzle`) and closes the underlying
 * `RDSDataClient` if one is present.
 */
export const destroy: Destroy = async function destroy(this: AuroraServerlessAdapter) {
  const client = (this.drizzle as unknown as { $client?: { destroy?: () => Promise<void> | void } })
    ?.$client

  if (typeof client?.destroy === 'function') {
    try {
      await client.destroy()
    } catch {
      // The RDS Data API client is stateless; there is nothing left to close.
    }
  }

  await drizzleDestroy.call(this as unknown as DrizzleAdapter)
}
