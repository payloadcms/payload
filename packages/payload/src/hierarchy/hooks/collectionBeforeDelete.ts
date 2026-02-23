/**
 * beforeDelete Hook Responsibilities:
 * - Delete child folders when parent is deleted (cascade delete)
 * - Set context flag for deletion tracking
 */

import type { CollectionBeforeDeleteHook } from '../../index.js'

type Args = {
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName: string
}

export const hierarchyCollectionBeforeDelete =
  ({ parentFieldName }: Args): CollectionBeforeDeleteHook =>
  async ({ id, collection, req }) => {
    req.context = req.context || {}
    req.context.isDeleting = true

    // Delete all child folders (cascade delete)
    await req.payload.delete({
      collection: collection.slug,
      req,
      where: {
        [parentFieldName]: {
          equals: id,
        },
      },
    })
  }
