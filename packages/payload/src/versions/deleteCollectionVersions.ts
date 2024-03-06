import type { Payload } from '../index.d.ts'
import type { PayloadRequest } from '../types/index.d.ts'

type Args = {
  id?: number | string
  payload: Payload
  req?: PayloadRequest
  slug: string
}

export const deleteCollectionVersions = async ({ id, slug, payload, req }: Args): Promise<void> => {
  try {
    await payload.db.deleteVersions({
      collection: slug,
      req,
      where: {
        parent: {
          equals: id,
        },
      },
    })
  } catch (err) {
    payload.logger.error(
      `There was an error removing versions for the deleted ${slug} document with ID ${id}.`,
    )
  }
}
