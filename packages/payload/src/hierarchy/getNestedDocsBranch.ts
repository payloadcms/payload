import type { ListQuery } from '../admin/functions/index.js'
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Payload, PayloadRequest } from '../index.js'

import { APIError } from '../errors/APIError.js'
import { combineWhereConstraints } from '../utilities/combineWhereConstraints.js'
import { canReadNestedDocsTree } from './canReadNestedDocsTree.js'
import { getNestedDocsTreeMetadata } from './getNestedDocsTreeMetadata.js'

export async function getNestedDocsBranch({
  collectionConfig,
  parentID,
  query,
  req,
  select,
}: {
  collectionConfig: SanitizedCollectionConfig
  parentID: null | number | string
  query?: ListQuery
  req: PayloadRequest
  select?: Parameters<Payload['find']>[0]['select']
}) {
  if (!collectionConfig.nestedDocs || !collectionConfig.hierarchy) {
    throw new APIError('Collection does not support nested documents', 400)
  }

  if (!canReadNestedDocsTree({ collectionConfig })) {
    throw new APIError(
      'Nested document trees require a parent field without read access restrictions',
      403,
    )
  }

  const limit = Math.min(100, Math.max(1, Math.floor(Number(query?.limit) || 10)))
  const page = Math.max(1, Math.floor(Number(query?.page) || 1))

  if (
    !Number.isFinite(page) ||
    (parentID !== null && typeof parentID !== 'string' && typeof parentID !== 'number') ||
    (typeof parentID === 'number' && !Number.isFinite(parentID))
  ) {
    throw new APIError('Invalid branch query', 400)
  }

  const sort = query?.sort ?? collectionConfig.defaultSort
  const locale = req.locale === 'all' ? undefined : req.locale
  const baseFilter = await (
    collectionConfig.admin.baseFilter ?? collectionConfig.admin.baseListFilter
  )?.({
    limit,
    locale,
    page,
    req,
    sort: Array.isArray(sort) ? sort.join(',') : (sort ?? ''),
  })
  const parentFieldName = collectionConfig.hierarchy.parentFieldName
  const visibilityWhere = combineWhereConstraints([baseFilter ?? undefined, query?.where])
  const branchWhere =
    parentID === null
      ? { or: [{ [parentFieldName]: { equals: null } }, { [parentFieldName]: { exists: false } }] }
      : { [parentFieldName]: { equals: parentID } }
  const findArgs = {
    collection: collectionConfig.slug,
    depth: 0,
    draft: true,
    fallbackLocale: false as const,
    includeLockStatus: true,
    limit,
    locale,
    overrideAccess: false,
    req,
    select,
    sort,
    user: req.user,
  }
  const data = await req.payload.find({
    ...findArgs,
    page,
    where: combineWhereConstraints([visibilityWhere, branchWhere]),
  })

  return getNestedDocsTreeMetadata({
    data,
    findArgs: { ...findArgs, where: visibilityWhere },
    parentFieldName,
    req,
  })
}
