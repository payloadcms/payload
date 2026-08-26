/**
 * beforeChange Hook Responsibilities:
 * - Validate circular references when parent changes
 * - Prevent moving a folder into its own subfolder
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
      // Extract parent ID (could be plain ID or populated object with id)
      const parentId =
        typeof newParentID === 'object' && 'id' in newParentID ? newParentID.id : newParentID

      // Prevent self-referential parent
      if (parentId === (originalDoc?.id || data.id)) {
        throw new Error('Document cannot be its own parent')
      }

      // Check for true circular references (loops in the chain), but allow
      // moving into a child - that will be handled by afterChange reparenting
      await validateNoCircularReference({
        collection,
        currentDocId: originalDoc?.id,
        parentId,
        req,
      })
    }

    return data
  }

/**
 * Walks up the parent chain to detect true circular references (loops).
 * Does NOT throw when moving into a child - that case is handled by afterChange
 * which will automatically reparent the child.
 */
async function validateNoCircularReference({
  collection,
  currentDocId,
  parentId,
  req,
}: {
  collection: CollectionConfig
  currentDocId: number | string
  parentId: number | string
  req: PayloadRequest
}) {
  const parentFieldName =
    collection.hierarchy && collection.hierarchy !== true
      ? collection.hierarchy.parentFieldName
      : undefined

  if (!parentFieldName) {
    return
  }

  const fieldName = parentFieldName

  async function checkAncestor(
    ancestorId: number | string,
    visitedNodes: Set<string> = new Set(),
  ): Promise<void> {
    // Create unique key for this node
    const nodeKey = `${collection.slug}:${ancestorId}`

    // Check if we've visited this node before (true loop in the chain)
    if (visitedNodes.has(nodeKey)) {
      throw new Error(`Circular reference detected: the parent chain contains a loop`)
    }

    // If we've reached the current document, this means we're trying to move into a child
    if (ancestorId === currentDocId) {
      throw new Error('Cannot move folder into its own subfolder')
    }

    // Add this node to visited set
    visitedNodes.add(nodeKey)

    try {
      const ancestor = (await req.payload.findByID({
        id: ancestorId,
        collection: collection.slug,
        depth: 0,
        req,
        select: {
          [fieldName]: true,
        },
      })) as JsonObject

      const nextParent = ancestor?.[fieldName]

      if (!nextParent) {
        return // No parent, end of chain
      }

      // Extract next parent ID (could be plain ID or populated object)
      let nextParentId = nextParent
      if (typeof nextParent === 'object' && 'id' in nextParent) {
        nextParentId = nextParent.id
      }

      // Continue traversal if parent exists
      if (
        nextParentId !== null &&
        nextParentId !== undefined &&
        (typeof nextParentId === 'string' || typeof nextParentId === 'number')
      ) {
        return checkAncestor(nextParentId, visitedNodes)
      }
    } catch (error) {
      // If it's our validation error, re-throw it
      if (error instanceof Error && error.message?.includes('Circular reference detected')) {
        throw error
      }
      // Non-existent parent can't create a circular reference
      return
    }
  }

  await checkAncestor(parentId)
}
