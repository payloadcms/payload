import type { PaginatedDocs, Payload, PayloadRequest } from '../index.js'

import { APIError } from '../errors/APIError.js'
import { combineWhereConstraints } from '../utilities/combineWhereConstraints.js'
import { canReadNestedDocsTree } from './canReadNestedDocsTree.js'

export type NestedDocRow = {
  ancestorContinues?: boolean[]
  depth: number
  hasChildren: boolean
  hasMore: boolean
  isExpanded: boolean
  isLastSibling?: boolean
  limit: number
  parentID: null | number | string
}

export async function getNestedDocsTreeMetadata({
  data,
  findArgs,
  parentFieldName,
  req,
}: {
  data: PaginatedDocs
  findArgs: Parameters<Payload['find']>[0]
  parentFieldName: string
  req: PayloadRequest
}): Promise<{ data: PaginatedDocs; rows: Record<string, NestedDocRow> }> {
  const collectionConfig = req.payload.collections?.[findArgs.collection]?.config

  if (collectionConfig && !canReadNestedDocsTree({ collectionConfig })) {
    throw new APIError(
      'Nested document trees require a parent field without read access restrictions',
      403,
    )
  }

  const rows: Record<string, NestedDocRow> = {}
  const requestedLimit = Number(findArgs.limit) || 10
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.floor(requestedLimit)) : 10

  for (let offset = 0; offset < data.docs.length; offset += 4) {
    await Promise.all(
      data.docs.slice(offset, offset + 4).map(async (doc) => {
        const children = await req.payload.find({
          ...findArgs,
          depth: 0,
          includeLockStatus: false,
          joins: false,
          limit: 1,
          overrideAccess: false,
          page: 1,
          pagination: false,
          req,
          select: { id: true },
          user: req.user,
          where: combineWhereConstraints([
            findArgs.where,
            { [parentFieldName]: { equals: doc.id } },
          ]),
        })

        rows[String(doc.id)] = {
          depth: 0,
          hasChildren: children.docs.length > 0,
          hasMore: false,
          isExpanded: false,
          limit,
          parentID: null,
        }
      }),
    )
  }

  return { data, rows }
}
