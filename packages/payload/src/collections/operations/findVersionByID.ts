/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'
import type { TypeWithVersion } from '../../versions/types'
import type { Collection, TypeWithID } from '../config/types'

import executeAccess from '../../auth/executeAccess'
import { combineQueries } from '../../database/combineQueries'
import { APIError, Forbidden, NotFound } from '../../errors'
import { afterRead } from '../../fields/hooks/afterRead'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'

export type Arguments = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

async function findVersionByID<T extends TypeWithID = any>(
  args: Arguments,
): Promise<TypeWithVersion<T>> {
  const {
    id,
    collection: { config: collectionConfig },
    currentDepth,
    depth,
    disableErrors,
    overrideAccess,
    req: { fallbackLocale, locale, payload, t },
    req,
    showHiddenFields,
  } = args

  if (!id) {
    throw new APIError('Missing ID of version.', httpStatus.BAD_REQUEST)
  }

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, disableErrors, req }, collectionConfig.access.readVersions)
      : true

    // If errors are disabled, and access returns false, return null
    if (accessResults === false) return null

    const hasWhereAccess = typeof accessResults === 'object'

    const fullWhere = combineQueries({ id: { equals: id } }, accessResults)

    // /////////////////////////////////////
    // Find by ID
    // /////////////////////////////////////

    const findVersionsDbArgs = {
      collection: collectionConfig.slug,
      limit: 1,
      locale,
      pagination: false,
      req,
      where: fullWhere,
    }

    let versionsQuery
    if (collectionConfig?.db?.findVersions) {
      versionsQuery = await collectionConfig.db.findVersions<T>(findVersionsDbArgs)
    } else {
      versionsQuery = await payload.db.findVersions<T>(findVersionsDbArgs)
    }

    const result = versionsQuery.docs[0]

    if (!result) {
      if (!disableErrors) {
        if (!hasWhereAccess) throw new NotFound(t)
        if (hasWhereAccess) throw new Forbidden(t)
      }

      return null
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
      req,
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

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default findVersionByID
