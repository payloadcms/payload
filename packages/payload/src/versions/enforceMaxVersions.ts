import type { SanitizedCollectionConfig } from '../collections/config/types'
import type { SanitizedGlobalConfig } from '../globals/config/types'
import type { Payload } from '../payload'
import type { PayloadRequest } from '../types'
import type { Where } from '../types'

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
        pagination: false,
        req,
        skip: max,
        sort: '-updatedAt',
        where,
      }
      let query: any
      if (collection?.db?.findVersions) {
        query = await collection.db.findVersions(findVersionsDbArgs)
      } else {
        query = await payload.db.findVersions(findVersionsDbArgs)
      }

      ;[oldestAllowedDoc] = query.docs
    } else if (global) {
      const findGlobalVersionsDbArgs = {
        global: global.slug,
        req,
        skip: max,
        sort: '-updatedAt',
        where,
      }
      let query: any
      if (global?.db?.findGlobalVersions) {
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

      const deleteDbArgs = {
        collection: collection?.slug,
        req,
        where: deleteQuery,
      }

      if (collection?.db?.deleteVersions) {
        await collection.db.deleteVersions(deleteDbArgs)
      } else {
        await payload.db.deleteVersions(deleteDbArgs)
      }
    }
  } catch (err) {
    payload.logger.error(
      `There was an error cleaning up old versions for the ${entityType} ${slug}`,
    )
  }
}
