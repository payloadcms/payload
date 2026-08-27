import crypto from 'crypto'

import type { BeforeValidateHook } from '../../collections/config/types.js'
import type { FieldHook } from '../../fields/config/types.js'

import { APIError } from '../../errors/index.js'
import { payloadAPIKeysCollectionSlug } from './config.js'
import { hashAPIKeySecret } from './hash.js'

/** Bounded so a persistent hash collision fails closed instead of looping forever. */
const MAX_GENERATION_ATTEMPTS = 5

/** A server-generated secret: a recognizable `plk_` prefix plus 256 bits of randomness. */
export const generateAPIKeySecret = (): string =>
  `plk_${crypto.randomBytes(32).toString('base64url')}`

/**
 * Generates (on create) or regenerates (on an update with `data.regenerate === true`) the
 * credential for a `payload-api-keys` document, retrying on the rare event of an
 * `apiKeyHash` collision. Runs as a collection-level hook (not a field hook) because it
 * needs to read/write `data` as a whole and query the database before the document is
 * written - a single field hook cannot retry the enclosing operation.
 *
 * The raw secret is never persisted - only its one-way hash is. The raw value is stashed
 * on `req.context` for this request only, so the `apiKey` virtual field's `afterRead` hook
 * (see {@link surfaceGeneratedAPIKeySecret}) can return it in this operation's response,
 * the only place it is ever visible again.
 */
export const assignAPIKeyCredential: BeforeValidateHook = async ({ data, operation, req }) => {
  const isRegenerateRequest = operation === 'update' && data?.regenerate === true

  if (operation !== 'create' && !isRegenerateRequest) {
    return data
  }

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const rawSecret = generateAPIKeySecret()
    const apiKeyHash = hashAPIKeySecret(rawSecret)

    const existing = await req.payload.db.findOne({
      collection: payloadAPIKeysCollectionSlug,
      where: { apiKeyHash: { equals: apiKeyHash } },
    })

    if (!existing) {
      req.context ??= {}
      req.context.generatedAPIKeySecret = rawSecret

      return { ...data, apiKeyHash, regenerate: undefined }
    }
  }

  throw new APIError('Failed to generate a unique API key after multiple attempts.', 500)
}

/**
 * Forces `owner` to the requesting user, ignoring any client-supplied value, on every
 * create and update - since only the owner may pass the collection's own `update` access
 * in the first place, reassigning owner=req.user on update is a safe no-op for a
 * legitimate caller and neutralizes a malicious reassignment attempt. `overrideAccess`
 * lets trusted server code provision a key for an explicit owner (e.g. a service
 * account) with no authenticated `req.user`.
 */
export const assignAPIKeyOwner: FieldHook = ({ overrideAccess, req, value }) => {
  if (overrideAccess) {
    return value
  }

  if (!req.user) {
    return null
  }

  return {
    relationTo: req.user.collection,
    value: req.user.id,
  }
}

/**
 * Returns the raw secret generated earlier in this exact request (by
 * {@link assignAPIKeyCredential}) - never for a plain read, where `req.context` carries no
 * such value. `apiKeyHash` is one-way and is never returned to any client, so this is the
 * only place the plaintext secret is ever visible.
 */
export const surfaceGeneratedAPIKeySecret: FieldHook = ({ req }) =>
  req.context?.generatedAPIKeySecret as string | undefined
