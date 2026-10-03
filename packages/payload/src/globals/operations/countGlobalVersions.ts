import type { AccessResult } from '../../config/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import {
  buildVersionGlobalFields,
  type GlobalSlug,
  type SanitizedGlobalConfig,
} from '../../index.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

export type Arguments = {
  disableErrors?: boolean
  global: SanitizedGlobalConfig
  overrideAccess?: boolean
  req?: PayloadRequest
  where?: Where
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const countGlobalVersionsOperation = async <TSlug extends GlobalSlug>(
  args: Arguments,
): Promise<{ totalDocs: number }> => {
  // /////////////////////////////////////
  // beforeOperation - Global
  // /////////////////////////////////////

  args = await buildBeforeOperation({
    args,
    global: args.global,
    operation: 'countVersions',
    overrideAccess: args.overrideAccess,
  })

  const { disableErrors, global, overrideAccess, where } = args
  const req = args.req!
  const { payload } = req

  // /////////////////////////////////////
  // Access
  // /////////////////////////////////////

  let accessResult: AccessResult

  if (!overrideAccess) {
    accessResult = await executeAccess(
      { slug: global.slug, disableErrors, req },
      global.access.readVersions,
    )

    // If errors are disabled, and access returns false, return empty results
    if (accessResult === false) {
      return {
        totalDocs: 0,
      }
    }
  }

  const fullWhere = combineQueries(where!, accessResult!)

  const versionFields = buildVersionGlobalFields(payload.config, global, true)

  sanitizeWhereQuery({ fields: versionFields, payload, where: fullWhere })

  await validateQueryPaths({
    globalConfig: global,
    overrideAccess: overrideAccess!,
    req,
    versionFields,
    where: where!,
  })

  const result = await payload.db.countGlobalVersions({
    global: global.slug,
    locale: req?.locale || undefined,
    req,
    where: fullWhere,
  })

  // /////////////////////////////////////
  // Return results
  // /////////////////////////////////////

  return result
}
