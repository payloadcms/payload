import type { AccessResult } from '../../config/types.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { DocumentVersion } from '../../types/operations.js'
import type { Collection } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { getVersionStatusQuery } from '../../versions/getVersionStatusQuery.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

export type Arguments = {
  collection: Collection
  disableErrors?: boolean
  overrideAccess?: boolean
  req?: PayloadRequest
  trash?: boolean
  version?: DocumentVersion
  where?: Where
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const countOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments,
): Promise<{ totalDocs: number }> => {
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

  const {
    collection: { config: collectionConfig },
    disableErrors,
    overrideAccess,
    req,
    trash = false,
    version = 'published',
    where,
  } = args

  const { payload } = req!

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  let accessResult: AccessResult

  if (!overrideAccess) {
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

  await validateQueryPaths({
    collectionConfig,
    overrideAccess: overrideAccess!,
    req: req!,
    where: where!,
  })

  if (hasDraftsEnabled(collectionConfig) && version !== 'latest') {
    fullWhere = combineQueries(
      fullWhere,
      getVersionStatusQuery({
        entity: collectionConfig,
        locale: req?.locale,
        localization: payload.config.localization,
        status: version,
      }),
    )
  }

  if (hasDraftsEnabled(collectionConfig) && version !== 'published') {
    const { totalDocs } = await payload.db.queryDrafts({
      collection: collectionConfig.slug,
      limit: 1,
      locale: req?.locale || undefined,
      pagination: true,
      req,
      select: { parent: true },
      where: appendVersionToQueryKey(fullWhere),
    })

    result = { totalDocs }
  } else {
    result = await payload.db.count({
      collection: collectionConfig.slug,
      locale: req?.locale || undefined,
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
    overrideAccess,
    result,
  })

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result
}
