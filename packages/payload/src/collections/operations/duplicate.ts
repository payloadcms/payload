import type { DeepPartial } from 'ts-essentials'

import httpStatus from 'http-status'

import type { FindOneArgs } from '../../database/types.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { Collection, DataFromCollectionSlug } from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeDuplicate } from '../../fields/hooks/beforeDuplicate/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'
import { saveVersion } from '../../versions/saveVersion.js'
import { buildAfterOperation } from './utils.js'

export type Arguments = {
  collection: Collection
  depth?: number
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

export const duplicateOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments,
): Promise<DataFromCollectionSlug<TSlug>> => {
  let args = incomingArgs
  const operation = 'create'

  try {
    const shouldCommit = await initTransaction(args.req)

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
      await priorHook

      args =
        (await hook({
          args,
          collection: args.collection.config,
          context: args.req.context,
          operation,
          req: args.req,
        })) || args
    }, Promise.resolve())

    const {
      id,
      collection: { config: collectionConfig },
      depth,
      draft: draftArg = true,
      overrideAccess,
      req: { fallbackLocale, locale: localeArg, payload },
      req,
      showHiddenFields,
    } = args

    if (!id) {
      throw new APIError('Missing ID of document to duplicate.', httpStatus.BAD_REQUEST)
    }
    const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts)

    // /////////////////////////////////////
    // Read Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, req }, collectionConfig.access.read)
      : true
    const hasWherePolicy = hasWhereAccessResult(accessResults)

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////
    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      locale: req.locale,
      req,
      where: combineQueries({ id: { equals: id } }, accessResults),
    }

    let docWithLocales = await getLatestCollectionVersion({
      id,
      config: collectionConfig,
      payload,
      query: findOneArgs,
      req,
    })

    if (!docWithLocales && !hasWherePolicy) {
      throw new NotFound(req.t)
    }
    if (!docWithLocales && hasWherePolicy) {
      throw new Forbidden(req.t)
    }

    // remove the createdAt timestamp and id to rely on the db to set the default it
    delete docWithLocales.createdAt
    delete docWithLocales.id

    docWithLocales = await beforeDuplicate({
      id,
      collection: collectionConfig,
      context: req.context,
      doc: docWithLocales,
      overrideAccess,
      req,
    })

    // for version enabled collections, override the current status with draft, unless draft is explicitly set to false
    if (shouldSaveDraft) {
      docWithLocales._status = 'draft'
    }

    let result

    const originalDoc = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: 0,
      doc: docWithLocales,
      draft: draftArg,
      fallbackLocale: null,
      global: null,
      locale: req.locale,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    })

    // /////////////////////////////////////
    // Create Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      await executeAccess({ data: originalDoc, req }, collectionConfig.access.create)
    }

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    let data = await beforeValidate<DeepPartial<DataFromCollectionSlug<TSlug>>>({
      id,
      collection: collectionConfig,
      context: req.context,
      data: originalDoc,
      doc: originalDoc,
      duplicate: true,
      global: null,
      operation,
      overrideAccess,
      req,
    })

    // /////////////////////////////////////
    // beforeValidate - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
      await priorHook

      data =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          data,
          operation,
          originalDoc,
          req,
        })) || result
    }, Promise.resolve())

    // /////////////////////////////////////
    // beforeChange - Collection
    // /////////////////////////////////////

    await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
      await priorHook

      data =
        (await hook({
          collection: collectionConfig,
          context: req.context,
          data,
          operation,
          originalDoc: result,
          req,
        })) || result
    }, Promise.resolve())

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    result = await beforeChange({
      id,
      collection: collectionConfig,
      context: req.context,
      data,
      doc: originalDoc,
      docWithLocales,
      global: null,
      operation,
      req,
      skipValidation:
        shouldSaveDraft &&
        collectionConfig.versions.drafts &&
        !collectionConfig.versions.drafts.validate,
    })

    // set req.locale back to the original locale
    req.locale = localeArg

    // /////////////////////////////////////
    // Create / Update
    // /////////////////////////////////////

    const dbArgs = {
      collection: collectionConfig.slug,
      data: result,
      req,
    }

    let versionDoc: DataFromCollectionSlug<TSlug>
    // @ts-expect-error exists
    if (collectionConfig?.db?.create) {
      // @ts-expect-error exists
      versionDoc = await collectionConfig.db.create(dbArgs)
    } else {
      versionDoc = await payload.db.create(dbArgs)
    }

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////

    if (collectionConfig.versions) {
      result = await saveVersion({
        id: versionDoc.id,
        collection: collectionConfig,
        docWithLocales: {
          ...versionDoc,
          createdAt: result.createdAt,
        },
        draft: shouldSaveDraft,
        payload,
        req,
      })
    }

    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////

    result = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth,
      doc: versionDoc,
      draft: draftArg,
      fallbackLocale,
      global: null,
      locale: localeArg,
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
      data: versionDoc,
      doc: result,
      global: null,
      operation,
      previousDoc: {},
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
          operation,
          previousDoc: {},
          req,
        })) || result
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation,
      result,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
