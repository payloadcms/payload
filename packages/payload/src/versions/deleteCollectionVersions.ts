import type { PayloadT } from '..'
import type { PayloadRequest } from '../types'

type Args = {
  id?: number | string
  payload: PayloadT
  req?: PayloadRequest
  slug: string
}

export const deleteCollectionVersions = async ({ id, payload, req, slug }: Args): Promise<void> => {
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
