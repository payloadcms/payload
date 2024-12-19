import type { AccessResult } from '../../config/types.js'
import type { CollectionSlug, TypedLocale } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
  collection: Collection
  disableErrors?: boolean
  draft?: boolean
  locale?: TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequest
  where?: Where
}

export const countOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments,
): Promise<{ totalDocs: number }> => {
  let args = incomingArgs

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
      await priorHook

      args =
        (await hook({
          args,
          collection: args.collection.config,
          context: args.req.context,
          operation: 'count',
          req: args.req,
        })) || args
    }, Promise.resolve())

    const {
      collection: { config: collectionConfig },
      disableErrors,
      draft = false,
      locale,
      overrideAccess,
      req: { payload },
      req,
      where,
    } = args

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult

    if (!overrideAccess) {
      accessResult = await executeAccess({ disableErrors, req }, collectionConfig.access.read)

      // If errors are disabled, and access returns false, return empty results
      if (accessResult === false) {
        return {
          totalDocs: 0,
        }
      }
    }

    let result: { totalDocs: number }

    let fullWhere = combineQueries(where, accessResult)

    await validateQueryPaths({
      collectionConfig,
      overrideAccess,
      req,
      where,
    })

    if (draft) {
      fullWhere = appendVersionToQueryKey(fullWhere)
      fullWhere = combineQueries(fullWhere, { latest: { equals: true } })

      result = await payload.db.countVersions({
        collection: collectionConfig.slug,
        locale,
        req,
        where: fullWhere,
      })
    } else {
      result = await payload.db.count({
        collection: collectionConfig.slug,
        locale,
        req,
        where: fullWhere,
      })
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'count',
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
