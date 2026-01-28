import { status as httpStatus } from 'http-status'

import type { FindOneArgs } from '../../database/types.js'
import type { JsonObject, PayloadRequest, PopulateType, SelectType } from '../../types/index.js'
import type { Collection, TypeWithID } from '../config/types.js'
import type { FindOptions } from './local/find.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { hasDraftValidationEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'
import { saveVersion } from '../../versions/saveVersion.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'
export type Arguments = {
  collection: Collection
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  disableTransaction?: boolean
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
} & Pick<FindOptions<string, SelectType>, 'select'>

export const restoreVersionOperation = async <
  TData extends JsonObject & TypeWithID = JsonObject & TypeWithID,
>(
  args: Arguments,
): Promise<TData> => {
  const {
    id,
    collection: { config: collectionConfig },
    depth,
    draft: draftArg = false,
    overrideAccess = false,
    populate,
    req,
    req: { fallbackLocale, locale, payload },
    select: incomingSelect,
    showHiddenFields,
  } = args

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(args.req))

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'restoreVersion',
    })

    if (!id) {
      throw new APIError('Missing ID of version to restore.', httpStatus.BAD_REQUEST)
    }

    // /////////////////////////////////////
    // Retrieve original raw version
    // /////////////////////////////////////

    const { docs: versionDocs } = await req.payload.db.findVersions({
      collection: collectionConfig.slug,
      limit: 1,
      locale: locale!,
      pagination: false,
      req,
      where: { id: { equals: id } },
    })

    const [rawVersionToRestore] = versionDocs

    if (!rawVersionToRestore) {
      throw new NotFound(req.t)
    }

    const { parent: parentDocID, version: versionToRestoreWithLocales } = rawVersionToRestore

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
      locale: locale!,
      req,
      where: combineQueries({ id: { equals: parentDocID } }, accessResults),
    }

    // Get the document from the non versioned collection
    const doc = await req.payload.db.findOne<TData>(findOneArgs)

    if (!doc && !hasWherePolicy) {
      throw new NotFound(req.t)
    }
    if (!doc && hasWherePolicy) {
      throw new Forbidden(req.t)
    }

    if (collectionConfig.trash && doc?.deletedAt) {
      throw new APIError(
        `Cannot restore a version of a trashed document (ID: ${parentDocID}). Restore the document first.`,
        httpStatus.FORBIDDEN,
      )
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

    // originalDoc with hoisted localized data
    const originalDoc = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: 0,
      doc: deepCopyObjectSimple(prevDocWithLocales),
      draft: draftArg,
      fallbackLocale: null,
      global: null,
      locale: locale!,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    })

    // version data with hoisted localized data
    const prevVersionDoc = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: 0,
      doc: deepCopyObjectSimple(rawVersionToRestore.version),
      draft: draftArg,
      fallbackLocale: null,
      global: null,
      locale: locale!,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    })

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    let data = await beforeValidate({
      id: parentDocID,
      collection: collectionConfig,
      context: req.context,
      data: deepCopyObjectSimple(prevVersionDoc),
      doc: originalDoc,
      global: null,
      operation: 'update',
      overrideAccess,
      req,
    })

    // /////////////////////////////////////
    // beforeValidate - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeValidate?.length) {
      for (const hook of collectionConfig.hooks.beforeValidate) {
        data =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            data,
            operation: 'update',
            originalDoc,
            req,
          })) || data
      }
    }

    // /////////////////////////////////////
    // beforeChange - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeChange?.length) {
      for (const hook of collectionConfig.hooks.beforeChange) {
        data =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            data,
            operation: 'update',
            originalDoc,
            req,
          })) || data
      }
    }

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    let result = await beforeChange({
      id: parentDocID,
      collection: collectionConfig,
      context: req.context,
      data: { ...data, id: parentDocID },
      doc: originalDoc,
      docWithLocales: versionToRestoreWithLocales,
      global: null,
      operation: 'update',
      overrideAccess,
      req,
      skipValidation: draftArg && !hasDraftValidationEnabled(collectionConfig),
    })

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    const select = sanitizeSelect({
      fields: collectionConfig.flattenedFields,
      forceSelect: collectionConfig.forceSelect,
      select: incomingSelect,
    })

    // Ensure updatedAt date is always updated
    result.updatedAt = new Date().toISOString()
    // Ensure status respects restoreAsDraft arg
    result._status = draftArg ? 'draft' : result._status
    if (!draftArg) {
      result = await req.payload.db.updateOne({
        id: parentDocID,
        collection: collectionConfig.slug,
        data: result,
        req,
        select,
      })
    }

    // /////////////////////////////////////
    // Save restored doc as a new version
    // /////////////////////////////////////

    result = await saveVersion({
      id: parentDocID,
      autosave: false,
      collection: collectionConfig,
      docWithLocales: result,
      draft: draftArg,
      operation: 'restoreVersion',
      payload,
      req,
      select,
    })

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: depth!,
      doc: result,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      draft: undefined,
      fallbackLocale: fallbackLocale!,
      global: null,
      locale: locale!,
      overrideAccess,
      populate,
      req,
      select,
      showHiddenFields: showHiddenFields!,
    })

    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterRead?.length) {
      for (const hook of collectionConfig.hooks.afterRead) {
        result =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            doc: result,
            overrideAccess,
            req,
          })) || result
      }
    }

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

    if (collectionConfig.hooks?.afterChange?.length) {
      for (const hook of collectionConfig.hooks.afterChange) {
        result =
          (await hook({
            collection: collectionConfig,
            context: req.context,
            data: result,
            doc: result,
            operation: 'update',
            previousDoc: prevDocWithLocales,
            req,
          })) || result
      }
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'restoreVersion',
      result,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
