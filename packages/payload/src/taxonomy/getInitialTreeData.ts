import type { PayloadRequest } from '../types/index.js'

import { DEFAULT_TAXONOMY_TREE_LIMIT } from './constants.js'

export type GetInitialTreeDataArgs = {
  collectionSlug: string
  expandedNodeIds?: (number | string)[]
  limit?: number
  req: PayloadRequest
}

export type InitialTreeData = {
  docs: any[]
  // Metadata about what was loaded - keyed by parent ID ('null' for root)
  loadedParents: Record<string, { hasMore: boolean; totalDocs: number }>
}

export const getInitialTreeData = async ({
  collectionSlug,
  expandedNodeIds = [],
  limit,
  req,
}: GetInitialTreeDataArgs): Promise<InitialTreeData> => {
  const collectionConfig = req.payload.collections[collectionSlug]?.config

  if (!collectionConfig || !collectionConfig.taxonomy) {
    throw new Error(`Collection ${collectionSlug} is not a taxonomy`)
  }

  const taxonomyConfig = collectionConfig.taxonomy
  const parentFieldName =
    typeof taxonomyConfig === 'object' ? taxonomyConfig.parentFieldName || 'parent' : 'parent'

  // Use limit from config if not provided, fallback to config's treeLimit
  const effectiveLimit =
    limit ??
    (typeof taxonomyConfig === 'object' ? taxonomyConfig.treeLimit : undefined) ??
    DEFAULT_TAXONOMY_TREE_LIMIT

  const allDocs: any[] = []
  const loadedParents: Record<string, { hasMore: boolean; totalDocs: number }> = {}

  // Query 1: Fetch root nodes (up to limit)
  const rootResult = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    limit: effectiveLimit,
    overrideAccess: false,
    page: 1,
    req,
    user: req.user,
    where: {
      [parentFieldName]: {
        exists: false,
      },
    },
  })

  allDocs.push(...rootResult.docs)
  loadedParents['null'] = {
    hasMore: rootResult.hasNextPage,
    totalDocs: rootResult.totalDocs,
  }

  // Query 2: For each expanded node, fetch its children (up to limit)
  for (const parentId of expandedNodeIds) {
    const childResult = await req.payload.find({
      collection: collectionSlug,
      depth: 0,
      limit: effectiveLimit,
      overrideAccess: false,
      page: 1,
      req,
      user: req.user,
      where: {
        [parentFieldName]: {
          equals: parentId,
        },
      },
    })

    allDocs.push(...childResult.docs)
    loadedParents[String(parentId)] = {
      hasMore: childResult.hasNextPage,
      totalDocs: childResult.totalDocs,
    }
  }

  return {
    docs: allDocs,
    loadedParents,
  }
}
