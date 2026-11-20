import type { Plugin } from 'payload'

import type { VercelBlobStorageOptions } from '../plugin.js'

import { createVercelBlobStorage } from '../plugin.js'

export type { VercelBlobStorageOptions } from '../plugin.js'

/**
 * Server-only storage adapter. Client upload registration is intentionally
 * omitted, so this entry never imports `@vercel/blob/client` and reading
 * `VERCEL_URL` cannot add a deployment-hostname dependency to cached functions.
 */
export const vercelBlobStorage: (options: VercelBlobStorageOptions) => Plugin = (options) =>
  createVercelBlobStorage({ options })
