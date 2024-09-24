import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

type Args = {
  id?: number | string
  payload: Payload
  req?: PayloadRequest
  slug: string
}

export const deleteCollectionVersions = async ({ id, slug, payload, req }: Args): Promise<void> => {
  try {
    const dbArgs = {
      collection: slug,
      req,
      where: {
        parent: {
          equals: id,
        },
      },
    }
    const collectionConfig = payload.config.collections[slug]
    if (collectionConfig?.db?.deleteVersions) {
      await collectionConfig.db.deleteVersions(dbArgs)
    } else {
      await payload.db.deleteVersions(dbArgs)
    }
  } catch (err) {
    payload.logger.error(
      `There was an error removing versions for the deleted ${slug} document with ID ${id}.`,
    )
  }
}
