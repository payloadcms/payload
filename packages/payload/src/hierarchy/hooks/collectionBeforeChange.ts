/**
 * beforeChange Hook Responsibilities:
 * - Validate circular references when parent changes
 *
 * Does NOT handle:
 * - Tree structure (no stored tree anymore)
 * - Path computation (done in afterRead)
 */

import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  JsonObject,
  PayloadRequest,
} from '../../index.js'

type Args = {
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName: string
}

export const hierarchyCollectionBeforeChange =
  ({ parentFieldName }: Args): CollectionBeforeChangeHook =>
  async ({ collection, data, operation, originalDoc, req }) => {
    // Determine the new parent ID
    const newParentID =
      data[parentFieldName] !== undefined ? data[parentFieldName] : originalDoc?.[parentFieldName]
    const parentChanged =
      operation === 'update' &&
      data[parentFieldName] !== undefined &&
      data[parentFieldName] !== originalDoc?.[parentFieldName]

    // Validate circular references when parent is changing
    if (parentChanged && newParentID) {
      // Prevent self-referential parent
      if (newParentID === (originalDoc?.id || data.id)) {
        throw new Error('Document cannot be its own parent')
      }

      // Prevent circular references by walking up the parent chain
      await validateNoCircularReference({
        collection,
        currentDocId: originalDoc?.id,
        newParentId: newParentID,
        parentFieldName,
        req,
      })
    }

    return data
  }

/**
 * Walks up the parent chain to detect circular references
 */
async function validateNoCircularReference({
  collection,
  currentDocId,
  newParentId,
  parentFieldName,
  req,
}: {
  collection: CollectionConfig
  currentDocId: number | string
  newParentId: number | string
  parentFieldName: string
  req: PayloadRequest
}) {
  async function checkAncestor(ancestorId: number | string): Promise<void> {
    if (ancestorId === currentDocId) {
      throw new Error(
        'Circular reference detected: the new parent is a descendant of this document',
      )
    }

    try {
      const ancestor = (await req.payload.findByID({
        id: ancestorId,
        collection: collection.slug,
        depth: 0,
        req,
        select: {
          [parentFieldName]: true,
        },
      })) as JsonObject

      const nextParentId = ancestor?.[parentFieldName]

      // Continue traversal if parent exists and is valid
      if (
        nextParentId !== null &&
        nextParentId !== undefined &&
        (typeof nextParentId === 'string' || typeof nextParentId === 'number')
      ) {
        return checkAncestor(nextParentId)
      }
    } catch (_) {
      // a non-existent parent can't create a circular reference
      return
    }
  }

  await checkAncestor(newParentId)
}
