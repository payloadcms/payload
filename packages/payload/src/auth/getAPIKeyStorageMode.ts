import type { Auth, IncomingAuthType } from './types.js'

export type APIKeyStorageMode = 'collection' | 'legacy' | false

/**
 * Normalizes the `auth.useAPIKey` union (`boolean | { storage: 'collection' }`) into one
 * discriminated value so callers don't each re-derive the same branching. Accepts the
 * bare `auth: true` collection shorthand too (a collection config's `auth` property is
 * `boolean | IncomingAuthType` before sanitization) - that shorthand enables auth with
 * defaults, which does not include API keys, so it maps to `false` just like `undefined`.
 */
export const getAPIKeyStorageMode = (
  auth: Auth | boolean | IncomingAuthType | undefined,
): APIKeyStorageMode => {
  if (!auth || auth === true || !auth.useAPIKey) {
    return false
  }

  if (auth.useAPIKey === true) {
    return 'legacy'
  }

  return auth.useAPIKey.storage
}
