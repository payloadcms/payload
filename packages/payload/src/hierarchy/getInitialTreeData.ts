import type { TypeWithID } from '../collections/config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { DEFAULT_HIERARCHY_TREE_LIMIT } from '../hierarchy/constants.js'

export type GetInitialTreeDataArgs = {
  /** Base filter to apply to all queries (e.g., tenant filter) */
  baseFilter?: null | Where
  collectionSlug: string
  expandedNodeIds?: (number | string)[]
  /** Filter tree to only show folders that allow these collection types (or are unrestricted) */
  filterByCollections?: string[]
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
  baseFilter,
  collectionSlug,
  expandedNodeIds = [],
  filterByCollections,
  limit,
  req,
  selectedNodeId,
  selectedNodeParentId,
}: GetInitialTreeDataArgs): Promise<InitialTreeData> => {
  const collectionConfig = req.payload.collections[collectionSlug]?.config

  if (!collectionConfig || !collectionConfig.hierarchy) {
    throw new Error(`Collection ${collectionSlug} is not a hierarchy`)
  }

  const hierarchyConfig = collectionConfig.hierarchy
  const parentFieldName = hierarchyConfig.parentFieldName
  const useAsTitle = collectionConfig.admin?.useAsTitle ?? 'id'

  // Get typeFieldName for filtering
  const typeFieldName =
    hierarchyConfig.collectionSpecific && typeof hierarchyConfig.collectionSpecific === 'object'
      ? hierarchyConfig.collectionSpecific.fieldName
      : undefined

  // Build filter condition if filterByCollections is provided
  // Exclude the hierarchy collection itself (folders always show folders)
  const filteredTypes = filterByCollections?.filter((t) => t !== collectionSlug)

  // Get all possible type values from relatedCollections for detecting empty arrays
  const allPossibleTypes = hierarchyConfig.relatedCollections
    ? Object.keys(hierarchyConfig.relatedCollections)
    : []

  const filterCondition =
    filteredTypes?.length && typeFieldName
      ? {
          or: [
            { [typeFieldName]: { in: filteredTypes } },
            { [typeFieldName]: { exists: false } }, // Include unrestricted folders (field doesn't exist)
            // Include unrestricted folders with empty allowedTypes array
            // Using not_in with all possible values matches empty arrays in both MongoDB and Postgres
            ...(allPossibleTypes.length > 0
              ? [{ [typeFieldName]: { not_in: allPossibleTypes } }]
              : []),
          ],
        }
      : null

  // Use limit from config if not provided, fallback to config's treeLimit
  const effectiveLimit = limit ?? hierarchyConfig.admin?.treeLimit ?? DEFAULT_HIERARCHY_TREE_LIMIT

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
  const fetchChildrenForParent = async (
    parentKey: string,
    parentCondition: Where,
  ): Promise<void> => {
    const mustIncludeSelected = needsSelectedNodeIncluded(parentKey)
    let accumulatedDocs: TypeWithID[] = []
    let currentPage = 1
    let hasMore = true
    let totalDocs = 0
    let foundSelected = false

    // Combine parent condition with filter condition and baseFilter
    const conditions: Where[] = [parentCondition]
    if (filterCondition) {
      conditions.push(filterCondition)
    }
    if (baseFilter) {
      conditions.push(baseFilter)
    }
    const whereClause = conditions.length > 1 ? { and: conditions } : parentCondition

    while (hasMore) {
      const result = await req.payload.find({
        collection: collectionSlug,
        depth: 0,
        limit: effectiveLimit,
        overrideAccess: false,
        page: currentPage,
        req,
        sort: useAsTitle,
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
