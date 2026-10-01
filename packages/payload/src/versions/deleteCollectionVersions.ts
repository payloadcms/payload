import type { PayloadRequest } from '../types/index.js'

import { resolveBranchOwnVersions } from '../branching/versions.js'
import { type Payload } from '../index.js'
import { markTransactionWrite } from '../utilities/transactionMutationTracker.js'

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

/**
 * Deletes every version belonging to one parent document, or to many at once via `ids`.
 *
 * @internal - this may break or be removed at any time. It is exported from the package root only
 * so that Payload 2.x `payload/versions` imports keep resolving, not as an API to build on.
 */
export const deleteCollectionVersions = async ({
  id,
  slug,
  ids,
  payload,
  req,
}: Args): Promise<void> => {
  try {
    const parentIDs = ids ?? (typeof id === 'undefined' ? [] : [id])

    if (!parentIDs.length) {
      return
    }

    const branchScopedVersionQueries = await Promise.all(
      parentIDs.map((parentID) =>
        resolveBranchOwnVersions({ id: parentID, collectionSlug: slug, req }),
      ),
    )

    await payload.db.deleteVersions({
      collection: slug,
      req,
      // Scoped to the branch performing the delete. A delete on a branch is a
      // tombstone rather than a real delete, so cascading by canonical ID alone
      // would strip main's version chain while leaving its row in place.
      where:
        branchScopedVersionQueries.length === 1
          ? branchScopedVersionQueries[0]!
          : { or: branchScopedVersionQueries },
    })
    markTransactionWrite({ req })
  } catch (err) {
    payload.logger.error({
      err,
      msg: ids
        ? `There was an error removing versions for ${ids.length} deleted ${slug} documents.`
        : `There was an error removing versions for the deleted ${slug} document with ID ${id}.`,
    })
  }
}
