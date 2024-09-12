/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status'

import type { FindOneArgs } from '../../database/types'
import type { PayloadRequest } from '../../express/types'
import type { Collection, TypeWithID } from '../config/types'

import executeAccess from '../../auth/executeAccess'
import { hasWhereAccessResult } from '../../auth/types'
import { combineQueries } from '../../database/combineQueries'
import { APIError, Forbidden, NotFound } from '../../errors'
import { afterChange } from '../../fields/hooks/afterChange'
import { afterRead } from '../../fields/hooks/afterRead'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion'

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

async function restoreVersion<T extends TypeWithID = any>(args: Arguments): Promise<T> {
  const {
    id,
    collection: { config: collectionConfig },
    depth,
    overrideAccess = false,
    req,
    req: { fallbackLocale, locale, payload, t },
    showHiddenFields,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

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
      req,
      where: { id: { equals: id } },
    }

    let queryResult: any
    if (collectionConfig?.db?.findVersions) {
      queryResult = await collectionConfig.db.findVersions(findVersionDbArgs)
    } else {
      queryResult = await req.payload.db.findVersions(findVersionDbArgs)
    }
    const versionDocs = queryResult.docs

    const [rawVersion] = versionDocs

    if (!rawVersion) {
      throw new NotFound(t)
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

    let doc: T
    if (collectionConfig?.db?.findOne) {
      doc = await collectionConfig.db.findOne(findOneArgs)
    } else {
      doc = await req.payload.db.findOne(findOneArgs)
    }

    if (!doc && !hasWherePolicy) throw new NotFound(t)
    if (!doc && hasWherePolicy) throw new Forbidden(t)

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
    if (collectionConfig?.db?.updateOne) {
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
      versionData: rawVersion.version,
    }
    if (collectionConfig?.db?.createVersion) {
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

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default restoreVersion
