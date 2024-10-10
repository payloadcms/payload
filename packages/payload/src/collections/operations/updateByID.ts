import type { DeepPartial } from 'ts-essentials'

import httpStatus from 'http-status'

import type { FindOneArgs } from '../../database/types.js'
import type { Args } from '../../fields/hooks/beforeChange/index.js'
import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type {
  Collection,
  DataFromCollectionSlug,
  RequiredDataFromCollectionSlug,
} from '../config/types.js'

import { ensureUsernameOrEmail } from '../../auth/ensureUsernameOrEmail.js'
import executeAccess from '../../auth/executeAccess.js'
import { generatePasswordSaltHash } from '../../auth/strategies/local/generatePasswordSaltHash.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { uploadFiles } from '../../uploads/uploadFiles.js'
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'
import { saveVersion } from '../../versions/saveVersion.js'
import { buildAfterOperation } from './utils.js'

export type Arguments<TSlug extends CollectionSlug> = {
  autosave?: boolean
  collection: Collection
  data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  depth?: number
  disableVerificationEmail?: boolean
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  overrideLock?: boolean
  overwriteExistingFiles?: boolean
  publishSpecificLocale?: string
  req: PayloadRequest
  showHiddenFields?: boolean
}

export const updateByIDOperation = async <TSlug extends CollectionSlug>(
  incomingArgs: Arguments<TSlug>,
): Promise<DataFromCollectionSlug<TSlug>> => {
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

    if (args.publishSpecificLocale) {
      args.req.locale = args.publishSpecificLocale
    }

    const {
      id,
      autosave = false,
      collection: { config: collectionConfig },
      collection,
      depth,
      draft: draftArg = false,
      overrideAccess,
      overrideLock,
      overwriteExistingFiles = false,
      publishSpecificLocale,
      req: {
        fallbackLocale,
        locale,
        payload: { config },
        payload,
      },
      req,
      showHiddenFields,
    } = args

    if (!id) {
      throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST)
    }

    let { data } = args
    const password = data?.password
    const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts)
    const shouldSavePassword = Boolean(password && collectionConfig.auth && !shouldSaveDraft)

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess({ id, data, operation: 'update', req }, collectionConfig.access.update)
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

    if (!docWithLocales && !hasWherePolicy) {
      throw new NotFound(req.t)
    }
    if (!docWithLocales && hasWherePolicy) {
      throw new Forbidden(req.t)
    }

    // /////////////////////////////////////
    // Handle potentially locked documents
    // /////////////////////////////////////

    await checkDocumentLockStatus({
      id,
      collectionSlug: collectionConfig.slug,
      lockErrorMessage: `Document with ID ${id} is currently locked by another user and cannot be updated.`,
      overrideLock,
      req,
    })

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

    if (args.collection.config.auth) {
      ensureUsernameOrEmail<TSlug>({
        authOptions: args.collection.config.auth,
        collectionSlug: args.collection.config.slug,
        data: args.data,
        operation: 'update',
        originalDoc,
        req: args.req,
      })
    }

    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////

    const { data: newFileData, files: filesToUpload } = await generateFileData({
      collection,
      config,
      data,
      operation: 'update',
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
      req,
    })

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    data = await beforeValidate<DeepPartial<DataFromCollectionSlug<TSlug>>>({
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
      await uploadFiles(payload, filesToUpload, req)
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

    let publishedDocWithLocales = docWithLocales
    let versionSnapshotResult

    const beforeChangeArgs: Args<DataFromCollectionSlug<TSlug>> = {
      id,
      collection: collectionConfig,
      context: req.context,
      data: { ...data, id },
      doc: originalDoc,
      docWithLocales: undefined,
      global: null,
      operation: 'update',
      req,
      skipValidation:
        shouldSaveDraft &&
        collectionConfig.versions.drafts &&
        !collectionConfig.versions.drafts.validate &&
        data._status !== 'published',
    }

    if (publishSpecificLocale) {
      publishedDocWithLocales = await getLatestCollectionVersion({
        id,
        config: collectionConfig,
        payload,
        published: true,
        query: findOneArgs,
        req,
      })

      versionSnapshotResult = await beforeChange({
        ...beforeChangeArgs,
        docWithLocales,
      })
    }

    let result = await beforeChange({
      ...beforeChangeArgs,
      docWithLocales: publishedDocWithLocales,
    })

    // /////////////////////////////////////
    // Handle potential password update
    // /////////////////////////////////////

    const dataToUpdate: Record<string, unknown> = { ...result }

    if (shouldSavePassword && typeof password === 'string') {
      const { hash, salt } = await generatePasswordSaltHash({
        collection: collectionConfig,
        password,
        req,
      })
      dataToUpdate.salt = salt
      dataToUpdate.hash = hash
      delete dataToUpdate.password
      delete data.password
    }

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    if (!shouldSaveDraft || data._status === 'published') {
      result = await req.payload.db.updateOne({
        id,
        collection: collectionConfig.slug,
        data: dataToUpdate,
        locale,
        req,
      })
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
        publishSpecificLocale,
        req,
        snapshot: versionSnapshotResult,
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

    result = await afterChange({
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

    result = await buildAfterOperation({
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

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
