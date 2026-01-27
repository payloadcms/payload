import type { PayloadRequest } from '../types/index.js'

import { type Payload } from '../index.js'

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
    payload.logger.error({
      err,
      msg: `There was an error removing versions for the deleted ${slug} document with ID ${id}.`,
    })
  }
}
