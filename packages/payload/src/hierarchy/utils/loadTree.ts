import type { PaginatedDocs } from '../../database/types.js'
import type { PayloadRequest, TypeWithID } from '../../types/index.js'

type LoadTreeArgs = {
  collection: string
  /**
   * Name of the parent field
   */
  parentFieldName: string
  req: PayloadRequest
  /**
   * Optional root ID to load only direct children of a specific node
   */
  rootId?: null | number | string
}

/**
 * Loads documents from a hierarchical collection.
 * Note: Without stored tree data, this can only load direct children efficiently.
 * For full tree loading, make multiple calls or use client-side recursive loading.
 *
 * @example
 * // Load root documents (no parent)
 * const roots = await loadTree({
 *   collection: 'folders',
 *   req,
 * })
 *
 * @example
 * // Load direct children of a folder
 * const children = await loadTree({
 *   collection: 'folders',
 *   rootId: folderId,
 *   req,
 * })
 */
export async function loadTree({
  collection,
  parentFieldName,
  req,
  rootId = null,
}: LoadTreeArgs): Promise<PaginatedDocs<TypeWithID>> {
  // Enable cache statistics for debugging
  if (!req.context.hierarchyCacheStats) {
    req.context.hierarchyCacheStats = {
      hits: 0,
      misses: 0,
      queries: 0,
    }
  }

  // Load documents at the specified level
  const result = await req.payload.find({
    collection,
    depth: 0,
    limit: 0,
    where: {
      [parentFieldName]: rootId === null ? { equals: null } : { equals: rootId },
    },
  })

  return result
}

type TreeNode<T> = { children: TreeNode<T>[] } & T

/**
 * Builds a nested tree structure from flat array of documents.
 * Documents must have an 'id' and a parent field.
 *
 * @example
 * const allDocs = await payload.find({ collection: 'folders', limit: 0 })
 * const nested = buildNestedTree(allDocs.docs, '_h_folders')
 */
export function buildNestedTree<T extends { [key: string]: any; id: number | string }>(
  documents: T[],
  parentFieldName: string,
): TreeNode<T>[] {
  const docMap = new Map<number | string, TreeNode<T>>()
  const roots: TreeNode<T>[] = []

  // Create map of all documents with children arrays
  for (const doc of documents) {
    docMap.set(doc.id, { ...doc, children: [] })
  }

  // Build tree structure
  for (const doc of documents) {
    const node = docMap.get(doc.id)!
    const parentId = doc[parentFieldName]

    if (!parentId) {
      // No parent = root node
      roots.push(node)
    } else {
      // Has parent = add to parent's children
      const parent = docMap.get(parentId)
      if (parent) {
        parent.children.push(node)
      }
    }
  }

  return roots
}
