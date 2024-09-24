import type { SanitizedCollectionConfig } from '../collections/config/types.js'
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
  global,
  max,
  payload,
  req,
}: Args): Promise<void> => {
  const entityType = collection ? 'collection' : 'global'
  const slug = collection ? collection.slug : global?.slug

  try {
    const where: Where = {}
    let oldestAllowedDoc

    if (collection) {
      where.parent = {
        equals: id,
      }

      const findVersionsDbArgs = {
        collection: collection.slug,
        limit: 1,
        pagination: false,
        req,
        skip: max,
        sort: '-updatedAt',
        where,
      }
      let query: any
      // @ts-expect-error exists
      if (collection?.db?.findVersions) {
        // @ts-expect-error exists
        query = await collection.db.findVersions(findVersionsDbArgs)
      } else {
        query = await payload.db.findVersions(findVersionsDbArgs)
      }

      ;[oldestAllowedDoc] = query.docs
    } else if (global) {
      const findGlobalVersionsDbArgs = {
        global: global.slug,
        limit: 1,
        pagination: false,
        req,
        skip: max,
        sort: '-updatedAt',
        where,
      }
      let query: any
      // @ts-expect-error exists
      if (global?.db?.findGlobalVersions) {
        // @ts-expect-error exists
        query = await global.db.findGlobalVersions(findGlobalVersionsDbArgs)
      } else {
        query = await payload.db.findGlobalVersions(findGlobalVersionsDbArgs)
      }

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

      await payload.db.deleteVersions({
        collection: slug,
        req,
        where: deleteQuery,
      })
    }
  } catch (err) {
    payload.logger.error(
      `There was an error cleaning up old versions for the ${entityType} ${slug}`,
    )
  }
}
