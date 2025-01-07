import type { AccessResult } from '../../config/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { buildVersionGlobalFields } from '../../index.js'
import { type GlobalSlug, type SanitizedGlobalConfig, type TypedLocale } from '../../index.js'
import { killTransaction } from '../../utilities/killTransaction.js'

export type Arguments = {
  disableErrors?: boolean
  global: SanitizedGlobalConfig
  locale?: TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequest
  where?: Where
}

export const countGlobalVersionsOperation = async <TSlug extends GlobalSlug>(
  args: Arguments,
): Promise<{ totalDocs: number }> => {
  try {
    const {
      disableErrors,
      global,
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
      accessResult = await executeAccess({ disableErrors, req }, global.access.readVersions)

      // If errors are disabled, and access returns false, return empty results
      if (accessResult === false) {
        return {
          totalDocs: 0,
        }
      }
    }

    const fullWhere = combineQueries(where, accessResult)

    const versionFields = buildVersionGlobalFields(payload.config, global, true)

    await validateQueryPaths({
      globalConfig: global,
      overrideAccess,
      req,
      versionFields,
      where,
    })

    const result = await payload.db.countGlobalVersions({
      global: global.slug,
      locale,
      req,
      where: fullWhere,
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
