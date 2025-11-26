import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../index.js'

type FetchParentAndComputeTreeArgs = {
  collection: SanitizedCollectionConfig
  doc: Document
  newParentID: null | number | string | undefined
  parentChanged: boolean
  prevParentID: null | number | string | undefined
  req: PayloadRequest
  slugPathFieldName: string
  titlePathFieldName: string
}

type FetchParentAndComputeTreeResult = {
  newParentTree: (number | string)[]
  parentDocument: Document | undefined
}

/**
 * Fetches the parent document and computes the new parent tree based on whether
 * the document moved to a new parent or just had its title changed.
 *
 * Handles three scenarios:
 * 1. Document moved to a new parent - fetches new parent and computes new tree
 * 2. Document moved to root (no parent) - returns empty tree
 * 3. Document title changed but parent stayed same - fetches current parent and keeps existing tree
 */
export async function fetchParentAndComputeTree({
  collection,
  doc,
  newParentID,
  parentChanged,
  prevParentID,
  req,
  slugPathFieldName,
  titlePathFieldName,
}: FetchParentAndComputeTreeArgs): Promise<FetchParentAndComputeTreeResult> {
  let parentDocument: Document = undefined
  let newParentTree: (number | string)[] = []

  if (parentChanged && newParentID) {
    // Moving document to new parent
    parentDocument = await req.payload.findByID({
      id: newParentID,
      collection: collection.slug,
      depth: 0,
      locale: 'all',
      select: {
        _parentTree: true,
        [slugPathFieldName]: true,
        [titlePathFieldName]: true,
      },
    })

    // Combine parent's _parentTree with newParentID to form new parent tree
    newParentTree = [...(parentDocument?._parentTree || []), newParentID]
  } else if (parentChanged && !newParentID) {
    // Moved document to the root (no parent)
    newParentTree = []
  } else {
    // Document did not move, but the title changed
    if (prevParentID) {
      parentDocument = await req.payload.findByID({
        id: prevParentID,
        collection: collection.slug,
        depth: 0,
        locale: 'all',
        req,
        select: {
          _parentTree: true,
          [slugPathFieldName]: true,
          [titlePathFieldName]: true,
        },
      })
    }

    // keep existing parent tree
    newParentTree = doc._parentTree
  }

  return {
    newParentTree,
    parentDocument,
  }
}
