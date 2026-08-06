/**
 * General hierarchy beforeChange hook responsibilities:
 * - Validate circular references when parent changes
 * - Prevent moving a document into its own descendant chain
 */

import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  JsonObject,
  PayloadRequest,
} from '../../index.js'

import { collectionBeforeChangeStored } from './stored/collectionBeforeChange.js'

type Args = {
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName: string
  pathStrategy: 'stored' | 'virtual'
  slugPathFieldName: string
  titleFieldName: string
  titlePathFieldName: string
}

export const collectionBeforeChange = ({
  parentFieldName,
  pathStrategy,
  slugPathFieldName,
  titleFieldName,
  titlePathFieldName,
}: Args): CollectionBeforeChangeHook => {
  const storedBeforeChangeHook =
    pathStrategy === 'stored'
      ? collectionBeforeChangeStored({
          parentFieldName,
          slugPathFieldName,
          titleFieldName,
          titlePathFieldName,
        })
      : undefined

  return async (args) => {
    const { collection, data, operation, originalDoc, req } = args

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
        parentFieldName,
        parentId,
        req,
      })
    }

    return storedBeforeChangeHook ? await storedBeforeChangeHook(args) : data
  }
}

/**
 * Walks up the parent chain to detect cycles.
 */
async function validateNoCircularReference({
  collection,
  currentDocId,
  parentFieldName,
  parentId,
  req,
}: {
  collection: CollectionConfig
  currentDocId: number | string
  parentFieldName: string
  parentId: number | string
  req: PayloadRequest
}) {
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
          [parentFieldName]: true,
        },
      })) as JsonObject

      const nextParent = ancestor?.[parentFieldName]

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
