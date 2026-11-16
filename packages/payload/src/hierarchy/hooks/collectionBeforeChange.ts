import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  JsonObject,
  PayloadRequest,
} from '../../index.js'

import { NotFound } from '../../errors/NotFound.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'

type Args = {
  parentFieldName: string
}

export const hierarchyCollectionBeforeChange =
  ({ parentFieldName }: Args): CollectionBeforeChangeHook =>
  async ({ collection, data, operation, originalDoc, req }) => {
    const newParentID =
      data[parentFieldName] !== undefined ? data[parentFieldName] : originalDoc?.[parentFieldName]
    const hasParentChanged =
      (operation === 'create' || operation === 'update' || operation === 'validate') &&
      data[parentFieldName] !== undefined &&
      data[parentFieldName] !== originalDoc?.[parentFieldName]
    const isPublishing =
      hasDraftsEnabled(collection) && data._status !== undefined && data._status !== 'draft'

    if ((hasParentChanged || isPublishing) && newParentID !== null && newParentID !== undefined) {
      const parentId =
        typeof newParentID === 'object' && 'id' in newParentID ? newParentID.id : newParentID

      if (parentId === (originalDoc?.id ?? data.id)) {
        throw new Error('Document cannot be its own parent')
      }

      await validateNoCircularReference({
        collection,
        currentDocId: originalDoc?.id ?? data.id,
        parentFieldName,
        parentId,
        req,
        shouldValidatePublished: data._status !== 'draft',
      })
    }

    return data
  }

async function validateNoCircularReference({
  collection,
  currentDocId,
  parentFieldName,
  parentId,
  req,
  shouldValidatePublished,
}: {
  collection: CollectionConfig
  currentDocId?: number | string
  parentFieldName: string
  parentId: number | string
  req: PayloadRequest
  shouldValidatePublished: boolean
}) {
  async function checkAncestor({
    ancestorId,
    draft,
    visitedNodes = new Set(),
  }: {
    ancestorId: number | string
    draft: boolean
    visitedNodes?: Set<string>
  }): Promise<void> {
    const nodeKey = `${collection.slug}:${ancestorId}`

    if (visitedNodes.has(nodeKey)) {
      throw new Error('Circular reference detected: the parent chain contains a loop')
    }

    if (ancestorId === currentDocId) {
      throw new Error('Cannot move folder into its own subfolder')
    }

    visitedNodes.add(nodeKey)

    try {
      const ancestor = (await req.payload.findByID({
        id: ancestorId,
        collection: collection.slug,
        depth: 0,
        draft,
        overrideAccess: true,
        req,
        select: { [parentFieldName]: true },
        showHiddenFields: true,
      })) as JsonObject
      const nextParent = ancestor?.[parentFieldName]

      if (nextParent === null || nextParent === undefined) {
        return
      }

      const nextParentId =
        typeof nextParent === 'object' && 'id' in nextParent ? nextParent.id : nextParent

      if (typeof nextParentId === 'string' || typeof nextParentId === 'number') {
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
