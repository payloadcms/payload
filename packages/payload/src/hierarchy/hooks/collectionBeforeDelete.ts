/**
 * beforeDelete Hook Responsibilities:
 * - Reparent or cascade-delete child documents according to hierarchy config
 * - Set context flag for deletion tracking
 */

import type { CollectionBeforeDeleteHook } from '../../index.js'

type Args = {
  deleteStrategy: 'cascade' | 'reparent'
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName: string
}

export const hierarchyCollectionBeforeDelete =
  ({ deleteStrategy, parentFieldName }: Args): CollectionBeforeDeleteHook =>
  async ({ id, collection, req }) => {
    req.context = req.context || {}
    req.context.isDeleting = true

    if (deleteStrategy === 'cascade') {
      await req.payload.delete({
        collection: collection.slug,
        overrideAccess: false,
        req,
        where: {
          [parentFieldName]: {
            equals: id,
          },
        },
      })
      return
    }

    const deletedDocument = await req.payload.findByID({
      id,
      collection: collection.slug,
      depth: 0,
      overrideAccess: true,
      req,
      select: { [parentFieldName]: true },
    })

    const children = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      limit: 0,
      overrideAccess: true,
      req,
      select: { id: true },
      where: {
        [parentFieldName]: {
          equals: id,
        },
      },
    })

    const parent = deletedDocument[parentFieldName]
    const parentID = parent && typeof parent === 'object' && 'id' in parent ? parent.id : parent

    for (const { id: childID } of children.docs) {
      await req.payload.update({
        id: childID,
        collection: collection.slug,
        data: { [parentFieldName]: parentID ?? null },
        overrideAccess: true,
        req,
      })
    }
  }
