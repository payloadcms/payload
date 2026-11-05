import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { preferencesCollectionSlug } from './config.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  /**
   * User IDs to delete
   */
  ids: (number | string)[]
  payload: Payload
  preferenceIDs?: (number | string)[]
  req: PayloadRequest
}

export const findUserPreferenceIDs = async ({
  collectionConfig,
  ids,
  payload,
  req,
}: Omit<Args, 'preferenceIDs'>): Promise<(number | string)[]> => {
  if (!ids.length) {
    return []
  }

  const where = collectionConfig.auth
    ? {
        or: [
          {
            and: [
              {
                'user.value': { in: ids },
              },
              {
                'user.relationTo': { equals: collectionConfig.slug },
              },
            ],
          },
          {
            key: { in: ids.map((id) => `collection-${collectionConfig.slug}-${id}`) },
          },
        ],
      }
    : {
        key: { in: ids.map((id) => `collection-${collectionConfig.slug}-${id}`) },
      }

  const { docs } = await payload.db.find<{ id: number | string }>({
    collection: preferencesCollectionSlug,
    pagination: false,
    req,
    select: { id: true },
    where,
  })

  return docs.map((doc) => doc.id)
}

export const deleteUserPreferences = async ({
  collectionConfig,
  ids,
  payload,
  preferenceIDs,
  req,
}: Args) => {
  if (preferenceIDs !== undefined) {
    if (!preferenceIDs.length) {
      return
    }

    await payload.db.deleteMany({
      collection: preferencesCollectionSlug,
      req,
      where: {
        id: { in: preferenceIDs },
      },
    })
    return
  }

  if (collectionConfig.auth) {
    await payload.db.deleteMany({
      collection: preferencesCollectionSlug,
      req,
      where: {
        or: [
          {
            and: [
              {
                'user.value': { in: ids },
              },
              {
                'user.relationTo': { equals: collectionConfig.slug },
              },
            ],
          },
          {
            key: { in: ids.map((id) => `collection-${collectionConfig.slug}-${id}`) },
          },
        ],
      },
    })
  } else {
    await payload.db.deleteMany({
      collection: preferencesCollectionSlug,
      req,
      where: {
        key: { in: ids.map((id) => `collection-${collectionConfig.slug}-${id}`) },
      },
    })
  }
}
