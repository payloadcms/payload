import httpStatus from 'http-status'

import type { AccessResult } from '../../config/types.js'
import type { PaginatedDistinctDocs } from '../../database/types.js'
import type { FlattenedField } from '../../fields/config/types.js'
import type { PayloadRequest, PopulateType, Sort, Where } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { getLocalizedPaths } from '../../database/getLocalizedPaths.js'
import { prefixWherePaths } from '../../database/prefixWherePaths.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { validateSortQuery } from '../../database/queryValidation/validateSortQuery.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/APIError.js'
import { Forbidden } from '../../errors/Forbidden.js'
import { QueryError } from '../../errors/QueryError.js'
import { relationshipPopulationPromise } from '../../fields/hooks/afterRead/relationshipPopulationPromise.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { getFieldByPath } from '../../utilities/getFieldByPath.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

export type Arguments = {
  collection: Collection
  depth?: number
  disableErrors?: boolean
  field: string
  limit?: number
  locale?: string
  overrideAccess?: boolean
  page?: number
  populate?: PopulateType
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: Sort
  trash?: boolean
  where?: Where
}

const getEmptyResult = ({
  limit,
}: {
  limit?: number
}): PaginatedDistinctDocs<Record<string, unknown>> => ({
  hasNextPage: false,
  hasPrevPage: false,
  limit: limit || 0,
  nextPage: null,
  page: 1,
  pagingCounter: 1,
  prevPage: null,
  totalDocs: 0,
  totalPages: 0,
  values: [],
})

