import type { PaginatedDocs } from '../database/types.js'
import type { JsonObject, PayloadRequest, Sort, Where } from '../types/index.js'
import type { SanitizedHierarchyRelatedCollection } from './types.js'

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
  allowedCollections?: string[]
  parentID: null | number | string
  sources: HierarchyContentsSource[]
}

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

  if (
    typeof collectionSlug !== 'string' ||
    collectionSlug.length === 0 ||
    collectionSlug.length > 200
  ) {
    throw new APIError('Invalid hierarchy contents collection.', 400)
  }

  const collection = req.payload.collections[collectionSlug]?.config
  const hierarchy = collection?.hierarchy

  if (
    !hierarchy ||
    typeof hierarchy !== 'object' ||
    hierarchy.allowHasMany !== false ||
    collection.nestedDocs
  ) {
    throw new APIError('Contents require a single-assignment hierarchy collection.', 400)
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
    throw new APIError('Invalid hierarchy contents query.', 400)
  }

  const sources = new Map<string, SanitizedHierarchyRelatedCollection>([
    [collectionSlug, { fieldName: hierarchy.parentFieldName, hasMany: false }],
    ...Object.entries(hierarchy.relatedCollections).filter(([slug]) => slug !== collectionSlug),
  ])

  if (source !== undefined && !sources.has(source)) {
    throw new APIError('Unknown hierarchy contents source.', 400)
  }

  const getBaseFilter = async ({ slug, sort = 'id' }: { slug: string; sort?: Sort }) => {
    const config = req.payload.collections[slug]?.config

    return (config?.admin.baseFilter ?? config?.admin.baseListFilter)?.({
      limit,
      page,
      req,
      sort: Array.isArray(sort) ? sort.join(',') : sort,
    })
  }
  const baseFilter = await getBaseFilter({ slug: collectionSlug })
  const parent = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    draft: true,
    joins: false,
    limit: 1,
    locale: req.locale,
    overrideAccess: false,
    req,
    select: {
      id: true,
      ...(hierarchy.collectionSpecific ? { [hierarchy.collectionSpecific.fieldName]: true } : {}),
    },
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

  const parentDoc: JsonObject | undefined = parent.docs[0]
  const allowedTypes =
    parentID !== null && hierarchy.collectionSpecific
      ? parentDoc?.[hierarchy.collectionSpecific.fieldName]
      : undefined
  const result: HierarchyContents = {
    ...(Array.isArray(allowedTypes)
      ? {
          allowedCollections: allowedTypes.filter(
            (value): value is string => typeof value === 'string',
          ),
        }
      : {}),
    parentID,
    sources: [],
  }

  for (const [slug, fieldInfo] of sources) {
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
    if (!membershipField || membershipField.access?.read) {
      continue
    }

    const titleField = config.admin.useAsTitle || 'id'
    const titleConfig = config.flattenedFields.find(
      (field) => 'name' in field && field.name === titleField,
    )
    const sort: Sort = titleField === 'id' || titleConfig?.access?.read ? 'id' : [titleField, 'id']
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
        includeLockStatus: true,
        joins: false,
        limit,
        locale: req.locale,
        overrideAccess: false,
        page,
        req,
        select: {
          id: true,
          [titleField]: true,
          ...(hasUpdatedAt ? { updatedAt: true } : {}),
          ...(slug === collectionSlug && hierarchy.collectionSpecific
            ? { [hierarchy.collectionSpecific.fieldName]: true }
            : {}),
        },
        sort,
        user: req.user,
        where: combineWhereConstraints([
          relationshipWhere,
          (await getBaseFilter({ slug, sort })) ?? undefined,
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
