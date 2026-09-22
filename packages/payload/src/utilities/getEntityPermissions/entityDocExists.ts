import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import {
  type AllOperations,
  combineQueries,
  type DefaultDocumentIDType,
  type PayloadRequest,
  type Where,
} from '../../index.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields.js'

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
    if (operation === 'readVersions') {
      const global = req.payload.globals.config.find(({ slug: globalSlug }) => globalSlug === slug)

      if (!global) {
        return false
      }

      sanitizeWhereQuery({
        fields: buildVersionGlobalFields(req.payload.config, global, true),
        payload: req.payload,
        where,
      })

      const count = await req.payload.db.countGlobalVersions({
        global: slug,
        locale,
        req,
        where,
      })

      return count.totalDocs > 0
    }

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
      const collection = req.payload.collections[slug]?.config

      if (!collection) {
        return false
      }

      const fullWhere = combineQueries(where, { parent: { equals: id } })

      sanitizeWhereQuery({
        fields: buildVersionCollectionFields(req.payload.config, collection, true),
        payload: req.payload,
        where: fullWhere,
      })

      const count = await req.payload.db.countVersions({
        collection: slug,
        locale,
        req,
        where: fullWhere,
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
