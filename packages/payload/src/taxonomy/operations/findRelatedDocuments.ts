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
 * Find all documents across collections that reference a taxonomy item
 *
 * This operation:
 * 1. Finds child taxonomy items (same collection with matching parent)
 * 2. Finds all collections with relationships to this taxonomy
 * 3. Queries each related collection for documents referencing this taxonomy item
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

  // Get the parent field name from taxonomy/hierarchy config
  const parentFieldName = collection.taxonomy
    ? collection.taxonomy.parentFieldName
    : collection.hierarchy
      ? collection.hierarchy.parentFieldName
      : 'parent'

  // 1. Query child taxonomy items (same collection)
  results[collection.slug] = await payload.find({
    collection: collection.slug,
    depth,
    limit,
    page,
    req,
    where: {
      [parentFieldName]: {
        equals: id,
      },
    },
  })

  // 2. Find all collections with relationships to this taxonomy
  const relatedCollections = findCollectionsWithRelationTo(
    payload.config.collections,
    collection.slug,
  )

  // 3. Query each related collection
  for (const relatedCollection of relatedCollections) {
    const relationshipFields = findRelationshipFieldsTo(relatedCollection, collection.slug)

    if (relationshipFields.length === 0) {
      continue
    }

    // Build where clause for all relationship fields pointing to this taxonomy
    const whereConditions: Where[] = relationshipFields.map((fieldName) => ({
      [fieldName]: {
        equals: id,
      },
    }))

    const where: undefined | Where =
      whereConditions.length === 1
        ? whereConditions[0]
        : whereConditions.length > 0
          ? { or: whereConditions }
          : undefined

    if (!where) {
      continue
    }

    try {
      results[relatedCollection.slug] = await payload.find({
        collection: relatedCollection.slug,
        depth,
        limit,
        page,
        req,
        where,
      })
    } catch (error) {
      // If query fails (permissions, etc), skip this collection
      req.payload.logger.warn({
        err: error,
        msg: `Failed to query ${relatedCollection.slug} for taxonomy ${collection.slug}:${id}`,
      })
    }
  }

  return results
}

/**
 * Find all collections that have relationship fields pointing to the target collection
 */
function findCollectionsWithRelationTo(
  collections: SanitizedCollectionConfig[],
  targetSlug: string,
): SanitizedCollectionConfig[] {
  return collections.filter((collection) => {
    if (collection.slug === targetSlug) {
      return false // Skip self
    }

    return findRelationshipFieldsTo(collection, targetSlug).length > 0
  })
}

/**
 * Find all relationship field names in a collection that point to the target collection
 */
function findRelationshipFieldsTo(
  collection: SanitizedCollectionConfig,
  targetSlug: string,
): string[] {
  const fieldNames: string[] = []

  function traverse(fields: SanitizedCollectionConfig['fields'], path: string = ''): void {
    for (const field of fields) {
      if (!field) {
        continue
      }

      // Only process fields that have a name property
      if (!('name' in field)) {
        continue
      }

      const fieldPath = path ? `${path}.${field.name}` : field.name

      if (field.type === 'relationship') {
        // Check if this relationship points to target
        const relationTo = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]

        if (relationTo.includes(targetSlug)) {
          fieldNames.push(field.name)
        }
      } else if (field.type === 'group' && field.fields) {
        traverse(field.fields, fieldPath)
      } else if (field.type === 'array' && field.fields) {
        traverse(field.fields, fieldPath)
      } else if (field.type === 'blocks' && field.blocks) {
        for (const block of field.blocks) {
          if (block.fields) {
            traverse(block.fields, `${fieldPath}.${block.slug}`)
          }
        }
      }
    }
  }

  traverse(collection.fields)

  return fieldNames
}
