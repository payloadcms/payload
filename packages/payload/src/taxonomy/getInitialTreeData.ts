import type { TypeWithID } from '../collections/config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { DEFAULT_TAXONOMY_TREE_LIMIT } from './constants.js'

export type GetInitialTreeDataArgs = {
  collectionSlug: string
  expandedNodeIds?: (number | string)[]
  limit?: number
  req: PayloadRequest
  /** The currently selected node ID. When provided, ensures siblings are loaded to include this node. */
  selectedNodeId?: null | number | string
  /** The parent ID of the selected node. Required when selectedNodeId is provided. */
  selectedNodeParentId?: null | number | string
}

export type InitialTreeData = {
  docs: TypeWithID[]
  // Metadata about what was loaded - keyed by parent ID ('null' for root)
  loadedParents: Record<string, { hasMore: boolean; loadedCount?: number; totalDocs: number }>
}

export const getInitialTreeData = async ({
  collectionSlug,
  expandedNodeIds = [],
  limit,
  req,
  selectedNodeId,
  selectedNodeParentId,
}: GetInitialTreeDataArgs): Promise<InitialTreeData> => {
  const collectionConfig = req.payload.collections[collectionSlug]?.config

  if (!collectionConfig || !collectionConfig.taxonomy) {
    throw new Error(`Collection ${collectionSlug} is not a taxonomy`)
  }

  const taxonomyConfig = collectionConfig.taxonomy
  const parentFieldName = taxonomyConfig.parentFieldName || 'parent'

  // Use limit from config if not provided, fallback to config's treeLimit
  const effectiveLimit = limit ?? taxonomyConfig.treeLimit ?? DEFAULT_TAXONOMY_TREE_LIMIT

  const allDocs: TypeWithID[] = []
  const loadedParents: Record<
    string,
    { hasMore: boolean; loadedCount: number; totalDocs: number }
  > = {}

  // Normalize selectedNodeParentId: treat null/undefined as 'null' (root level)
  const normalizedSelectedParentId =
    selectedNodeParentId === null || selectedNodeParentId === undefined
      ? 'null'
      : String(selectedNodeParentId)

  // Helper to check if selectedNodeId is among siblings at a given parent level
  const needsSelectedNodeIncluded = (parentKey: string): boolean => {
    return !!selectedNodeId && normalizedSelectedParentId === parentKey
  }

  // Helper to fetch children with optional selectedNodeId inclusion
  const fetchChildrenForParent = async (parentKey: string, whereClause: Where): Promise<void> => {
    const mustIncludeSelected = needsSelectedNodeIncluded(parentKey)
    let accumulatedDocs: TypeWithID[] = []
    let currentPage = 1
    let hasMore = true
    let totalDocs = 0
    let foundSelected = false

    while (hasMore) {
      const result = await req.payload.find({
        collection: collectionSlug,
        depth: 0,
        limit: effectiveLimit,
        overrideAccess: false,
        page: currentPage,
        req,
        user: req.user,
        where: whereClause,
      })

      accumulatedDocs = [...accumulatedDocs, ...result.docs]
      totalDocs = result.totalDocs
      hasMore = result.hasNextPage

      // Check if selectedNodeId is in this page's results
      if (mustIncludeSelected && !foundSelected) {
        foundSelected = result.docs.some(
          (doc: TypeWithID) => String(doc.id) === String(selectedNodeId),
        )
      }

      // Stop if we've found the selected node OR we only need first page
      if (!mustIncludeSelected || foundSelected || !hasMore) {
        break
      }

      currentPage++
    }

    allDocs.push(...accumulatedDocs)
    loadedParents[parentKey] = {
      hasMore,
      loadedCount: accumulatedDocs.length,
      totalDocs,
    }
  }

  // Query 1: Fetch root nodes
  await fetchChildrenForParent('null', {
    [parentFieldName]: { exists: false },
  })

  // Query 2: For each expanded node, fetch its children
  for (const parentId of expandedNodeIds) {
    await fetchChildrenForParent(String(parentId), {
      [parentFieldName]: { equals: parentId },
    })
  }

  return {
    docs: allDocs,
    loadedParents,
  }
}
