import { z } from 'zod'

import type { AccessResult } from '../../config/types.js'
import type { CollectionSlug, Payload, RequestContext, TypedLocale, User } from '../../index.js'
import type { LocalAPIOptions } from '../../operations/localAPI.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { CreateLocalReqOptions } from '../../utilities/createLocalReq.js'
import type { Collection } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import {
  collectionSchema,
  localeSchema,
  operationWhereSchema,
} from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

type CountDocumentsArgs = {
  collection: Collection
  disableErrors?: boolean
  overrideAccess?: boolean
  req?: PayloadRequest
  trash?: boolean
  where?: Where
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const countDocuments = async <TSlug extends CollectionSlug>(
  incomingArgs: CountDocumentsArgs,
): Promise<{ totalDocs: number }> => {
  let args = incomingArgs

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'count',
      overrideAccess: args.overrideAccess!,
    })

    const {
      collection: { config: collectionConfig },
      disableErrors,
      overrideAccess,
      req,
      trash = false,
      where,
    } = args

    const { payload } = req!

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ disableErrors, req: req! }, collectionConfig.access.read)

      // If errors are disabled, and access returns false, return empty results
      if (accessResult === false) {
        return {
          totalDocs: 0,
        }
      }
    }

    let result: { totalDocs: number }

    let fullWhere = combineQueries(where!, accessResult!)
    sanitizeWhereQuery({ fields: collectionConfig.flattenedFields, payload, where: fullWhere })

    // Exclude trashed documents when trash: false
    fullWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req: req!,
      where: where!,
    })

    result = await payload.db.count({
      collection: collectionConfig.slug,
      locale: req?.locale || undefined,
      req,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'count',
      overrideAccess,
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

export type CountOptions<TSlug extends CollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  disableErrors?: boolean
  locale?: TypedLocale
  overrideAccess?: boolean
  req?: Partial<PayloadRequest>
  trash?: boolean
  user?: null | User
  where?: Where
}

type CountLocalMethod = <TSlug extends CollectionSlug>(
  options: LocalAPIOptions<CountOptions<TSlug>>,
) => Promise<{ totalDocs: number }>

const countSchema = z.looseObject({
  collection: collectionSchema,
  locale: localeSchema,
  trash: z.boolean().describe('Include soft-deleted documents').optional(),
  where: operationWhereSchema.optional(),
})

export const countLocalAPI = defineLocalAPI<CountLocalMethod>()({ name: 'count' })

export const count = defineOperation({
  action: 'count',
  expose: {
    local: countLocalAPI,
    mcp: { name: 'countDocuments' },
    rest: [
      {
        method: 'get',
        path: '/count',
      },
    ],
  },
  handler: async <TSlug extends CollectionSlug>(payload: Payload, options: CountOptions<TSlug>) => {
    const {
      collection: collectionSlug,
      disableErrors,
      overrideAccess = true,
      trash = false,
      where,
    } = options
    const collection = payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError(
        `The collection with slug ${String(collectionSlug)} can't be found. Count Operation.`,
      )
    }

    return countDocuments<TSlug>({
      collection,
      disableErrors,
      overrideAccess,
      req: await createLocalReq(options as CreateLocalReqOptions, payload),
      trash,
      where,
    })
  },
  input: countSchema,
  target: 'collection',
})
