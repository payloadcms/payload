import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { PayloadRequest } from '../express/types'
import type { Payload } from '../index'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  /**
   * User IDs to delete
   */
  ids: (number | string)[]
  payload: Payload
  req: PayloadRequest
}
export const deleteUserPreferences = async ({ collectionConfig, ids, payload, req }: Args) => {
  if (collectionConfig.auth) {
    const deleteManyAuthDbArgs = {
      collection: 'payload-preferences',
      req,
      where: {
        and: [
          {
            'user.value': { in: ids },
          },
          {
            'user.relationTo': { equals: collectionConfig.slug },
          },
        ],
      },
    }
    if (collectionConfig?.db?.deleteMany) {
      await collectionConfig.db.deleteMany(deleteManyAuthDbArgs)
    } else {
      await payload.db.deleteMany(deleteManyAuthDbArgs)
    }
  }

  const deleteManyDbArgs = {
    collection: 'payload-preferences',
    req,
    where: {
      key: { in: ids.map((id) => `collection-${collectionConfig.slug}-${id}`) },
    },
  }
  if (collectionConfig?.db?.deleteMany) {
    await collectionConfig.db.deleteMany(deleteManyDbArgs)
  } else {
    await payload.db.deleteMany(deleteManyDbArgs)
  }
}
