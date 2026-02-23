import type {
  HierarchyViewData,
  PayloadRequest,
  RelatedDocumentsGrouped,
  SanitizedCollectionConfig,
  SanitizedPermissions,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { getAncestors, HIERARCHY_PARENT_FIELD } from 'payload'

/**
 * Fetches hierarchy data for a collection with a selected parent.
 * Returns data that can be rendered client-side by HierarchyTable.
 */
export const handleHierarchy = async ({
  collectionConfig,
  collectionSlug,
  parentId,
  permissions,
  req,
  search,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  collectionSlug: string
  parentId: null | number | string
  permissions?: SanitizedPermissions
  req: PayloadRequest
  search?: string
  user: PayloadRequest['user']
}): Promise<HierarchyViewData> => {
  const hierarchyConfig =
    collectionConfig.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined

  if (!hierarchyConfig) {
    throw new Error('Collection is not a hierarchy')
  }

  const parentFieldName = hierarchyConfig.parentFieldName ?? HIERARCHY_PARENT_FIELD

  const useAsTitle = collectionConfig.admin?.useAsTitle || 'id'

  // Fetch the selected parent item and breadcrumbs (skip for root level)
  let selectedItem: null | Record<string, unknown> = null
  let breadcrumbs: Array<{ id: number | string; title: string }> = []

  if (parentId !== null) {
    try {
      const [item, ancestors] = await Promise.all([
        req.payload.findByID({
          id: parentId,
          collection: collectionSlug,
          depth: 0,
          overrideAccess: false,
          req,
          user,
        }),
        getAncestors({
          id: parentId,
          collectionSlug,
          req,
        }),
      ])

      selectedItem = item
      breadcrumbs = ancestors
    } catch (_error) {
      req.payload.logger.warn({
        msg: `Hierarchy item not found: ${parentId}`,
      })
    }
  }

  // Build children where clause
  // For root level (parentId is null), find items without a parent
  // For nested level, find items with this specific parent
  const parentCondition =
    parentId === null
      ? {
          or: [{ [parentFieldName]: { exists: false } }, { [parentFieldName]: { equals: null } }],
        }
      : { [parentFieldName]: { equals: parentId } }

  const childrenWhere = search
    ? {
        and: [parentCondition, { [useAsTitle]: { like: search } }],
      }
    : parentCondition

  // Fetch children (hierarchy items with this parent, or root items if parentId is null)
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
    user,
    where: childrenWhere,
  })

  // Fetch related documents from other collections
  // At root level: show unassigned documents (where hierarchy field doesn't exist)
  // At nested level: show documents assigned to the selected hierarchy item
  const relatedDocumentsByCollection: RelatedDocumentsGrouped = {}

  // Use pre-computed relatedCollections from sanitized hierarchy config
  const relatedCollectionsConfig = hierarchyConfig.relatedCollections || {}

  for (const [relatedSlug, fieldInfo] of Object.entries(relatedCollectionsConfig)) {
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

    const { fieldName, hasMany } = fieldInfo

    // Build where clause based on whether we're at root or nested level
    let relationshipWhere: Record<string, unknown>

    if (parentId === null) {
      // Root level: find documents where hierarchy field doesn't exist, is null, or is empty array
      const conditions: Record<string, unknown>[] = [
        { [fieldName]: { exists: false } },
        { [fieldName]: { equals: null } },
      ]
      if (hasMany) {
        // hasMany fields store cleared values as empty arrays
        conditions.push({ [fieldName]: { equals: [] } })
      }
      relationshipWhere = { or: conditions }
    } else {
      // Nested level: find documents assigned to this hierarchy item
      // "in" operator works for both hasMany and single relationship fields
      relationshipWhere = {
        [fieldName]: { in: [parentId] },
      }
    }

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
        user,
        where,
      })

      if (data.totalDocs > 0) {
        relatedDocumentsByCollection[relatedSlug] = {
          hasMany,
          label: getTranslation(relatedCollectionConfig.labels?.plural, req.i18n),
          result: data,
        }
      }
    } catch (error) {
      req.payload.logger.warn({
        err: error,
        msg: `Failed to query related collection ${relatedSlug}`,
      })
    }
  }

  return {
    breadcrumbs,
    childrenData,
    parentFieldName,
    parentId,
    relatedDocumentsByCollection,
    selectedItem,
  }
}
