import type { Access } from '../../config/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { APIKeyAdministrationAccessConfig, AuthenticatedUser } from '../types.js'

import { isAdministrator } from '../../utilities/canAccessAdmin.js'

const isNonAPIKeyAuthenticatedUser = (user: AuthenticatedUser | null | undefined): boolean =>
  Boolean(user) && user!._strategy !== 'api-key'

const ownerWhere = (user: AuthenticatedUser): Where => ({
  and: [
    { 'owner.relationTo': { equals: user.collection } },
    { 'owner.value': { equals: user.id } },
  ],
})

/**
 * The `useAPIKey.access` overrides configured on the caller's own auth collection, if any.
 */
const getCallerAPIKeyAdministrationAccess = (
  req: PayloadRequest,
): APIKeyAdministrationAccessConfig | undefined => {
  const callerCollectionSlug = req.user?.collection

  if (!callerCollectionSlug) {
    return undefined
  }

  const useAPIKey = req.payload.collections[callerCollectionSlug]?.config.auth?.useAPIKey

  return typeof useAPIKey === 'object' ? useAPIKey.access : undefined
}

/**
 * Whether `req.user` can delete (revoke) API keys owned by other users, across any
 * API-key-enabled collection. Uses the caller's own collection's `useAPIKey.access.manageOthers`
 * when configured, otherwise falls back to `isAdministrator` (today's single-tier behavior).
 */
export const canManageOthersAPIKeys = async ({
  req,
}: {
  req: PayloadRequest
}): Promise<boolean> => {
  if (!isNonAPIKeyAuthenticatedUser(req.user)) {
    return false
  }

  const manageOthers = getCallerAPIKeyAdministrationAccess(req)?.manageOthers

  if (manageOthers) {
    return Boolean(await manageOthers({ req }))
  }

  return isAdministrator({ req })
}

/**
 * Whether `req.user` can view the metadata of API keys owned by other users, across any
 * API-key-enabled collection - never their decrypted secret value. Uses the caller's own
 * collection's `useAPIKey.access.readOthers` when configured; otherwise defers to
 * {@link canManageOthersAPIKeys} (manage implies read, and preserves today's single-tier
 * behavior when neither is configured).
 */
export const canReadOthersAPIKeys = async ({ req }: { req: PayloadRequest }): Promise<boolean> => {
  if (!isNonAPIKeyAuthenticatedUser(req.user)) {
    return false
  }

  const readOthers = getCallerAPIKeyAdministrationAccess(req)?.readOthers

  if (readOthers) {
    return Boolean(await readOthers({ req }))
  }

  return canManageOthersAPIKeys({ req })
}

/** Owner only: creating and renaming a key never extends to an administrator. */
export const apiKeysOwnerOnlyAccess: Access = ({ req }) => {
  if (!isNonAPIKeyAuthenticatedUser(req.user)) {
    return false
  }

  return ownerWhere(req.user as AuthenticatedUser)
}

/** Owner or read-tier administrator: reading metadata extends to administrators. */
export const apiKeysOwnerOrReadAccess: Access = async ({ req }) => {
  if (!isNonAPIKeyAuthenticatedUser(req.user)) {
    return false
  }

  if (await canReadOthersAPIKeys({ req })) {
    return true
  }

  return ownerWhere(req.user as AuthenticatedUser)
}

/** Owner or manage-tier administrator: deleting (revoking) a key extends to administrators. */
export const apiKeysOwnerOrManageAccess: Access = async ({ req }) => {
  if (!isNonAPIKeyAuthenticatedUser(req.user)) {
    return false
  }

  if (await canManageOthersAPIKeys({ req })) {
    return true
  }

  return ownerWhere(req.user as AuthenticatedUser)
}

/**
 * Anyone authenticated through a non-API-key strategy may create their own key, or
 * regenerate one they already own (a regular update, gated by `apiKeysOwnerOnlyAccess`).
 */
export const apiKeysCreateAccess: Access = ({ req }) => isNonAPIKeyAuthenticatedUser(req.user)
