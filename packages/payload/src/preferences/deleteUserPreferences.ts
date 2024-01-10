import type { Payload } from '..'
import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { PayloadRequest } from '../types'

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
    await payload.db.deleteMany({
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
    })
  }
  await payload.db.deleteMany({
    collection: 'payload-preferences',
    req,
    where: {
      key: { in: ids.map((id) => `collection-${collectionConfig.slug}-${id}`) },
    },
  })
}
