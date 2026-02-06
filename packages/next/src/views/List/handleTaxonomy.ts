import type {
  Field,
  PaginatedDocs,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedPermissions,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'

export type RelatedDocumentsGrouped = {
  [collectionSlug: string]: {
    data: PaginatedDocs
    label: string
  }
}

export type TaxonomyViewData = {
  /** Breadcrumb trail to the current parent */
  breadcrumbs: Array<{ id: number | string; title: string }>
  /** Children of the current parent (same collection) */
  childrenData: PaginatedDocs
  /** The parent field name for building queries */
  parentFieldName: string
  /** Related documents grouped by collection */
  relatedDocuments: RelatedDocumentsGrouped
  /** The selected parent item (for display) */
  selectedItem: null | Record<string, unknown>
}

/**
 * Fetches taxonomy data for a collection with a selected parent.
 * Returns data that can be rendered client-side by TaxonomyTable.
 */
export const handleTaxonomy = async ({
  collectionConfig,
  collectionSlug,
  parentId,
  permissions,
  req,
  search,
}: {
  collectionConfig: SanitizedCollectionConfig
  collectionSlug: string
  parentId: number | string
  permissions?: SanitizedPermissions
  req: PayloadRequest
  search?: string
}): Promise<TaxonomyViewData> => {
  const taxonomyConfig = collectionConfig.taxonomy
  if (!taxonomyConfig) {
    throw new Error('Collection is not a taxonomy')
  }

  const parentFieldName =
    typeof taxonomyConfig === 'object' ? taxonomyConfig.parentFieldName || 'parent' : 'parent'

  const useAsTitle = collectionConfig.admin?.useAsTitle || 'id'

  // Fetch the selected parent item
  let selectedItem: null | Record<string, unknown> = null
  let breadcrumbs: Array<{ id: number | string; title: string }> = []

  try {
    selectedItem = await req.payload.findByID({
      id: parentId,
      collection: collectionSlug,
      depth: 0,
      req,
    })

    // Build breadcrumbs from the taxonomy path if available
    if (selectedItem) {
      const titlePathField =
        typeof taxonomyConfig === 'object' ? taxonomyConfig.titlePathFieldName : undefined

      if (titlePathField && Array.isArray(selectedItem[titlePathField])) {
        breadcrumbs = (selectedItem[titlePathField] as Array<{ doc: string; label: string }>).map(
          (item) => ({
            id: item.doc,
            title: item.label,
          }),
        )
      } else {
        // Fallback: just show the current item
        const rawTitle = selectedItem[useAsTitle] || selectedItem.id || parentId
        let title: string
        if (rawTitle && typeof rawTitle === 'object') {
          title = JSON.stringify(rawTitle)
        } else if (typeof rawTitle === 'string') {
          title = rawTitle
        } else if (typeof rawTitle === 'number') {
          title = String(rawTitle)
        } else {
          title = String(parentId)
        }
        breadcrumbs = [
          {
            id: parentId,
            title,
          },
        ]
      }
    }
  } catch (_error) {
    req.payload.logger.warn({
      msg: `Taxonomy item not found: ${parentId}`,
    })
  }

  // Build children where clause
  const childrenWhere = search
    ? {
        and: [{ [parentFieldName]: { equals: parentId } }, { [useAsTitle]: { like: search } }],
      }
    : { [parentFieldName]: { equals: parentId } }

  // Fetch children (taxonomy items with this parent)
  const childrenData = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    draft: true,
    fallbackLocale: false,
    includeLockStatus: true,
    limit: 10,
    locale: req.locale,
    overrideAccess: false,
    page: 1,
    req,
    where: childrenWhere,
  })

  // Fetch related documents from other collections
  const relatedDocuments: RelatedDocumentsGrouped = {}

  if (selectedItem) {
    const relatedCollections =
      typeof taxonomyConfig === 'object' ? taxonomyConfig.relatedCollections || [] : []

    // Auto-detect related collections if not specified
    const collectionsToQuery =
      relatedCollections.length > 0
        ? relatedCollections
        : findCollectionsWithRelationTo(req.payload.config.collections, collectionSlug)

    for (const relatedSlug of collectionsToQuery) {
      if (relatedSlug === collectionSlug) {
        continue
      }

      const relatedCollectionConfig = req.payload.collections[relatedSlug]?.config
      if (!relatedCollectionConfig) {
        continue
      }

      // Check if user has read permission for this collection
      if (!permissions?.collections?.[relatedSlug]?.read) {
        continue
      }

      // Find relationship fields that point to this taxonomy
      const relationshipFields = findRelationshipFieldsTo(relatedCollectionConfig, collectionSlug)
      if (relationshipFields.length === 0) {
        continue
      }

      // Build where clause
      const whereConditions = relationshipFields.map(({ fieldName, hasMany }) => ({
        [fieldName]: hasMany ? { contains: parentId } : { equals: parentId },
      }))

      const relationshipWhere =
        whereConditions.length === 1 ? whereConditions[0] : { or: whereConditions }

      // Add search filter if provided
      const relatedUseAsTitle = relatedCollectionConfig.admin?.useAsTitle || 'id'
      const where = search
        ? { and: [relationshipWhere, { [relatedUseAsTitle]: { like: search } }] }
        : relationshipWhere

      try {
        const data = await req.payload.find({
          collection: relatedSlug,
          depth: 0,
          draft: true,
          fallbackLocale: false,
          includeLockStatus: true,
          limit: 10,
          locale: req.locale,
          overrideAccess: false,
          page: 1,
          req,
          where,
        })

        if (data.totalDocs > 0) {
          relatedDocuments[relatedSlug] = {
            data,
            label: getTranslation(relatedCollectionConfig.labels?.plural, req.i18n),
          }
        }
      } catch (error) {
        req.payload.logger.warn({
          err: error,
          msg: `Failed to query related collection ${relatedSlug}`,
        })
      }
    }
  }

  return {
    breadcrumbs,
    childrenData,
    parentFieldName,
    relatedDocuments,
    selectedItem,
  }
}

