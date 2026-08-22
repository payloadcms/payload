import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { DeleteVersionsArgs } from '../database/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload, PayloadRequest, Where } from '../types/index.js'

import { resolveBranchOwnVersions } from '../branching/versions.js'

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
      // Scoped to the chain being pruned, which on a branch is the branch's own —
      // hanging off its shadow row, not the canonical ID.
      //
      // Both halves need it. Unscoped, the probe counted main's versions as part of the
      // branch's ancestry (a branch reads main's history as its own past, §12), and then
      // the delete addressed `parent: <canonical id>` with no `_branch` filter, which on
      // a branch matches *only main's rows*. Saving on a branch therefore deleted
      // production version history and never pruned the branch at all.
      Object.assign(
        where,
        await resolveBranchOwnVersions({ id: id!, collectionSlug: collection.slug, req }),
      )

      const query = await payload.db.findVersions({
        collection: collection.slug,
        limit: 1,
        page: max + 1,
        pagination: false,
        req,
        sort: '-updatedAt',
        where,
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
        // The same scoped predicate the probe used, so what is counted and what is
        // deleted are the same set of rows.
        Object.assign(deleteQuery, where)
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
