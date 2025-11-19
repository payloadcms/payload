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
  stats,
  where,
}: {
  entityType: 'collection' | 'global'
  id?: DefaultDocumentIDType
  locale?: string
  operation?: AllOperations
  req: PayloadRequest
  slug: string
  stats: PermissionStats
  where: Where
}): Promise<boolean> {
  if (entityType === 'global') {
    if (stats) {
      stats.whereQueryCalls++
      stats.totalCalls++
      if (process.env.DEBUG_PERMS) {
        console.log(`[NEW] Where query call for ${slug}, operation: ${operation}`)
      }
    }
    // TODO: Write test (should be broken in prev version since we just find without where?),
    // perf optimize (returning false or countGlobal or db.globalExists?)
    const global = await req.payload.db.findGlobal({
      slug,
      locale,
      req,
      where: combineQueries(where, { id: { equals: id } }),
    })
    return Boolean(global)
  }

  if (entityType === 'collection' && id) {
    if (operation === 'readVersions') {
      if (stats) {
        stats.whereQueryCalls++
        stats.totalCalls++
        if (process.env.DEBUG_PERMS) {
          console.log(`[NEW] Where query call for ${slug}, operation: ${operation}`)
        }
      }
      const count = await req.payload.db.countVersions({
        collection: slug,
        locale,
        req,
        where: combineQueries(where, { parent: { equals: id } }),
      })
      return count.totalDocs > 0
    }
    if (stats) {
      stats.whereQueryCalls++
      stats.totalCalls++
      if (process.env.DEBUG_PERMS) {
        console.log(`[NEW] Where query call for ${slug}, operation: ${operation}`)
      }
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
