// @ts-strict-ignore
import type { SanitizedCollectionConfig, SanitizedJoin } from '../collections/config/types.js'
import type { FlattenedField } from '../fields/config/types.js'
import type { JoinQuery, PayloadRequest } from '../types/index.js'

import executeAccess from '../auth/executeAccess.js'
import { QueryError } from '../errors/QueryError.js'
import { combineQueries } from './combineQueries.js'
import { validateQueryPaths } from './queryValidation/validateQueryPaths.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  joins?: JoinQuery
  overrideAccess: boolean
  req: PayloadRequest
}

const sanitizeJoinFieldQuery = async ({
  collectionSlug,
  errors,
  join,
  joinsQuery,
  overrideAccess,
  promises,
  req,
}: {
  collectionSlug: string
  errors: { path: string }[]
  join: SanitizedJoin
  joinsQuery: JoinQuery
  overrideAccess: boolean
  promises: Promise<void>[]
  req: PayloadRequest
}) => {
  const { joinPath } = join

  if (joinsQuery[joinPath] === false) {
    return
  }

  const joinCollectionConfig = req.payload.collections[collectionSlug].config

  const accessResult = !overrideAccess
    ? await executeAccess({ disableErrors: true, req }, joinCollectionConfig.access.read)
    : true

  if (accessResult === false) {
    joinsQuery[joinPath] = false
    return
  }

  if (!joinsQuery[joinPath]) {
    joinsQuery[joinPath] = {}
  }

  const joinQuery = joinsQuery[joinPath]

  if (!joinQuery.where) {
    joinQuery.where = {}
  }

  if (join.field.where) {
    joinQuery.where = combineQueries(joinQuery.where, join.field.where)
  }

  promises.push(
    validateQueryPaths({
      collectionConfig: joinCollectionConfig,
      errors,
      overrideAccess,
      polymorphicJoin: Array.isArray(join.field.collection),
      req,
      // incoming where input, but we shouldn't validate generated from the access control.
      where: joinQuery.where,
    }),
  )

  if (typeof accessResult === 'object') {
    joinQuery.where = combineQueries(joinQuery.where, accessResult)
  }
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
    for (const join of collectionConfig.joins[collectionSlug]) {
      await sanitizeJoinFieldQuery({
        collectionSlug,
        errors,
        join,
        joinsQuery,
        overrideAccess,
        promises,
        req,
      })
    }
  }

  for (const join of collectionConfig.polymorphicJoins) {
    for (const collectionSlug of join.field.collection) {
      await sanitizeJoinFieldQuery({
        collectionSlug,
        errors,
        join,
        joinsQuery,
        overrideAccess,
        promises,
        req,
      })
    }
  }

  await Promise.all(promises)

  if (errors.length > 0) {
    throw new QueryError(errors)
  }

  return joinsQuery
}
