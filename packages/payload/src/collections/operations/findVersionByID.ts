import httpStatus from 'http-status'

import type { PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { TypeWithVersion } from '../../versions/types.js'
import type { Collection, TypeWithID } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { killTransaction } from '../../utilities/killTransaction.js'

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
    select,
    showHiddenFields,
  } = args

  if (!id) {
    throw new APIError('Missing ID of version.', httpStatus.BAD_REQUEST)
  }

  try {
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, disableErrors, req }, collectionConfig.access.readVersions)
      : true

    // If errors are disabled, and access returns false, return null
    if (accessResults === false) {
      return null
    }

    const hasWhereAccess = typeof accessResults === 'object'

    const fullWhere = combineQueries({ id: { equals: id } }, accessResults)

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    const versionsQuery = await payload.db.findVersions<TData>({
      collection: collectionConfig.slug,
      limit: 1,
      locale,
      pagination: false,
      req,
      select,
      where: fullWhere,
    })

    const result = versionsQuery.docs[0]

    if (!result) {
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

    if (!result.version) {
      // Fallback if not selected
      ;(result as any).version = {}
    }

    // /////////////////////////////////////
    // beforeRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
      await priorHook

      result.version =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          doc: result.version,
          query: fullWhere,
          req,
        })) || result.version
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result.version = await afterRead({
      collection: collectionConfig,
      context: req.context,
      currentDepth,
      depth,
      doc: result.version,
      draft: undefined,
      fallbackLocale,
      global: null,
      locale,
      overrideAccess,
      populate,
      req,
      select: typeof select?.version === 'object' ? select.version : undefined,
      showHiddenFields,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
      await priorHook

      result.version =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          doc: result.version,
          query: fullWhere,
          req,
        })) || result.version
    }, Promise.resolve())

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
