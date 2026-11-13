import type { PaginatedDocs } from '../database/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { APIError } from '../errors/APIError.js'
import { Forbidden } from '../errors/Forbidden.js'
import { NotFound } from '../errors/NotFound.js'
import { combineWhereConstraints } from '../utilities/combineWhereConstraints.js'

export type HierarchyContentsSource = {
  collectionSlug: string
  docs: PaginatedDocs['docs']
  hasNextPage: boolean
  page: number
  totalDocs: number
  totalPages: number
}

export type HierarchyContents = {
  parentID: null | number | string
  sources: HierarchyContentsSource[]
}

/** Read one folder branch through each source collection's normal access and hook pipeline. */
export async function getHierarchyContents({
  collectionSlug,
  limit = 10,
  page = 1,
  parentID = null,
  req,
  search,
  source,
}: {
  collectionSlug: string
  limit?: number
  page?: number
  parentID?: null | number | string
  req: PayloadRequest
  search?: string
  source?: string
}): Promise<HierarchyContents> {
  if (!req.user) {
    throw new Forbidden(req.t)
  }

  const collection = req.payload.collections[collectionSlug]?.config
  const hierarchy = collection?.hierarchy

  if (
    !hierarchy ||
    typeof hierarchy !== 'object' ||
    hierarchy.allowHasMany ||
    collection.nestedDocs
  ) {
    throw new APIError('Folder contents require a folder hierarchy collection.', 400)
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 40 ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000 ||
    (parentID !== null &&
      !(
        (typeof parentID === 'string' && parentID.length > 0 && parentID.length <= 200) ||
        (typeof parentID === 'number' && Number.isFinite(parentID))
      )) ||
    (search !== undefined && (typeof search !== 'string' || search.length > 200)) ||
    (source !== undefined && typeof source !== 'string')
  ) {
    throw new APIError('Invalid folder contents query.', 400)
  }

  const sources = {
    [collectionSlug]: { fieldName: hierarchy.parentFieldName, hasMany: false },
    ...hierarchy.relatedCollections,
  }

  if (source !== undefined && !Object.hasOwn(sources, source)) {
    throw new APIError('Unknown folder contents source.', 400)
  }

  const getBaseFilter = async ({ slug }: { slug: string }) => {
    const config = req.payload.collections[slug]?.config

    return (config?.admin.baseFilter ?? config?.admin.baseListFilter)?.({
      limit,
      page,
      req,
      sort: 'id',
    })
  }
  const baseFilter = await getBaseFilter({ slug: collectionSlug })

  // Reading the containing folder is required even when another source permits its documents.
  // Applying the Admin base filter also prevents direct links from reopening a hidden branch.
  const parent = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    draft: true,
    joins: false,
    limit: 1,
    locale: req.locale,
    overrideAccess: false,
    req,
    select: { id: true },
    sort: 'id',
    user: req.user,
    where: combineWhereConstraints([
      parentID === null ? undefined : { id: { equals: parentID } },
      baseFilter ?? undefined,
    ]),
  })

  if (parentID !== null && !parent.docs.length) {
    throw new NotFound(req.t)
  }

  const result: HierarchyContents = { parentID, sources: [] }

  // Sequential sources keep request cost and database concurrency bounded by configuration.
  for (const [slug, fieldInfo] of Object.entries(sources)) {
    if (source !== undefined && slug !== source) {
      continue
    }

    const config = req.payload.collections[slug]?.config
    if (!config) {
      continue
    }

    const membershipField = config.flattenedFields.find(
      (field) => 'name' in field && field.name === fieldInfo.fieldName,
    )

    // A filtered result can reveal membership even when the field itself is stripped. Until
    // per-document membership visibility can be proved, omit sources with a field read rule.
    if (!membershipField || membershipField.access?.read) {
      continue
    }

    const titleField = config.admin.useAsTitle || 'id'
    const titleConfig = config.flattenedFields.find(
      (field) => 'name' in field && field.name === titleField,
    )
    const hasUpdatedAt = config.flattenedFields.some(
      (field) => 'name' in field && field.name === 'updatedAt',
    )
    const relationshipWhere: Where =
      parentID === null
        ? {
            or: [
              { [fieldInfo.fieldName]: { exists: false } },
              { [fieldInfo.fieldName]: { equals: null } },
              ...(fieldInfo.hasMany ? [{ [fieldInfo.fieldName]: { equals: [] } }] : []),
            ],
          }
        : { [fieldInfo.fieldName]: { in: [parentID] } }

    try {
      const data = await req.payload.find({
        collection: slug,
        depth: 0,
        draft: true,
        fallbackLocale: false,
        joins: false,
        limit,
        locale: req.locale,
        overrideAccess: false,
        page,
        req,
        select: { id: true, [titleField]: true, ...(hasUpdatedAt ? { updatedAt: true } : {}) },
        sort: titleField === 'id' || titleConfig?.access?.read ? 'id' : [titleField, 'id'],
        user: req.user,
        where: combineWhereConstraints([
          relationshipWhere,
          (slug === collectionSlug ? baseFilter : await getBaseFilter({ slug })) ?? undefined,
          search ? { [titleField]: { like: search } } : undefined,
        ]),
      })

      result.sources.push({
        collectionSlug: slug,
        docs: data.docs,
        hasNextPage: data.hasNextPage,
        page: data.page ?? page,
        totalDocs: data.totalDocs,
        totalPages: data.totalPages,
      })
    } catch (error) {
      if (!(error instanceof Forbidden)) {
        throw error
      }
    }
  }

  return result
}
