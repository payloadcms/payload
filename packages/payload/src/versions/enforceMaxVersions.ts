import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { DeleteVersionsArgs } from '../database/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload, PayloadRequest, Where } from '../types/index.js'

import {
  collectVersionFiles,
  scheduleUnreferencedFileCleanup,
} from '../uploads/fileVersioning/cleanup.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'

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
    const entity = collection ?? globalConfig
    const draftsEnabled = Boolean(entity && hasDraftsEnabled(entity))

    let latestDraftId: number | string | undefined

    if (draftsEnabled) {
      if (collection && id !== undefined) {
        const latestResult = await payload.db.findVersions({
          collection: collection.slug,
          limit: 1,
          pagination: false,
          req,
          where: {
            and: [{ parent: { equals: id } }, { latest: { equals: true } }],
          },
        })
        const latestDoc = latestResult.docs[0]
        const status = latestDoc?.version?._status
        const isDraft =
          typeof status === 'string'
            ? status === 'draft'
            : typeof status === 'object' && status !== null
              ? Object.values(status).some((s) => s === 'draft')
              : false
        if (isDraft && latestDoc) {
          latestDraftId = latestDoc.id
        }
      } else if (globalConfig) {
        const latestResult = await payload.db.findGlobalVersions({
          global: globalConfig.slug,
          limit: 1,
          pagination: false,
          req,
          where: {
            latest: { equals: true },
          },
        })
        const latestDoc = latestResult.docs[0]
        const status = latestDoc?.version?._status
        const isDraft =
          typeof status === 'string'
            ? status === 'draft'
            : typeof status === 'object' && status !== null
              ? Object.values(status).some((s) => s === 'draft')
              : false
        if (isDraft && latestDoc) {
          latestDraftId = latestDoc.id
        }
      }
    }

    const where: Where = {}
    if (collection) {
      where.parent = {
        equals: id,
      }
    }

    const queryWhere: Where = { ...where }
    if (latestDraftId !== undefined) {
      queryWhere.id = {
        not_equals: latestDraftId,
      }
    }

    let oldestAllowedDoc

    if (collection) {
      const query = await payload.db.findVersions({
        collection: collection.slug,
        limit: 1,
        page: max + 1,
        pagination: false,
        req,
        sort: '-updatedAt',
        where: queryWhere,
      })

      ;[oldestAllowedDoc] = query.docs
    } else if (globalConfig) {
      const query = await payload.db.findGlobalVersions({
        global: globalConfig.slug,
        limit: 1,
        page: max + 1,
        pagination: false,
        req,
        sort: '-updatedAt',
        where: queryWhere,
      })

      ;[oldestAllowedDoc] = query.docs
    }

    if (oldestAllowedDoc?.updatedAt) {
      const deleteConditions: Where[] = [
        {
          updatedAt: {
            less_than_equal: oldestAllowedDoc.updatedAt,
          },
        },
      ]

      if (collection) {
        deleteConditions.push({
          parent: {
            equals: id,
          },
        })
      }

      if (latestDraftId !== undefined) {
        deleteConditions.push({
          id: {
            not_equals: latestDraftId,
          },
        })
        deleteConditions.push({
          or: [
            {
              latest: {
                not_equals: true,
              },
            },
            {
              latest: {
                exists: false,
              },
            },
          ],
        })
      }

      const deleteQuery: Where =
        deleteConditions.length === 1 ? deleteConditions[0]! : { and: deleteConditions }

      const deleteVersionsArgs: DeleteVersionsArgs = { req, where: deleteQuery }

      if (globalConfig) {
        deleteVersionsArgs.globalSlug = slug
      } else {
        deleteVersionsArgs.collection = slug
      }

      const removedFiles =
        collection?.upload && id !== undefined && req
          ? await collectVersionFiles({ collection, parentID: id, req, where: deleteQuery })
          : []

      await payload.db.deleteVersions(deleteVersionsArgs)

      if (collection?.upload && req) {
        await scheduleUnreferencedFileCleanup({
          candidates: removedFiles,
          collection,
          req,
        })
      }
    }
  } catch (err) {
    payload.logger.error(err)
    payload.logger.error(
      `There was an error cleaning up old versions for the ${entityType} ${slug}`,
    )
  }
}
