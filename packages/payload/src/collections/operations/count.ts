import type { AccessResult } from '../../config/types'
import type { PayloadRequest, Where } from '../../types/index'
import type { Collection, TypeWithID } from '../config/types'

import executeAccess from '../../auth/executeAccess'
import { combineQueries } from '../../database/combineQueries'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { buildAfterOperation } from './utils'

export type Arguments = {
  collection: Collection
  disableErrors?: boolean
  overrideAccess?: boolean
  req?: PayloadRequest
  where?: Where
}

async function count<T extends TypeWithID & Record<string, unknown>>(
  incomingArgs: Arguments,
): Promise<{ totalDocs: number }> {
  let args = incomingArgs

  try {
    const shouldCommit = await initTransaction(args.req)

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

    const fullWhere = combineQueries(where, accessResult)

    await validateQueryPaths({
      collectionConfig,
      overrideAccess,
      req,
      where,
    })

    const countDbArgs = {
      collection: collectionConfig.slug,
      req,
      where: fullWhere,
    }
    if (collectionConfig?.db?.count) {
      result = await collectionConfig.db.count(countDbArgs)
    } else {
      result = await payload.db.count(countDbArgs)
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<T>({
      args,
      collection: collectionConfig,
      operation: 'count',
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

export default count
