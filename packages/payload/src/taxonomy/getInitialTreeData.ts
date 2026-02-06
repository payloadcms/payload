import type { PayloadRequest } from '../types/index.js'

export type GetInitialTreeDataArgs = {
  collectionSlug: string
  expandedNodeIds?: (number | string)[]
  limit?: number
  req: PayloadRequest
}

export type InitialTreeData = {
  docs: any[]
}

export const getInitialTreeData = async ({
  collectionSlug,
  expandedNodeIds = [],
  limit = 100,
  req,
}: GetInitialTreeDataArgs): Promise<InitialTreeData> => {
  const collectionConfig = req.payload.collections[collectionSlug]?.config

  if (!collectionConfig || !collectionConfig.taxonomy) {
    throw new Error(`Collection ${collectionSlug} is not a taxonomy`)
  }

  const taxonomyConfig = collectionConfig.taxonomy
  const parentFieldName =
    typeof taxonomyConfig === 'object' ? taxonomyConfig.parentFieldName || 'parent' : 'parent'

  // Build query: root nodes OR children of expanded nodes
  const whereClause: any =
    expandedNodeIds.length > 0
      ? {
          or: [
            {
              [parentFieldName]: {
                exists: false, // Root nodes
              },
            },
            {
              [parentFieldName]: {
                in: expandedNodeIds, // Children of expanded nodes
              },
            },
          ],
        }
      : {
          [parentFieldName]: {
            exists: false, // Only root nodes if nothing expanded
          },
        }

  const result = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    limit,
    page: 1,
    req,
    where: whereClause,
  })

  return {
    docs: result.docs,
  }
}
