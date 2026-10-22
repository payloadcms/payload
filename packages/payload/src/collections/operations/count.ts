import type { AccessResult } from '../../config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { assertBranchReadOperationRequest } from '../../versions/branches/operations/branchReadContext.js'
import { resolveBranchCollectionRead } from '../../versions/branches/operations/resolveBranchReadContext.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

export type Arguments = {
  collection: Collection
  disableErrors?: boolean
  overrideAccess?: boolean
  req?: PayloadRequest
  trash?: boolean
  where?: Where
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const countOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments,
): Promise<{ totalDocs: number }> => {
  const branchReadSource = {
    collection: incomingArgs.collection.config.slug,
    req: incomingArgs.req,
  }
  let args = incomingArgs

  // /////////////////////////////////////
  // beforeOperation - Collection
  // /////////////////////////////////////

  args = await buildBeforeOperation({
    args,
    collection: args.collection.config,
    operation: 'count',
    overrideAccess: args.overrideAccess!,
  })

  assertBranchReadOperationRequest({
    source: branchReadSource.req,
    sourceCollection: branchReadSource.collection,
    target: args.req,
    targetCollection: args.collection.config.slug,
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

  const branchReadAdmission = await resolveBranchCollectionRead({
    collection: collectionConfig.slug,
    disableErrors,
    kind: 'count',
    native: {
      locale: req?.locale || undefined,
      where: appendNonTrashedFilter({
        enableTrash: collectionConfig.trash,
        trash,
        where: where ?? {},
      }),
    },
    overrideAccess,
    req: req!,
  })
  const branchRead = branchReadAdmission?.legacy ? null : branchReadAdmission
  if (branchRead?.denied) {
    return { totalDocs: 0 }
  }
  let accessResult: AccessResult

  if (!overrideAccess && !branchRead) {
    accessResult = await executeAccess(
      { slug: collectionConfig.slug, disableErrors, req: req! },
      collectionConfig.access.read,
    )

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

  if (!branchRead) {
    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req: req!,
      where: where!,
    })
  }

  result = branchRead
    ? branchRead.result
    : await payload.db.count({
        collection: collectionConfig.slug,
        locale: req?.locale || undefined,
        req,
        where: fullWhere,
      })

  await branchReadAdmission?.assertLegacy?.()

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
}
