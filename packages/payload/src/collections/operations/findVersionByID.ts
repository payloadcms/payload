import { status as httpStatus } from 'http-status'

import type { PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { Collection, TypeWithID } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { getQueryDraftsSelect } from '../../versions/drafts/getQueryDraftsSelect.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'

export type Arguments = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  id: number | string
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  trash?: boolean
}

export const findVersionByIDOperation = async <TData extends TypeWithID = any>(
  args: Arguments,
): Promise<TypeWithVersion<TData>> => {
  const {
    id,
    collection: { config: collectionConfig },
    currentDepth,
    depth,
    disableErrors,
    overrideAccess,
    populate,
    req: { fallbackLocale, locale, payload },
    req,
    select: incomingSelect,
    showHiddenFields,
    trash = false,
  } = args

  if (!id) {
    throw new APIError('Missing ID of version.', httpStatus.BAD_REQUEST)
  }

  try {
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: collectionConfig,
      operation: 'findVersionByID',
    })

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, disableErrors, req }, collectionConfig.access.readVersions)
      : true

    // If errors are disabled, and access returns false, return null
    if (accessResults === false) {
      return null!
    }

    const hasWhereAccess = typeof accessResults === 'object'

    const where = { id: { equals: id } }

    let fullWhere = combineQueries(where, accessResults)

    fullWhere = appendNonTrashedFilter({
      deletedAtPath: 'version.deletedAt',
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    const select = sanitizeSelect({
      fields: buildVersionCollectionFields(payload.config, collectionConfig, true),
      forceSelect: getQueryDraftsSelect({ select: collectionConfig.forceSelect }),
      select: incomingSelect,
      versions: true,
    })

    const versionsQuery = await payload.db.findVersions<TData>({
      collection: collectionConfig.slug,
      limit: 1,
      locale: locale!,
      pagination: false,
      req,
      select,
      where: fullWhere,
    })

    let result = versionsQuery.docs[0]!

    if (!result) {
      if (!disableErrors) {
        if (!hasWhereAccess) {
          throw new NotFound(req.t)
        }
        if (hasWhereAccess) {
          throw new Forbidden(req.t)
        }
      }

      return null!
    }

    if (!result.version) {
      // Fallback if not selected
      ;(result as any).version = {}
    }

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeRead?.length) {
      for (const hook of collectionConfig.hooks.beforeRead) {
        result.version =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result.version,
            query: fullWhere,
            req,
          })) || result.version
      }
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result.version = await afterRead({
      collection: collectionConfig,
      context: req.context,
      currentDepth,
      depth: depth!,
      doc: result.version,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      draft: undefined,
      fallbackLocale: fallbackLocale!,
      global: null,
      locale: locale!,
      overrideAccess: overrideAccess!,
      populate,
      req,
      select: typeof select?.version === 'object' ? select.version : undefined,
      showHiddenFields: showHiddenFields!,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterRead?.length) {
      for (const hook of collectionConfig.hooks.afterRead) {
        result.version =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result.version,
            query: fullWhere,
            req,
          })) || result.version
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'findVersionByID',
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
