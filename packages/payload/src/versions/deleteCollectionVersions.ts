import type { PayloadRequest } from '../types/index.js'

import { type Payload } from '../index.js'

type Args = {
  id?: number | string
  /**
   * Delete the versions of many parent documents at once. Takes precedence over `id`.
   */
  ids?: (number | string)[]
  payload: Payload
  req?: PayloadRequest
  slug: string
}

export const deleteCollectionVersions = async ({
  id,
  slug,
  ids,
  payload,
  req,
}: Args): Promise<void> => {
  try {
    await payload.db.deleteVersions({
      collection: slug,
      req,
      where: {
        parent: ids ? { in: ids } : { equals: id },
      },
    })
  } catch (err) {
    payload.logger.error({
      err,
      msg: ids
        ? `There was an error removing versions for ${ids.length} deleted ${slug} documents.`
        : `There was an error removing versions for the deleted ${slug} document with ID ${id}.`,
    })
  }
}
