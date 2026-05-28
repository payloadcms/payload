import type {
  HierarchyViewData,
  PayloadRequest,
  RelatedDocumentsGrouped,
  SanitizedCollectionConfig,
  SanitizedPermissions,
  TypeWithID,
  Where,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { getAncestors } from 'payload'
import { combineWhereConstraints, DEFAULT_HIERARCHY_LIST_LIMIT } from 'payload/shared'

/**
 * Fetches hierarchy data for a collection with a selected parent.
 * Returns data that can be rendered client-side by HierarchyTable.
 */
export const handleHierarchy = async ({
  baseFilter,
  collectionConfig,
  collectionSlug,
  parentId,
  permissions,
  req,
  search,
  typeFilter,
  user,
}: {
  baseFilter?: null | Where
  collectionConfig: SanitizedCollectionConfig
  collectionSlug: string
  parentId: null | number | string
  permissions?: SanitizedPermissions
  req: PayloadRequest
  search?: string
  /** Filter hierarchy items by their collectionSpecific type field */
  typeFilter?: string[]
  user: PayloadRequest['user']
}): Promise<HierarchyViewData> => {
  const hierarchyConfig =
    collectionConfig.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined

  if (!hierarchyConfig) {
    throw new Error('Collection is not a hierarchy')
  }

  const parentFieldName = hierarchyConfig.parentFieldName

  const useAsTitle = collectionConfig.admin?.useAsTitle || 'id'

  let parent: null | (Record<string, unknown> & TypeWithID) = null
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

      parent = item
      breadcrumbs = ancestors
    } catch (_error) {
      req.payload.logger.warn({
        msg: `Hierarchy item not found: ${parentId}`,
      })
    }
  }

  // Build children where clause
  const parentCondition =
    parentId === null
      ? {
          or: [{ [parentFieldName]: { exists: false } }, { [parentFieldName]: { equals: null } }],
        }
      : { [parentFieldName]: { equals: parentId } }

  let typeCondition: Record<string, unknown> | undefined

  if (
    typeFilter &&
    typeFilter.length > 0 &&
    hierarchyConfig.collectionSpecific &&
    typeof hierarchyConfig.collectionSpecific === 'object'
  ) {
    const typeFieldName = hierarchyConfig.collectionSpecific.fieldName
    const filteredTypes = typeFilter.filter((t) => t !== collectionSlug)

    if (filteredTypes.length > 0) {
      typeCondition = {
        or: [{ [typeFieldName]: { in: filteredTypes } }, { [typeFieldName]: { exists: false } }],
      }
    }
  }

  const conditions: Record<string, unknown>[] = [parentCondition]

  if (search) {
    conditions.push({ [useAsTitle]: { like: search } })
  }

  if (typeCondition) {
    conditions.push(typeCondition)
  }

  const childrenWhere = conditions.length > 1 ? { and: conditions } : parentCondition

  const childrenData = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    draft: true,
    fallbackLocale: false,
    includeLockStatus: true,
    limit: DEFAULT_HIERARCHY_LIST_LIMIT,
    locale: req.locale,
    overrideAccess: false,
    page: 1,
    req,
    user,
    where: combineWhereConstraints([childrenWhere, baseFilter]),
  })

  const relatedDocumentsByCollection: RelatedDocumentsGrouped = {}
  const relatedBaseFilters: Record<string, Where> = {}

  const relatedCollectionsConfig = hierarchyConfig.relatedCollections || {}

  for (const [relatedSlug, fieldInfo] of Object.entries(relatedCollectionsConfig)) {
    if (relatedSlug === collectionSlug) {
      continue
    }

    const relatedCollectionConfig = req.payload.collections[relatedSlug]?.config
    if (!relatedCollectionConfig) {
      continue
    }

    if (!permissions?.collections?.[relatedSlug]?.read) {
      continue
    }

    const { fieldName, hasMany } = fieldInfo

    const relatedBaseFilter = await (
      relatedCollectionConfig.admin?.baseFilter ?? relatedCollectionConfig.admin?.baseListFilter
    )?.({
      limit: DEFAULT_HIERARCHY_LIST_LIMIT,
      page: 1,
      req,
      sort: undefined,
    })

    if (relatedBaseFilter) {
      relatedBaseFilters[relatedSlug] = relatedBaseFilter
    }

    let relationshipWhere: Record<string, unknown>

    if (parentId === null) {
      const rootConditions: Record<string, unknown>[] = [
        { [fieldName]: { exists: false } },
        { [fieldName]: { equals: null } },
      ]
      if (hasMany) {
        rootConditions.push({ [fieldName]: { equals: [] } })
      }
      relationshipWhere = { or: rootConditions }
    } else {
      // "in" operator works for both hasMany and single relationship fields
      relationshipWhere = {
        [fieldName]: { in: [parentId] },
      }
    }

    const relatedUseAsTitle = relatedCollectionConfig.admin?.useAsTitle || 'id'
    const whereWithSearch = search
      ? { and: [relationshipWhere, { [relatedUseAsTitle]: { like: search } }] }
      : relationshipWhere

    const where = combineWhereConstraints([whereWithSearch, relatedBaseFilter])

    try {
      const data = await req.payload.find({
        collection: relatedSlug,
        depth: 0,
        draft: true,
        fallbackLocale: false,
        includeLockStatus: true,
        limit: DEFAULT_HIERARCHY_LIST_LIMIT,
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

  // Extract allowed collections from parent's collectionSpecific field
  let allowedCollections: Array<{ label: string; slug: string }> | undefined

  if (hierarchyConfig.collectionSpecific && parent) {
    const typeFieldName = hierarchyConfig.collectionSpecific.fieldName
    const typeValues = parent[typeFieldName] as null | string[] | undefined

    if (typeValues && typeValues.length > 0) {
      allowedCollections = typeValues.map((slug) => {
        const config = req.payload.collections[slug]?.config
        const label = config ? getTranslation(config.labels?.plural, req.i18n) : slug
        return { slug, label }
      })
    } else {
      allowedCollections = []
    }
  }

  return {
    allowedCollections,
    breadcrumbs,
    childrenData,
    parent,
    parentFieldName,
    parentId,
    relatedBaseFilters: Object.keys(relatedBaseFilters).length > 0 ? relatedBaseFilters : undefined,
    relatedDocumentsByCollection,
  }
}