/**
 * Find all collections that have relationship fields pointing to the target collection
 */
function findCollectionsWithRelationTo(
  collections: Array<{ fields: Field[]; slug: string }>,
  targetSlug: string,
): string[] {
  return collections
    .filter((collection) => {
      if (collection.slug === targetSlug) {
        return false
      }
      return findRelationshipFieldsTo(collection, targetSlug).length > 0
    })
    .map((c) => c.slug)
}

type RelationshipFieldInfo = {
  fieldName: string
  hasMany: boolean
}

/**
 * Find all relationship fields in a collection that point to the target collection
 */
function findRelationshipFieldsTo(
  collection: { fields: Field[] },
  targetSlug: string,
): RelationshipFieldInfo[] {
  const fields: RelationshipFieldInfo[] = []

  function traverse(fieldList: Field[]): void {
    for (const field of fieldList) {
      if (!field || typeof field !== 'object' || !('name' in field)) {
        continue
      }

      const f = field

      if (f.type === 'relationship') {
        const relationTo = Array.isArray(f.relationTo) ? f.relationTo : [f.relationTo]
        if (relationTo.includes(targetSlug)) {
          fields.push({
            fieldName: f.name,
            hasMany: f.hasMany === true,
          })
        }
      } else if (f.type === 'group' && Array.isArray(f.fields)) {
        traverse(f.fields)
      } else if (f.type === 'array' && Array.isArray(f.fields)) {
        traverse(f.fields)
      } else if (f.type === 'blocks' && Array.isArray(f.blocks)) {
        for (const block of f.blocks) {
          if (
            block &&
            typeof block === 'object' &&
            'fields' in block &&
            Array.isArray(block.fields)
          ) {
            traverse(block.fields)
          }
        }
      }
    }
  }

  traverse(collection.fields)
  return fields
}
