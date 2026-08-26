import type { PayloadRequest } from '../types/index.js'

import { resolveBranchOwnVersions } from '../branching/versions.js'
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
      // Scoped to the branch performing the delete. A delete on a branch is a
      // tombstone rather than a real delete, so cascading by canonical ID alone
      // would strip main's version chain while leaving its row in place.
      where: await resolveBranchOwnVersions({ id: id!, collectionSlug: slug, req }),
    })
  } catch (err) {
    payload.logger.error({
      err,
      msg: `There was an error removing versions for the deleted ${slug} document with ID ${id}.`,
    })
  }
}
