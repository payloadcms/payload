import {
  type AllOperations,
  combineQueries,
  type DefaultDocumentIDType,
  type PayloadRequest,
  type Where,
} from '../../index.js'

/**
 * Returns whether or not the entity doc exists based on the where query.
 */
export async function entityDocExists({
  id,
  slug,
  entityType,
  locale,
  operation,
  req,
  where,
}: {
  entityType: 'collection' | 'global'
  id?: DefaultDocumentIDType
  locale?: string
  operation?: AllOperations
  req: PayloadRequest
  slug: string
  where: Where
}): Promise<boolean> {
  if (entityType === 'global') {
    const global = await req.payload.db.findGlobal({
      slug,
      locale,
      req,
      select: {},
      where,
    })

    const hasGlobalDoc = Boolean(global && Object.keys(global).length > 0)

    return hasGlobalDoc
  }

  if (entityType === 'collection' && id) {
    if (operation === 'readVersions') {
      const count = await req.payload.db.countVersions({
        collection: slug,
        locale,
        req,
        where: combineQueries(where, { parent: { equals: id } }),
      })
      return count.totalDocs > 0
    }

    const count = await req.payload.db.count({
      collection: slug,
      locale,
      req,
      where: combineQueries(where, { id: { equals: id } }),
    })

    return count.totalDocs > 0
  }

  return false
}
