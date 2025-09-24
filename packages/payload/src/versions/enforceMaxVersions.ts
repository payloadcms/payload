import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { DeleteVersionsArgs } from '../database/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload, PayloadRequest, Where } from '../types/index.js'

type Args = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  max: number
  payload: Payload
  req?: PayloadRequest
}

export const enforceMaxVersions = async ({
  id,
  collection,
  global: globalConfig,
  max,
  payload,
  req,
}: Args): Promise<void> => {
  const entityType = collection ? 'collection' : 'global'
  const slug = collection ? collection.slug : globalConfig?.slug

  try {
    const where: Where = {}
    let oldestAllowedDoc

    if (collection) {
      where.parent = {
        equals: id,
      }

      const query = await payload.db.findVersions({
        collection: collection.slug,
        limit: 1,
        pagination: false,
        req,
        skip: max,
        sort: '-updatedAt',
        where,
      })

      ;[oldestAllowedDoc] = query.docs
    } else if (globalConfig) {
      const query = await payload.db.findGlobalVersions({
        global: globalConfig.slug,
        limit: 1,
        pagination: false,
        req,
        skip: max,
        sort: '-updatedAt',
        where,
      })

      ;[oldestAllowedDoc] = query.docs
    }

    if (oldestAllowedDoc?.updatedAt) {
      const deleteQuery: Where = {
        updatedAt: {
          less_than_equal: oldestAllowedDoc.updatedAt,
        },
      }

      if (collection) {
        deleteQuery.parent = {
          equals: id,
        }
      }

      const deleteVersionsArgs: DeleteVersionsArgs = { req, where: deleteQuery }

      if (globalConfig) {
        deleteVersionsArgs.globalSlug = slug
      } else {
        deleteVersionsArgs.collection = slug
      }

      await payload.db.deleteVersions(deleteVersionsArgs)
    }
  } catch (err) {
    payload.logger.error(err)
    payload.logger.error(
      `There was an error cleaning up old versions for the ${entityType} ${slug}`,
    )
  }
}
