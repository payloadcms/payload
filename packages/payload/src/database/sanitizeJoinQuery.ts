import type { SanitizedCollectionConfig, SanitizedJoin } from '../collections/config/types.js'
import type { JoinQuery, PayloadRequest, Where } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'
import { QueryError } from '../errors/QueryError.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { combineQueries } from './combineQueries.js'
import { validateQueryPaths } from './queryValidation/validateQueryPaths.js'
import { validateSortQuery } from './queryValidation/validateSortQuery.js'
import { sanitizeWhereQuery } from './sanitizeWhereQuery.js'

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

  // TODO: fix any's in joinsQuery[joinPath]

  if ((joinsQuery as any)[joinPath] === false) {
    return
  }

  const joinCollectionConfig = req.payload.collections[collectionSlug]!.config

  const accessResult = !overrideAccess
    ? await executeAccess(
        { slug: joinCollectionConfig.slug, disableErrors: true, req },
        joinCollectionConfig.access.read,
      )
    : true

  if (accessResult === false) {
    ;(joinsQuery as any)[joinPath] = false
    return
  }

  if (!(joinsQuery as any)[joinPath]) {
    ;(joinsQuery as any)[joinPath] = {}
  }

  const joinQuery = (joinsQuery as any)[joinPath]

  if (!joinQuery.where) {
    joinQuery.where = {}
  }

  if (join.field.where) {
    joinQuery.where = combineQueries(joinQuery.where, deepCopyObjectSimple(join.field.where))
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
    validateSortQuery({
      collectionConfig: joinCollectionConfig,
      overrideAccess,
      req,
      sort: joinQuery.sort || join.field.defaultSort || joinCollectionConfig.defaultSort,
    }),
  )

  if (typeof accessResult === 'object') {
    sanitizeWhereQuery({
      fields: joinCollectionConfig.flattenedFields,
      payload: req.payload,
      where: accessResult,
    })
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
    for (const join of collectionConfig.joins[collectionSlug]!) {
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
    const joinQuery = joinsQuery[join.joinPath]

    // Preserve joins explicitly disabled by the caller.
    if (joinQuery === false) {
      continue
    }

    const readableCollections: Where[] = []

    for (const collectionSlug of join.field.collection) {
      const collectionJoins: JoinQuery = {
        [join.joinPath]: deepCopyObjectSimple(joinQuery || {}),
      }

      await sanitizeJoinFieldQuery({
        collectionSlug,
        errors,
        join,
        joinsQuery: collectionJoins,
        overrideAccess,
        promises,
        req,
      })

      const collectionQuery = collectionJoins[join.joinPath]

      // Include only targets the current user can read.
      if (collectionQuery !== false) {
        readableCollections.push(
          combineQueries(collectionQuery?.where || {}, {
            relationTo: { equals: collectionSlug },
          }),
        )
      }
    }

    // Disable the join when none of its targets are readable.
    joinsQuery[join.joinPath] = readableCollections.length
      ? { ...joinQuery, where: { or: readableCollections } }
      : false
  }

  await Promise.all(promises)

  if (errors.length > 0) {
    throw new QueryError(errors)
  }

  return joinsQuery
}
