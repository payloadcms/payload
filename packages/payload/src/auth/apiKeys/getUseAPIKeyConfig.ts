import type { PayloadRequest } from '../../types/index.js'
import type { UseAPIKeyConfig } from '../types.js'

/**
 * The sanitized `useAPIKey` object config for a given auth collection, or `undefined` when
 * that collection has API keys disabled or configured with the bare `true` shorthand (which
 * carries no `access`/`apiKeyPrefix` overrides to look up).
 */
export const getUseAPIKeyConfig = (
  req: PayloadRequest,
  collectionSlug: string | undefined,
): Extract<UseAPIKeyConfig, object> | undefined => {
  if (!collectionSlug) {
    return undefined
  }

  const useAPIKey = req.payload.collections[collectionSlug]?.config.auth?.useAPIKey

  return typeof useAPIKey === 'object' ? useAPIKey : undefined
}
