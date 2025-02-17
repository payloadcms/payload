import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { JoinQuery, PayloadRequest } from '../types/index.js'

import executeAccess from '../auth/executeAccess.js'
import { QueryError } from '../errors/QueryError.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { combineQueries } from './combineQueries.js'
import { validateQueryPaths } from './queryValidation/validateQueryPaths.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  joins?: JoinQuery
  overrideAccess: boolean
  req: PayloadRequest
}

/**
 * * Validates `where` for each join
 * * Combines the access result for joined collection
 * * Combines the default join's `where`
 */
export const sanitizeJoinQuery = async ({
  collectionConfig,
  joins: joinsQuery,
  overrideAccess,
  req,
}: Args) => {
  if (joinsQuery === false) {
    return false
  }

  if (!joinsQuery) {
    joinsQuery = {}
  }

  const errors: { path: string }[] = []
  const promises: Promise<void>[] = []

  for (const collectionSlug in collectionConfig.joins) {
    for (const { field, joinPath } of collectionConfig.joins[collectionSlug]) {
      if (joinsQuery[joinPath] === false) {
        continue
      }

      const joinCollectionConfig = req.payload.collections[collectionSlug].config

      const accessResult = !overrideAccess
        ? await executeAccess({ disableErrors: true, req }, joinCollectionConfig.access.read)
        : true

      if (accessResult === false) {
        joinsQuery[joinPath] = false
        continue
      }

      if (!joinsQuery[joinPath]) {
        joinsQuery[joinPath] = {}
      }

      const joinQuery = joinsQuery[joinPath]

      if (!joinQuery.where) {
        joinQuery.where = {}
      }

      if (field.where) {
        joinQuery.where = combineQueries(joinQuery.where, field.where)
      }

      promises.push(
        validateQueryPaths({
          collectionConfig: joinCollectionConfig,
          errors,
          overrideAccess,
          req,
          // incoming where input, but we shouldn't validate generated from the access control.
          where: joinQuery.where,
        }),
      )

      if (typeof accessResult === 'object') {
        joinQuery.where = combineQueries(joinQuery.where, accessResult)
      }
    }
  }

  await Promise.all(promises)

  if (errors.length > 0) {
    throw new QueryError(errors)
  }

  return joinsQuery
}
