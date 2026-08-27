import type { InitOptions } from '../../config/types.js'
import type { Payload } from '../../index.js'

import { APIError } from '../../errors/index.js'
import { getAPIKeyStorageMode } from '../getAPIKeyStorageMode.js'

/**
 * Whether `payload.init()` should run the collection-mode API-key startup guard: skipped
 * when the database isn't being connected at all (nothing to check), or when the caller
 * (only the `migrate:api-keys` CLI, by convention) explicitly bypasses it.
 */
export const shouldRunAPIKeyStartupGuard = (
  options: Pick<InitOptions, 'disableAPIKeyStartupGuard' | 'disableDBConnect'>,
): boolean => !options.disableDBConnect && !options.disableAPIKeyStartupGuard

/**
 * Refuses to let collection-mode auth collections start while any of them still has
 * legacy `apiKey`/`apiKeyIndex`/`enableAPIKey` material - collection mode never
 * authenticates from legacy fields, so leftover legacy data would be a silent dead
 * credential store rather than a working one. `payload migrate:api-keys` is the only
 * built-in path that bypasses this (via `disableAPIKeyStartupGuard`); every other project
 * with no legacy data passes as a cheap existence query.
 */
export const assertNoLegacyAPIKeyMaterial = async ({
  payload,
}: {
  payload: Payload
}): Promise<void> => {
  for (const collection of payload.config.collections) {
    if (getAPIKeyStorageMode(collection.auth) !== 'collection') {
      continue
    }

    const legacyMaterial = await payload.db.find({
      collection: collection.slug,
      limit: 1,
      pagination: false,
      where: {
        or: [
          { apiKey: { exists: true } },
          { apiKeyIndex: { exists: true } },
          { enableAPIKey: { equals: true } },
        ],
      },
    })

    if (legacyMaterial.docs.length > 0) {
      throw new APIError(
        `API key collection storage is enabled for "${collection.slug}", but legacy API-key data remains.\n` +
          'Run `payload migrate:api-keys --dry-run`, then `payload migrate:api-keys` before starting Payload.',
      )
    }
  }
}
