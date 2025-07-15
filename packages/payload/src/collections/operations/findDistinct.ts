import httpStatus from 'http-status'

import type { AccessResult } from '../../config/types.js'
import type { PaginatedDistinctDocs } from '../../database/types.js'
import type { PayloadRequest, PopulateType, Sort, Where } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/APIError.js'
import { Forbidden } from '../../errors/Forbidden.js'
import { relationshipPopulationPromise } from '../../fields/hooks/afterRead/relationshipPopulationPromise.js'
import { getFieldByPath } from '../../utilities/getFieldByPath.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { buildAfterOperation } from './utils.js'

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
  where?: Where
}
export const findDistinctOperation = async (
  incomingArgs: Arguments,
): Promise<PaginatedDistinctDocs<Record<string, unknown>>> => {
  let args = incomingArgs

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    if (args.collection.config.hooks?.beforeOperation?.length) {
      for (const hook of args.collection.config.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            collection: args.collection.config,
            context: args.req!.context,
            operation: 'readDistinct',
            req: args.req!,
          })) || args
      }
    }

    const {
      collection: { config: collectionConfig },
      disableErrors,
      overrideAccess,
      populate,
      showHiddenFields = false,
      where,
    } = args

    const req = args.req!
    const { locale, payload } = req

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ disableErrors, req }, collectionConfig.access.read)

      // If errors are disabled, and access returns false, return empty results
      if (accessResult === false) {
        return {
          hasNextPage: false,
          hasPrevPage: false,
          limit: args.limit || 0,
          nextPage: null,
          page: 1,
          pagingCounter: 1,
          prevPage: null,
          totalDocs: 0,
          totalPages: 0,
          values: [],
        }
      }
    }

    // /////////////////////////////////////
    // Find Distinct
    // /////////////////////////////////////

    const fullWhere = combineQueries(where!, accessResult!)
    sanitizeWhereQuery({ fields: collectionConfig.flattenedFields, payload, where: fullWhere })

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req,
      where: where ?? {},
    })

    const fieldResult = getFieldByPath({
      fields: collectionConfig.flattenedFields,
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
      const hasAccess = await fieldResult.field.access.read({ req })
      if (!hasAccess) {
        throw new Forbidden(req.t)
      }
    }

    let result = await payload.db.findDistinct({
      collection: collectionConfig.slug,
      field: args.field,
      limit: args.limit,
      locale: locale!,
      page: args.page,
      req,
      sort: args.sort,
      where: fullWhere,
    })

    if (
      (fieldResult.field.type === 'relationship' || fieldResult.field.type === 'upload') &&
      args.depth
    ) {
      const populationPromises: Promise<void>[] = []
      for (const doc of result.values) {
        populationPromises.push(
          relationshipPopulationPromise({
            currentDepth: 0,
            depth: args.depth,
            draft: false,
            fallbackLocale: req.fallbackLocale || null,
            field: fieldResult.field,
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
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result
  } catch (error: unknown) {
    await killTransaction(args.req!)
    throw error
  }
}
