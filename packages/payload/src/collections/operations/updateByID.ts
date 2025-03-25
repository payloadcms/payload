// @ts-strict-ignore
import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'

import type { FindOneArgs } from '../../database/types.js'
import type {
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type {
  Collection,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { type CollectionSlug, deepCopyObjectSimple } from '../../index.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'
import { updateDocument } from './utilities/update.js'
import { buildAfterOperation } from './utils.js'

export type Arguments<TSlug extends CollectionSlug> = {
  autosave?: boolean
  collection: Collection
  data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  depth?: number
  disableTransaction?: boolean
  disableVerificationEmail?: boolean
  draft?: boolean
  id: number | string
  overrideAccess?: boolean
  overrideLock?: boolean
  overwriteExistingFiles?: boolean
  populate?: PopulateType
  publishSpecificLocale?: string
  req: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
}

export const updateByIDOperation = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug> = SelectType,
>(
  incomingArgs: Arguments<TSlug>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
  let args = incomingArgs

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(args.req))

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    if (args.collection.config.hooks?.beforeOperation?.length) {
      for (const hook of args.collection.config.hooks.beforeOperation) {
        args =
          (await hook({
            args,
            collection: args.collection.config,
            context: args.req.context,
            operation: 'update',
            req: args.req,
          })) || args
      }
    }

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
      populate,
      publishSpecificLocale,
      req: {
        fallbackLocale,
        locale,
        payload: { config },
        payload,
      },
      req,
      select: incomingSelect,
      showHiddenFields,
    } = args

    if (!id) {
      throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST)
    }

    const { data } = args

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

    if (!docWithLocales && !hasWherePolicy) {
      throw new NotFound(req.t)
    }
    if (!docWithLocales && hasWherePolicy) {
      throw new Forbidden(req.t)
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

    const select = sanitizeSelect({
      forceSelect: collectionConfig.forceSelect,
      select: incomingSelect,
    })

    // ///////////////////////////////////////////////
    // Update document, runs all document level hooks
    // ///////////////////////////////////////////////

    let result = await updateDocument<TSlug, TSelect>({
      id,
      accessResults,
      autosave,
      collectionConfig,
      config,
      data: deepCopyObjectSimple(newFileData),
      depth,
      docWithLocales,
      draftArg,
      fallbackLocale,
      filesToUpload,
      locale,
      overrideAccess,
      overrideLock,
      payload,
      populate,
      publishSpecificLocale,
      req,
      select,
      showHiddenFields,
    })

    await unlinkTempFiles({
      collectionConfig,
      config,
      req,
    })

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = (await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'updateByID',
      result,
    })) as TransformCollectionWithSelect<TSlug, TSelect>

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
