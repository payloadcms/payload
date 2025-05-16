// @ts-strict-ignore
import type { AccessResult } from '../../config/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { buildVersionCollectionFields, type CollectionSlug } from '../../index.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
  collection: Collection
  disableErrors?: boolean
  overrideAccess?: boolean
  req?: PayloadRequest
  where?: Where
}

export const countVersionsOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments,
): Promise<{ totalDocs: number }> => {
  let args = incomingArgs

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    if (args.collection.config.hooks.beforeOperation?.length) {
      for (const hook of args.collection.config.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            collection: args.collection.config,
            context: args.req.context,
            operation: 'countVersions',
            req: args.req,
          })) || args
      }
    }

    const {
      collection: { config: collectionConfig },
      disableErrors,
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
      accessResult = await executeAccess(
        { disableErrors, req },
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

    const fullWhere = combineQueries(where, accessResult)

    const versionFields = buildVersionCollectionFields(payload.config, collectionConfig, true)

    await validateQueryPaths({
      collectionConfig,
      overrideAccess,
      req,
      versionFields,
      where,
    })

    result = await payload.db.countVersions({
      collection: collectionConfig.slug,
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
