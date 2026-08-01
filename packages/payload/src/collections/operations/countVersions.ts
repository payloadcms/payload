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
import { buildVersionCollectionFields } from '../../index.js'
import { defineLocalAPI, defineOperation } from '../../operations/defineOperation.js'
import {
  collectionSchema,
  localeSchema,
  operationWhereSchema,
} from '../../operations/schemaFields.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

type CountDocumentVersionsArgs = {
  collection: Collection
  disableErrors?: boolean
  overrideAccess?: boolean
  req?: PayloadRequest
  where?: Where
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const countDocumentVersions = async <TSlug extends CollectionSlug>(
  incomingArgs: CountDocumentVersionsArgs,
): Promise<{ totalDocs: number }> => {
  let args = incomingArgs

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'countVersions',
      overrideAccess: args.overrideAccess!,
    })

    const {
      collection: { config: collectionConfig },
      disableErrors,
      overrideAccess,
      req,
      where,
    } = args

    const { locale, payload } = req!

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess(
        { disableErrors, req: req! },
        collectionConfig.access.readVersions,
      )

      // If errors are disabled, and access returns false, return empty results
      if (accessResult === false) {
        return {
          totalDocs: 0,
        }
      }
    }

    let result: { totalDocs: number }

    const fullWhere = combineQueries(where!, accessResult!)

    const versionFields = buildVersionCollectionFields(payload.config, collectionConfig, true)

    sanitizeWhereQuery({ fields: versionFields, payload, where: fullWhere })

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req: req!,
      versionFields,
      where: where!,
    })

    result = await payload.db.countVersions({
      collection: collectionConfig.slug,
      locale: locale!,
      req,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'countVersions',
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

export type CountVersionsOptions<TSlug extends CollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  disableErrors?: boolean
  locale?: TypedLocale
  overrideAccess?: boolean
  req?: Partial<PayloadRequest>
  user?: null | User
  where?: Where
}

type CountVersionsLocalMethod = <TSlug extends CollectionSlug>(
  options: LocalAPIOptions<CountVersionsOptions<TSlug>>,
) => Promise<{ totalDocs: number }>

const countVersionsSchema = z.looseObject({
  collection: collectionSchema,
  locale: localeSchema,
  where: operationWhereSchema.optional(),
})

export const countVersionsLocalAPI = defineLocalAPI<CountVersionsLocalMethod>()({
  name: 'countVersions',
})

export const countVersions = defineOperation({
  action: 'countVersions',
  expose: {
    local: countVersionsLocalAPI,
    mcp: { name: 'countVersions' },
  },
  handler: async <TSlug extends CollectionSlug>(
    payload: Payload,
    options: CountVersionsOptions<TSlug>,
  ) => {
    const { collection: collectionSlug, disableErrors, overrideAccess = true, where } = options
    const collection = payload.collections[collectionSlug]

    if (!collection) {
      throw new APIError(
        `The collection with slug ${String(
          collectionSlug,
        )} can't be found. Count Versions Operation.`,
      )
    }

    return countDocumentVersions<TSlug>({
      collection,
      disableErrors,
      overrideAccess,
      req: await createLocalReq(options as CreateLocalReqOptions, payload),
      where,
    })
  },
  input: countVersionsSchema,
  target: 'collection',
})
