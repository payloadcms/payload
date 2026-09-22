import type { PayloadRequest } from '../../types/index.js'

import { hashAPIKey } from './hash.js'

/** Raw keys written during this request, by their hash. Never leaves the request. */
type RevealedAPIKeys = Record<string, string>

/**
 * Holds a raw API key for the remainder of the request that wrote it, so the response of
 * that one request can return it. Only the hash is ever persisted, so this is the last
 * point at which the raw value exists anywhere.
 *
 * Keyed by hash rather than by document, because a document being created has no id yet
 * and one request can write many documents, each with its own key.
 */
export const stashRevealedAPIKey = ({
  rawAPIKey,
  req,
}: {
  rawAPIKey: string
  req: PayloadRequest
}): string => {
  const apiKeyHash = hashAPIKey(rawAPIKey)

  req.context ??= {}
  req.context.revealedAPIKeys ??= {}
  ;(req.context.revealedAPIKeys as RevealedAPIKeys)[apiKeyHash] = rawAPIKey

  return apiKeyHash
}

export const getRevealedAPIKey = ({
  apiKeyHash,
  req,
}: {
  apiKeyHash: string
  req: PayloadRequest
}): string | undefined =>
  (req.context?.revealedAPIKeys as RevealedAPIKeys | undefined)?.[apiKeyHash]

/**
 * Whether this request actually stored the given key. A key is only stashed by the field
 * hook that hashes it, which never runs when access control has rejected the write - so
 * this is how a caller can tell "written" from "silently dropped" without depending on the
 * response, which field-level read access may have stripped.
 */
export const wasAPIKeyStored = ({
  rawAPIKey,
  req,
}: {
  rawAPIKey: string
  req: PayloadRequest
}): boolean => getRevealedAPIKey({ apiKeyHash: hashAPIKey(rawAPIKey), req }) === rawAPIKey
