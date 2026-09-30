import type { AdminPreferences } from '../preferences/types.js'
import type { PayloadRequest } from '../types/index.js'

import { PREFERENCE_KEYS } from '../preferences/keys.js'

const adminPreferencesContextKey = Symbol('adminPreferences')
const emptyAdminPreferences: AdminPreferences = {}

type CachedAdminPreferences = {
  collection: string
  promise: Promise<AdminPreferences>
  userID: number | string
}

/**
 * Reads the preference that stores state shared across the admin panel.
 * The result is cached on the request so branch resolution and navigation use one query.
 */
export function getAdminPreferences({ req }: { req: PayloadRequest }): Promise<AdminPreferences> {
  const userID = req.user?.id
  const userCollection = req.user?.collection

  if (!userID || !userCollection) {
    return Promise.resolve(emptyAdminPreferences)
  }

  const context = req.context as Record<PropertyKey, unknown>
  const cachedPreferences = context[adminPreferencesContextKey] as
    | CachedAdminPreferences
    | undefined

  if (cachedPreferences?.collection === userCollection && cachedPreferences.userID === userID) {
    return cachedPreferences.promise
  }

  const promise = req.payload
    .find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        and: [
          {
            key: {
              equals: PREFERENCE_KEYS.ADMIN,
            },
          },
          {
            'user.relationTo': {
              equals: userCollection,
            },
          },
          {
            'user.value': {
              equals: userID,
            },
          },
        ],
      },
    })
    .then(
      (result) => (result.docs[0]?.value as AdminPreferences | undefined) ?? emptyAdminPreferences,
    )

  context[adminPreferencesContextKey] = {
    collection: userCollection,
    promise,
    userID,
  } satisfies CachedAdminPreferences

  return promise
}
