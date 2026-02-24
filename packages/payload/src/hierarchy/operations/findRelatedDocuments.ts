import type {
  PaginatedDocs,
  PayloadRequest,
  SanitizedCollectionConfig,
  Where,
} from '../../index.js'

type RelatedDocumentsResult = {
  [collectionSlug: string]: PaginatedDocs
}

type Args = {
  collection: SanitizedCollectionConfig
  depth?: number
  id: number | string
  limit?: number
  page?: number
  req: PayloadRequest
}

/**
 * Find all documents across collections that reference a hierarchy item
 *
 * This operation:
 * 1. Finds child hierarchy items (same collection with matching parent)
 * 2. Uses pre-computed relatedCollections from sanitized hierarchy config
 * 3. Queries each related collection for documents referencing this hierarchy item
 * 4. Returns grouped results by collection slug
 */
export async function findRelatedDocuments({
  id,
  collection,
  depth = 0,
  limit = 50,
  page = 1,
  req,
}: Args): Promise<RelatedDocumentsResult> {
  const { payload } = req
  const results: RelatedDocumentsResult = {}

  // Get the parent field name from hierarchy config
  const hierarchyConfig = collection.hierarchy
  const parentFieldName =
    hierarchyConfig && typeof hierarchyConfig === 'object'
      ? hierarchyConfig.parentFieldName
      : undefined

  if (!parentFieldName) {
    return results
  }

  // 1. Query child hierarchy items (same collection)
  results[collection.slug] = await payload.find({
    collection: collection.slug,
    depth,
    limit,
    overrideAccess: false,
    page,
    req,
    user: req.user,
    where: {
      [parentFieldName]: {
        equals: id,
      },
    },
  })

  // 2. Use pre-computed relatedCollections from sanitized hierarchy config
  const relatedCollectionsConfig =
    (hierarchyConfig && typeof hierarchyConfig === 'object'
      ? hierarchyConfig.relatedCollections
      : undefined) || {}

  // 3. Query each related collection
  for (const [relatedSlug, fieldInfo] of Object.entries(relatedCollectionsConfig)) {
    const relatedCollection = payload.config.collections.find((c) => c.slug === relatedSlug)
    if (!relatedCollection) {
      continue
    }

    const { fieldName, hasMany } = fieldInfo

    // Build where clause using pre-computed field info
    const where: Where = {
      [fieldName]: hasMany ? { in: [id] } : { equals: id },
    }

    try {
      results[relatedSlug] = await payload.find({
        collection: relatedSlug,
        depth,
        limit,
        overrideAccess: false,
        page,
        req,
        user: req.user,
        where,
      })
    } catch (error) {
      req.payload.logger.warn({
        err: error,
        msg: `Failed to query ${relatedSlug} for hierarchy ${collection.slug}:${id}`,
      })
    }
  }

  return results
}
