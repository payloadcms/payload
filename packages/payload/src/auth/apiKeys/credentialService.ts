import crypto from 'crypto'

import type { BeforeValidateHook } from '../../collections/config/types.js'
import type { FieldHook } from '../../fields/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { APIError } from '../../errors/index.js'
import { payloadAPIKeysCollectionSlug } from './config.js'
import { getUseAPIKeyConfig } from './getUseAPIKeyConfig.js'
import { hashAPIKeySecret } from './hash.js'

/** Bounded so a persistent hash collision fails closed instead of looping forever. */
const MAX_GENERATION_ATTEMPTS = 5

/** A server-generated secret: an optional caller-configured prefix plus 256 bits of randomness. */
export const generateAPIKeySecret = (prefix = ''): string =>
  `${prefix}${crypto.randomBytes(32).toString('base64url')}`

/**
 * The slug of the auth collection that owns (or will own) this key - the source of truth
 * for which `useAPIKey.apiKeyPrefix` applies. On create this is always `req.user`'s own
 * collection (the only owner a new key can be assigned to). On regenerate this must be
 * read from the document's existing owner, not `req.user` - a manage-tier administrator
 * regenerating another owner's key authenticates through their own, possibly
 * differently-configured, collection.
 */
const resolveOwnerCollectionSlug = ({
  data,
  operation,
  originalDoc,
  req,
}: {
  data: Record<string, unknown> | undefined
  operation: 'create' | 'update'
  originalDoc: { owner?: { relationTo?: string } } | undefined
  req: PayloadRequest
}): string | undefined => {
  if (operation === 'create') {
    return req.user?.collection
  }

  return (originalDoc?.owner ?? (data?.owner as { relationTo?: string } | undefined))?.relationTo
}

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
export const assignAPIKeyCredential: BeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const isRegenerateRequest = operation === 'update' && data?.regenerate === true

  if (operation !== 'create' && !isRegenerateRequest) {
    return data
  }

  const ownerCollectionSlug = resolveOwnerCollectionSlug({ data, operation, originalDoc, req })
  const apiKeyPrefix = getUseAPIKeyConfig(req, ownerCollectionSlug)?.apiKeyPrefix ?? ''

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const rawSecret = generateAPIKeySecret(apiKeyPrefix)
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
 * Forces `owner` on create, ignoring any client-supplied value, to the requesting user -
 * a key can only ever be created for oneself. On update, keeps the existing owner
 * unconditionally: `update` access now also admits manage-tier administrators acting on
 * someone else's key (see {@link apiKeysOwnerOrManageAccess}), so `req.user` is no longer
 * guaranteed to be the owner - reassigning to `req.user` there would silently hijack the
 * key to the acting administrator instead of leaving it with its actual owner.
 * `overrideAccess` lets trusted server code provision a key for an explicit owner (e.g. a
 * service account) with no authenticated `req.user`.
 */
export const assignAPIKeyOwner: FieldHook = ({
  operation,
  originalDoc,
  overrideAccess,
  req,
  value,
}) => {
  if (overrideAccess) {
    return value
  }

  if (operation === 'update') {
    const owner = originalDoc?.owner as { relationTo?: string; value?: unknown } | undefined

    if (!owner) {
      return value
    }

    // `originalDoc` may come back with `owner` populated to a configured depth rather
    // than the bare `{ relationTo, value: id }` shape - normalize back to an id so a
    // manage-tier administrator's update never persists a populated owner document.
    return {
      relationTo: owner.relationTo,
      value:
        typeof owner.value === 'object' && owner.value !== null
          ? (owner.value as { id: unknown }).id
          : owner.value,
    }
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
