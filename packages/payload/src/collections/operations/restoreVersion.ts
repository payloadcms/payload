import httpStatus from 'http-status'

import type { FindOneArgs } from '../../database/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { Collection, TypeWithID } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'

export type Arguments = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

export const restoreVersionOperation = async <TData extends TypeWithID = any>(
  args: Arguments,
): Promise<TData> => {
  const {
    id,
    collection: { config: collectionConfig },
    depth,
    draft,
    overrideAccess = false,
    req,
    req: { fallbackLocale, locale, payload },
    showHiddenFields,
  } = args

  try {
    if (!id) {
      throw new APIError('Missing ID of version to restore.', httpStatus.BAD_REQUEST)
    }

    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////

    const findVersionDbArgs = {
      collection: collectionConfig.slug,
      limit: 1,
      locale,
      pagination: false,
      req,
      where: { id: { equals: id } },
    }

    let queryResult: any
    // @ts-expect-error exists
    if (collectionConfig?.db?.findVersions) {
      // @ts-expect-error exists
      queryResult = await collectionConfig.db.findVersions(findVersionDbArgs)
    } else {
      queryResult = await req.payload.db.findVersions(findVersionDbArgs)
    }
    const versionDocs = queryResult.docs

    const [rawVersion] = versionDocs

    if (!rawVersion) {
      throw new NotFound(req.t)
    }

    const parentDocID = rawVersion.parent

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id: parentDocID, req }, collectionConfig.access.update)
      : true
    const hasWherePolicy = hasWhereAccessResult(accessResults)

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////

    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      locale,
      req,
      where: combineQueries({ id: { equals: parentDocID } }, accessResults),
    }

    let doc
    // @ts-expect-error exists
    if (collectionConfig?.db?.findOne) {
      // @ts-expect-error exists
      doc = await collectionConfig.db.findOne(findOneArgs)
    } else {
      doc = await req.payload.db.findOne(findOneArgs)
    }

    if (!doc && !hasWherePolicy) {
      throw new NotFound(req.t)
    }
    if (!doc && hasWherePolicy) {
      throw new Forbidden(req.t)
    }

    // /////////////////////////////////////
    // fetch previousDoc
    // /////////////////////////////////////

    const prevDocWithLocales = await getLatestCollectionVersion({
      id: parentDocID,
      config: collectionConfig,
      payload,
      query: findOneArgs,
      req,
    })

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    const restoreVersionArgs = {
      id: parentDocID,
      collection: collectionConfig.slug,
      data: rawVersion.version,
      req,
    }
    let result
    // @ts-expect-error exists
    if (collectionConfig?.db?.updateOne) {
      // @ts-expect-error exists
      result = await collectionConfig.db.updateOne(restoreVersionArgs)
    } else {
      result = await req.payload.db.updateOne(restoreVersionArgs)
    }

    // /////////////////////////////////////
    // Save `previousDoc` as a version after restoring
    // /////////////////////////////////////

    const prevVersion = { ...prevDocWithLocales }

    delete prevVersion.id

    const createVersionDbArgs = {
      autosave: false,
      collectionSlug: collectionConfig.slug,
      createdAt: prevVersion.createdAt,
      parent: parentDocID,
      req,
      updatedAt: new Date().toISOString(),
      versionData: draft ? { ...rawVersion.version, _status: 'draft' } : rawVersion.version,
    }
    // @ts-expect-error exists
    if (collectionConfig?.db?.createVersion) {
      // @ts-expect-error exists
      await collectionConfig.db.createVersion(createVersionDbArgs)
    } else {
      await payload.db.createVersion(createVersionDbArgs)
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth,
      doc: result,
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

      result =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          doc: result,
          req,
        })) || result
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterChange - Fields
    // /////////////////////////////////////

    result = await afterChange({
      collection: collectionConfig,
      context: req.context,
      data: result,
      doc: result,
      global: null,
      operation: 'update',
      previousDoc: prevDocWithLocales,
      req,
    })

    // /////////////////////////////////////
    // afterChange - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
      await priorHook

      result =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          doc: result,
          operation: 'update',
          previousDoc: prevDocWithLocales,
          req,
        })) || result
    }, Promise.resolve())

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
