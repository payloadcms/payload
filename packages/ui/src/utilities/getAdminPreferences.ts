import type { AdminPreferences, PayloadRequest } from 'payload'

import { PREFERENCE_KEYS } from 'payload/shared'

import { getPreferences } from './getPreferences.js'

const empty: AdminPreferences = {}

/**
 * Reads the `admin` preference — state global to the admin panel, the active
 * content branch included.
 *
 * Every consumer goes through here rather than querying the key itself, so they
 * all reach `getPreferences`' cache with identical arguments. That is what makes
 * the branch resolution in `initReq` and the nav render share a single query
 * instead of issuing one each.
 */
export async function getAdminPreferences({
  req,
}: {
  req: PayloadRequest
}): Promise<AdminPreferences> {
  if (!req.user?.id || !req.user.collection) {
    return empty
  }

  const preference = await getPreferences<AdminPreferences>(
    PREFERENCE_KEYS.ADMIN,
    req.payload,
    req.user.id,
    req.user.collection,
  )

  return preference?.value ?? empty
}
