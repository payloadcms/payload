import type { DeepPartial } from 'ts-essentials'

import httpStatus from 'http-status'

import type { FindOneArgs } from '../../database/types'
import type { PayloadRequest } from '../../express/types'
import type { GeneratedTypes } from '../../index'
import type { Collection } from '../config/types'

import executeAccess from '../../auth/executeAccess'
import { generatePasswordSaltHash } from '../../auth/strategies/local/generatePasswordSaltHash'
import { hasWhereAccessResult } from '../../auth/types'
import { combineQueries } from '../../database/combineQueries'
import { APIError, Forbidden, NotFound } from '../../errors'
import { afterChange } from '../../fields/hooks/afterChange'
import { afterRead } from '../../fields/hooks/afterRead'
import { beforeChange } from '../../fields/hooks/beforeChange'
import { beforeValidate } from '../../fields/hooks/beforeValidate'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles'
import { generateFileData } from '../../uploads/generateFileData'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles'
import { uploadFiles } from '../../uploads/uploadFiles'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion'
import { saveVersion } from '../../versions/saveVersion'
import { buildAfterOperation } from './utils'

export type Arguments<T extends { [field: number | string | symbol]: unknown }> = {
  autosave?: boolean
  collection: Collection
  data: DeepPartial<T>
  depth?: number
  disableVerificationEmail?: boolean
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
}

async function updateByID<TSlug extends keyof GeneratedTypes['collections']>(
  incomingArgs: Arguments<GeneratedTypes['collections'][TSlug]>,
): Promise<GeneratedTypes['collections'][TSlug]> {
  let args = incomingArgs

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
          operation: 'update',
          req: args.req,
        })) || args
    }, Promise.resolve())

    const {
      id,
      autosave = false,
      collection: { config: collectionConfig },
      collection,
      depth,
      draft: draftArg = false,
      overrideAccess,
      overwriteExistingFiles = false,
      req: {
        fallbackLocale,
        locale,
        payload: { config },
        payload,
        t,
      },
      req,
      showHiddenFields,
    } = args

    if (!id) {
      throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST)
    }

    let { data } = args
    const dataHasPassword = 'password' in data && data.password
    const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts)
    const shouldSavePassword = Boolean(dataHasPassword && collectionConfig.auth && !shouldSaveDraft)

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, data, req }, collectionConfig.access.update)
      : true
    const hasWherePolicy = hasWhereAccessResult(accessResults)

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////

    const findOneArgs: FindOneArgs = {
      collection: collectionConfig.slug,
      locale,
      req,
      where: combineQueries({ id: { equals: id } }, accessResults),
    }

    const docWithLocales = await getLatestCollectionVersion({
      id,
      config: collectionConfig,
      payload,
      query: findOneArgs,
      req,
    })

    if (!docWithLocales && !hasWherePolicy) throw new NotFound(t)
    if (!docWithLocales && hasWherePolicy) throw new Forbidden(t)

    const originalDoc = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: 0,
      doc: docWithLocales,
      draft: draftArg,
      fallbackLocale: null,
      global: null,
      locale,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    })

    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////

    const { data: newFileData, files: filesToUpload } = await generateFileData({
      collection,
      config,
      data,
      operation: 'update',
      originalDoc,
      overwriteExistingFiles,
      req,
      throwOnMissingFile: false,
    })

    data = newFileData

    // /////////////////////////////////////
    // Delete any associated files
    // /////////////////////////////////////

    await deleteAssociatedFiles({
      collectionConfig,
      config,
      doc: docWithLocales,
      files: filesToUpload,
      overrideDelete: false,
      t,
    })

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    data = await beforeValidate<DeepPartial<GeneratedTypes['collections'][TSlug]>>({
      id,
      collection: collectionConfig,
      context: req.context,
      data,
      doc: originalDoc,
      global: null,
      operation: 'update',
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
          operation: 'update',
          originalDoc,
          req,
        })) || data
    }, Promise.resolve())

    // /////////////////////////////////////
    // Write files to local storage
    // /////////////////////////////////////

    if (!collectionConfig.upload.disableLocalStorage) {
      await uploadFiles(payload, filesToUpload, t)
    }

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
          operation: 'update',
          originalDoc,
          req,
        })) || data
    }, Promise.resolve())

    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////

    let result = await beforeChange<GeneratedTypes['collections'][TSlug]>({
      id,
      collection: collectionConfig,
      context: req.context,
      data,
      doc: originalDoc,
      docWithLocales,
      global: null,
      operation: 'update',
      req,
      skipValidation:
        shouldSaveDraft &&
        collectionConfig.versions.drafts &&
        !collectionConfig.versions.drafts.validate &&
        data._status !== 'published',
    })

    // /////////////////////////////////////
    // Handle potential password update
    // /////////////////////////////////////

    const dataToUpdate: Record<string, unknown> = { ...result }
    const { password } = dataToUpdate
    if (shouldSavePassword && typeof password === 'string') {
      const { hash, salt } = await generatePasswordSaltHash({ password })
      dataToUpdate.salt = salt
      dataToUpdate.hash = hash
      delete dataToUpdate.password
      delete data.password
    }

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    if (!shouldSaveDraft || data._status === 'published') {
      const dbArgs = {
        id,
        collection: collectionConfig.slug,
        data: dataToUpdate,
        locale,
        req,
      }
      if (collectionConfig?.db?.updateOne) {
        result = await collectionConfig.db.updateOne(dbArgs)
      } else {
        result = await req.payload.db.updateOne(dbArgs)
      }
    }

    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////

    if (collectionConfig.versions) {
      result = await saveVersion({
        id,
        autosave,
        collection: collectionConfig,
        docWithLocales: {
          ...result,
          createdAt: docWithLocales.createdAt,
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
      doc: result,
      draft: draftArg,
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

    result = await afterChange<GeneratedTypes['collections'][TSlug]>({
      collection: collectionConfig,
      context: req.context,
      data,
      doc: result,
      global: null,
      operation: 'update',
      previousDoc: originalDoc,
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
          previousDoc: originalDoc,
          req,
        })) || result
    }, Promise.resolve())

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation<GeneratedTypes['collections'][TSlug]>({
      args,
      collection: collectionConfig,
      operation: 'updateByID',
      result,
    })

    await unlinkTempFiles({
      collectionConfig,
      config,
      req,
    })

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}

export default updateByID
