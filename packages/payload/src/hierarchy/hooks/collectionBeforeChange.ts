import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  JsonObject,
  PayloadRequest,
} from '../../index.js'

import { NotFound } from '../../errors/NotFound.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { deleteHierarchyChildren } from '../deleteHierarchyChildren.js'

type Args = {
  /**
   * The name of the field that contains the parent document ID
   */
  parentFieldName: string
}

export const hierarchyCollectionBeforeChange =
  ({ parentFieldName }: Args): CollectionBeforeChangeHook =>
  async ({ collection, data, operation, originalDoc, req }) => {
    if (collection.trash && operation === 'update' && data.deletedAt && !originalDoc?.deletedAt) {
      await deleteHierarchyChildren({
        id: originalDoc.id,
        collection,
        deletedAt: data.deletedAt,
        parentFieldName,
        req,
      })
    }

    // Determine the new parent ID
    const newParentID =
      data[parentFieldName] !== undefined ? data[parentFieldName] : originalDoc?.[parentFieldName]
    const hasParentChanged =
      (operation === 'create' || operation === 'update' || operation === 'validate') &&
      data[parentFieldName] !== undefined &&
      data[parentFieldName] !== originalDoc?.[parentFieldName]
    const isPublishing =
      hasDraftsEnabled(collection) && data._status !== undefined && data._status !== 'draft'

    // Validate circular references when parent is changing
    if ((hasParentChanged || isPublishing) && newParentID !== null && newParentID !== undefined) {
      // Extract parent ID (could be plain ID or populated object with id)
      const parentId =
        typeof newParentID === 'object' && 'id' in newParentID ? newParentID.id : newParentID

      // Prevent self-referential parent
      if (parentId === (originalDoc?.id ?? data.id)) {
        throw new Error('Document cannot be its own parent')
      }

      await validateNoCircularReference({
        collection,
        currentDocId: originalDoc?.id ?? data.id,
        parentId,
        req,
        shouldValidatePublished: data._status !== 'draft',
      })
    }

    return data
  }

/**
 * Walks the latest parent chain, including drafts, to reject cycles and descendant parenting.
 */
async function validateNoCircularReference({
  collection,
  currentDocId,
  parentId,
  req,
  shouldValidatePublished,
}: {
  collection: CollectionConfig
  currentDocId: number | string
  parentId: number | string
  req: PayloadRequest
  shouldValidatePublished: boolean
}) {
  const parentFieldName =
    collection.hierarchy && collection.hierarchy !== true
      ? collection.hierarchy.parentFieldName
      : undefined

  if (!parentFieldName) {
    return
  }

  const fieldName = parentFieldName

  async function checkAncestor({
    ancestorId,
    draft,
    visitedNodes = new Set(),
  }: {
    ancestorId: number | string
    draft: boolean
    visitedNodes?: Set<string>
  }): Promise<void> {
    // Create unique key for this node
    const nodeKey = `${collection.slug}:${ancestorId}`

    // Check if we've visited this node before (true loop in the chain)
    if (visitedNodes.has(nodeKey)) {
      throw new Error(`Circular reference detected: the parent chain contains a loop`)
    }

    // If we've reached the current document, this means we're trying to move into a child
    if (ancestorId === currentDocId) {
      throw new Error(
        collection.nestedDocs
          ? 'Document cannot be nested beneath one of its descendants'
          : 'Cannot move folder into its own subfolder',
      )
    }

    // Add this node to visited set
    visitedNodes.add(nodeKey)

    try {
      const ancestor = (await req.payload.findByID({
        id: ancestorId,
        collection: collection.slug,
        depth: 0,
        draft,
        overrideAccess: true,
        req,
        select: {
          [fieldName]: true,
        },
        showHiddenFields: true,
      })) as JsonObject

      const nextParent = ancestor?.[fieldName]

      if (nextParent === null || nextParent === undefined) {
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
        return checkAncestor({ ancestorId: nextParentId, draft, visitedNodes })
      }
    } catch (error) {
      if (error instanceof NotFound) {
        return
      }
      throw error
    }
  }

  if (shouldValidatePublished || !hasDraftsEnabled(collection)) {
    await checkAncestor({ ancestorId: parentId, draft: false })
  }
  if (hasDraftsEnabled(collection)) {
    await checkAncestor({ ancestorId: parentId, draft: true })
  }
}
