import type { SanitizedCollectionConfig, SanitizedJoin } from '../collections/config/types.js'
import type { JoinQuery, PayloadRequest, Where } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'
import { QueryError } from '../errors/QueryError.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { combineQueries } from './combineQueries.js'
import { validateQueryPaths } from './queryValidation/validateQueryPaths.js'
import { validateSortQuery } from './queryValidation/validateSortQuery.js'
import { hasRowContains, isRowContainsField } from './resolveRowContains.js'
import { sanitizeWhereQuery } from './sanitizeWhereQuery.js'
import { scopePolymorphicJoinWhere } from './scopePolymorphicJoinWhere.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  joins?: JoinQuery
  overrideAccess: boolean
  req: PayloadRequest
}

const sanitizeJoinFieldQuery = async ({
  collectionSlug,
  errors,
  isRowField,
  join,
  joinsQuery,
  overrideAccess,
  promises,
  req,
}: {
  collectionSlug: string
  errors: { path: string }[]
  isRowField?: (path: string) => boolean
  join: SanitizedJoin
  joinsQuery: Exclude<JoinQuery, false>
  overrideAccess: boolean
  promises: Promise<void>[]
  req: PayloadRequest
}) => {
  const { joinPath } = join

  const configuredQuery = joinsQuery[joinPath]

  if (configuredQuery === false) {
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
    joinsQuery[joinPath] = false
    return
  }

  const joinQuery = configuredQuery ?? {}
  joinsQuery[joinPath] = joinQuery

  if (!joinQuery.where) {
    joinQuery.where = {}
  }

  if (join.field.where) {
    joinQuery.where = combineQueries(joinQuery.where, deepCopyObjectSimple(join.field.where))
  }

  const polymorphicJoinCollections = Array.isArray(join.field.collection)
    ? join.field.collection
    : undefined
  const where =
    isRowField && hasRowContains({ isRowField, where: joinQuery.where })
      ? scopePolymorphicJoinWhere({ collectionSlug, where: joinQuery.where })
      : joinQuery.where

  if (where === false) {
    joinsQuery[joinPath] = false
    return
  }

  joinQuery.where = where === true ? {} : where

  promises.push(
    validateQueryPaths({
      collectionConfig: joinCollectionConfig,
      errors,
      overrideAccess,
      polymorphicJoinCollections,
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
    const collections = join.field.collection
    const joinQuery = joinsQuery[join.joinPath]

    // Preserve joins explicitly disabled by the caller.
    if (joinQuery === false || !Array.isArray(collections)) {
      continue
    }

    const readableCollections: Where[] = []
    const isRowField = (path: string) =>
      collections.some((slug) =>
        isRowContainsField({
          fields: req.payload.collections[slug]!.config.flattenedFields,
          path,
        }),
      )

    for (const collectionSlug of collections) {
      const collectionJoins: JoinQuery = {
        [join.joinPath]: deepCopyObjectSimple(joinQuery || {}),
      }

      await sanitizeJoinFieldQuery({
        collectionSlug,
        errors,
        isRowField,
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
