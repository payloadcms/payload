import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { JoinQuery, PayloadRequest } from '../types/index.js'

import executeAccess from '../auth/executeAccess.js'
import { QueryError } from '../errors/QueryError.js'
import { combineQueries } from './combineQueries.js'
import { validateQueryPaths } from './queryValidation/validateQueryPaths.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  disableErrors?: boolean
  errors?: { path: string }[]
  joins?: JoinQuery
  overrideAccess: boolean
  req: PayloadRequest
}

/**
 *
 */
export const sanitizeJoinQuery = async ({
  collectionConfig,
  disableErrors,
  errors = [],
  joins: joinsQuery,
  overrideAccess,
  req,
}: Args) => {
  const promises: Promise<void>[] = []
  if (joinsQuery === false) {
    return false
  }

  if (!joinsQuery) {
    joinsQuery = {}
  }

  for (const collectionSlug in collectionConfig.joins) {
    for (const { field, schemaPath } of collectionConfig.joins[collectionSlug]) {
      if (joinsQuery[schemaPath] === false) {
        continue
      }

      const joinCollectionConfig = req.payload.collections[collectionSlug].config

      const accessResult = !overrideAccess
        ? await executeAccess({ disableErrors: true, req }, joinCollectionConfig.access.read)
        : true

      if (accessResult === false) {
        joinsQuery[schemaPath] = false
      }

      if (!joinsQuery[schemaPath]) {
        joinsQuery[schemaPath] = {}
      }

      const joinQuery = joinsQuery[schemaPath]

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
          where: joinQuery.where,
        }),
      )
    }
  }

  await Promise.all(promises)

  if (errors.length > 0) {
    throw new QueryError(errors)
  }

  return joinsQuery
}
