// @ts-strict-ignore
import type { FindGlobalVersionsArgs } from '../../database/types.js'
import type { PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { getQueryDraftsSelect } from '../../versions/drafts/getQueryDraftsSelect.js'

export type Arguments = {
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  globalConfig: SanitizedGlobalConfig
  id: number | string
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
}

export const findVersionByIDOperation = async <T extends TypeWithVersion<T> = any>(
  args: Arguments,
): Promise<T> => {
  const {
    id,
    currentDepth,
    depth,
    disableErrors,
    globalConfig,
    overrideAccess,
    populate,
    req: { fallbackLocale, locale, payload },
    req,
    select: incomingSelect,
    showHiddenFields,
  } = args

  try {
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, disableErrors, req }, globalConfig.access.readVersions)
      : true

    // If errors are disabled, and access returns false, return null
    if (accessResults === false) {
      return null
    }

    const hasWhereAccess = typeof accessResults === 'object'

    const select = sanitizeSelect({
      forceSelect: getQueryDraftsSelect({ select: globalConfig.forceSelect }),
      select: incomingSelect,
    })

    const findGlobalVersionsArgs: FindGlobalVersionsArgs = {
      global: globalConfig.slug,
      limit: 1,
      locale,
      req,
      select,
      where: combineQueries({ id: { equals: id } }, accessResults),
    }

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    if (!findGlobalVersionsArgs.where.and[0].id) {
      throw new NotFound(req.t)
    }

    const { docs: results } = await payload.db.findGlobalVersions(findGlobalVersionsArgs)
    if (!results || results?.length === 0) {
      if (!disableErrors) {
        if (!hasWhereAccess) {
          throw new NotFound(req.t)
        }
        if (hasWhereAccess) {
          throw new Forbidden(req.t)
        }
      }

      return null
    }

    // Clone the result - it may have come back memoized
    let result: any = deepCopyObjectSimple(results[0])

    if (!result.version) {
      result.version = {}
    }

    // Patch globalType onto version doc
    result.version.globalType = globalConfig.slug

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    if (globalConfig.hooks?.beforeRead?.length) {
      for (const hook of globalConfig.hooks.beforeRead) {
        result =
          (await hook({
            context: req.context,
            doc: result.version,
            global: globalConfig,
            req,
          })) || result.version
      }
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result.version = await afterRead({
      collection: null,
      context: req.context,
      currentDepth,
      depth,
      doc: result.version,
      draft: undefined,
      fallbackLocale,
      global: globalConfig,
      locale,
      overrideAccess,
      populate,
      req,
      select: typeof select?.version === 'object' ? select.version : undefined,
      showHiddenFields,
    })

    // /////////////////////////////////////
    // afterRead - Global
    // /////////////////////////////////////

    if (globalConfig.hooks?.afterRead?.length) {
      for (const hook of globalConfig.hooks.afterRead) {
        result.version =
          (await hook({
            context: req.context,
            doc: result.version,
            global: globalConfig,
            query: findGlobalVersionsArgs.where,
            req,
          })) || result.version
      }
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