export const findDistinctOperation = async (
  incomingArgs: Arguments,
): Promise<PaginatedDistinctDocs<Record<string, unknown>>> => {
  let args = incomingArgs

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  args = await buildBeforeOperation({
    args,
    collection: args.collection.config,
    operation: 'readDistinct',
    overrideAccess: args.overrideAccess!,
  })

  const {
    collection: { config: collectionConfig },
    disableErrors,
    overrideAccess,
    populate,
    showHiddenFields = false,
    trash = false,
    where,
  } = args

  const req = args.req!
  const { locale, payload } = req

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  let accessResult: AccessResult

  if (!overrideAccess) {
    accessResult = await executeAccess(
      { slug: collectionConfig.slug, disableErrors, req },
      collectionConfig.access.read,
    )

    // If errors are disabled, and access returns false, return empty results
    if (accessResult === false) {
      return getEmptyResult({ limit: args.limit })
    }
  }

  // /////////////////////////////////////
  // Find Distinct
  // /////////////////////////////////////

  let fullWhere = combineQueries(where!, accessResult!)
  sanitizeWhereQuery({ fields: collectionConfig.flattenedFields, payload, where: fullWhere })

  // Exclude trashed documents when trash: false
  fullWhere = appendNonTrashedFilter({
    enableTrash: collectionConfig.trash,
    trash,
    where: fullWhere,
  })

  const relatedAccessByPath: Record<string, Where> = {}

  await validateQueryPaths({
    collectionConfig,
    overrideAccess: overrideAccess!,
    req,
    where: where ?? {},
  })

  const fieldResult = getFieldByPath({
    config: payload.config,
    fields: collectionConfig.flattenedFields,
    includeRelationships: true,
    path: args.field,
  })

  if (!fieldResult) {
    throw new APIError(
      `Field ${args.field} was not found in the collection ${collectionConfig.slug}`,
      httpStatus.BAD_REQUEST,
    )
  }

  if (fieldResult.field.hidden && !showHiddenFields) {
    throw new Forbidden(req.t)
  }

  if (fieldResult.field.access?.read) {
    const hasAccess = await fieldResult.field.access.read({
      collection: collectionConfig,
      req,
    })
    if (!hasAccess) {
      throw new Forbidden(req.t)
    }
  }

  if (!overrideAccess) {
    const paths = getLocalizedPaths({
      collectionSlug: collectionConfig.slug,
      fields: collectionConfig.flattenedFields,
      incomingPath: args.field,
      locale: req.locale!,
      overrideAccess: true,
      payload,
    })

    if (paths.at(-1)?.path === 'id') {
      const previousField = paths.at(-2)?.field
      if (
        previousField &&
        (previousField.type === 'relationship' || previousField.type === 'upload') &&
        typeof previousField.relationTo === 'string'
      ) {
        paths.pop()
      }
    }

    const relatedAccessByCollection = new Map<string, AccessResult>()

    for (let pathIndex = 1; pathIndex < paths.length; pathIndex++) {
      const collectionSlug = paths[pathIndex]?.collectionSlug

      if (!collectionSlug) {
        continue
      }

      if (!relatedAccessByCollection.has(collectionSlug)) {
        const relatedCollectionConfig = payload.collections[collectionSlug]!.config
        const relatedAccess = await executeAccess(
          { slug: collectionSlug, disableErrors: true, req },
          relatedCollectionConfig.access.read,
        )

        if (typeof relatedAccess === 'object') {
          sanitizeWhereQuery({
            fields: relatedCollectionConfig.flattenedFields,
            payload,
            where: relatedAccess,
          })
        }

        relatedAccessByCollection.set(collectionSlug, relatedAccess)
      }

      const relatedAccess = relatedAccessByCollection.get(collectionSlug)!

      if (relatedAccess === false) {
        if (disableErrors) {
          return getEmptyResult({ limit: args.limit })
        }

        throw new QueryError([{ path: args.field }])
      }

      if (typeof relatedAccess === 'object') {
        const relationshipPath = paths
          .slice(0, pathIndex)
          .map(({ path }) => path)
          .join('.')

        relatedAccessByPath[relationshipPath] = relatedAccess
        fullWhere = combineQueries(
          fullWhere,
          prefixWherePaths({ prefix: relationshipPath, where: relatedAccess }),
        )
      }
    }

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: false,
      req,
      showHiddenFields,
      where: {
        [args.field]: {
          exists: true,
        },
      },
    })

    await validateSortQuery({
      collectionConfig,
      overrideAccess: false,
      req,
      sort: args.sort,
    })
  }

  if ('virtual' in fieldResult.field && fieldResult.field.virtual) {
    if (typeof fieldResult.field.virtual !== 'string') {
      throw new APIError(
        `Cannot findDistinct by a virtual field that isn't linked to a relationship field.`,
      )
    }

    let relationPath: string = ''
    let currentFields: FlattenedField[] = collectionConfig.flattenedFields
    const fieldPathSegments = fieldResult.field.virtual.split('.')
    for (const segment of fieldResult.field.virtual.split('.')) {
      relationPath = `${relationPath}${segment}`
      fieldPathSegments.shift()
      const field = currentFields.find((e) => e.name === segment)!
      if (
        (field.type === 'relationship' || field.type === 'upload') &&
        typeof field.relationTo === 'string'
      ) {
        break
      }
      if ('flattenedFields' in field) {
        currentFields = field.flattenedFields
      }
    }

    const path = `${relationPath}.${fieldPathSegments.join('.')}`

    const result = await payload.findDistinct({
      collection: collectionConfig.slug,
      depth: args.depth,
      disableErrors,
      field: path,
      limit: args.limit,
      locale,
      overrideAccess,
      page: args.page,
      populate,
      req,
      showHiddenFields,
      sort: args.sort,
      trash,
      where,
    })

    for (const val of result.values) {
      val[args.field] = val[path]
      delete val[path]
    }

    return result
  }

  let result = await payload.db.findDistinct({
    collection: collectionConfig.slug,
    field: args.field,
    limit: args.limit,
    locale: locale!,
    page: args.page,
    relatedAccess: relatedAccessByPath,
    req,
    sort: args.sort,
    where: fullWhere,
  })

  if (
    (fieldResult.field.type === 'relationship' || fieldResult.field.type === 'upload') &&
    args.depth
  ) {
    const populationPromises: Promise<void>[] = []
    const sanitizedField = { ...fieldResult.field }
    if (fieldResult.field.hasMany) {
      sanitizedField.hasMany = false
    }
    for (const doc of result.values) {
      populationPromises.push(
        relationshipPopulationPromise({
          currentDepth: 0,
          depth: args.depth,
          draft: false,
          fallbackLocale: req.fallbackLocale || null,
          field: sanitizedField,
          locale: req.locale || null,
          overrideAccess: args.overrideAccess ?? true,
          parentIsLocalized: false,
          populate,
          req,
          showHiddenFields: false,
          siblingDoc: doc,
        }),
      )
    }
    await Promise.all(populationPromises)
  }

  // /////////////////////////////////////
  // afterOperation - Collection
  // /////////////////////////////////////

  result = await buildAfterOperation({
    args,
    collection: collectionConfig,
    operation: 'findDistinct',
    overrideAccess,
    result,
  })

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result
}
