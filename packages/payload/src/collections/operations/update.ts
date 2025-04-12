// @ts-strict-ignore
import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'

import type { AccessResult } from '../../config/types.js'
import type { PayloadRequest, PopulateType, SelectType, Sort, Where } from '../../types/index.js'
import type {
  BulkOperationResult,
  Collection,
  DataFromCollectionSlug,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import executeAccess from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { APIError } from '../../errors/index.js'
import { type CollectionSlug, deepCopyObjectSimple } from '../../index.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { getQueryDraftsSort } from '../../versions/drafts/getQueryDraftsSort.js'
import { updateDocument } from './utilities/update.js'
import { buildAfterOperation } from './utils.js'

export type Arguments<TSlug extends CollectionSlug> = {
  collection: Collection
  data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  depth?: number
  disableTransaction?: boolean
  disableVerificationEmail?: boolean
  draft?: boolean
  limit?: number
  overrideAccess?: boolean
  overrideLock?: boolean
  overwriteExistingFiles?: boolean
  populate?: PopulateType
  publishSpecificLocale?: string
  req: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-createdAt' // Sort DESC by createdAt
   * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  where: Where
}

export const updateOperation = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: Arguments<TSlug>,
): Promise<BulkOperationResult<TSlug, TSelect>> => {
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

    const {
      collection: { config: collectionConfig },
      collection,
      depth,
      draft: draftArg = false,
      limit = 0,
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
      sort,
      where,
    } = args

    if (!where) {
      throw new APIError("Missing 'where' query of documents to update.", httpStatus.BAD_REQUEST)
    }

    const { data: bulkUpdateData } = args
    const shouldSaveDraft = Boolean(draftArg && collectionConfig.versions.drafts)

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult
    if (!overrideAccess) {
      accessResult = await executeAccess({ req }, collectionConfig.access.update)
    }

    await validateQueryPaths({
      collectionConfig,
      overrideAccess,
      req,
      where,
    })

    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////

    const fullWhere = combineQueries(where, accessResult)

    let docs

    if (collectionConfig.versions?.drafts && shouldSaveDraft) {
      const versionsWhere = appendVersionToQueryKey(fullWhere)

      await validateQueryPaths({
        collectionConfig: collection.config,
        overrideAccess,
        req,
        versionFields: buildVersionCollectionFields(payload.config, collection.config, true),
        where: appendVersionToQueryKey(where),
      })

      const query = await payload.db.queryDrafts<DataFromCollectionSlug<TSlug>>({
        collection: collectionConfig.slug,
        limit,
        locale,
        pagination: false,
        req,
        sort: getQueryDraftsSort({ collectionConfig, sort }),
        where: versionsWhere,
      })

      docs = query.docs
    } else {
      const query = await payload.db.find({
        collection: collectionConfig.slug,
        limit,
        locale,
        pagination: false,
        req,
        sort,
        where: fullWhere,
      })

      docs = query.docs
    }

    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////

    const { data, files: filesToUpload } = await generateFileData({
      collection,
      config,
      data: bulkUpdateData,
      operation: 'update',
      overwriteExistingFiles,
      req,
      throwOnMissingFile: false,
    })

    const errors = []

    const promises = docs.map(async (docWithLocales) => {
      const { id } = docWithLocales

      try {
        const select = sanitizeSelect({
          forceSelect: collectionConfig.forceSelect,
          select: incomingSelect,
        })

        // ///////////////////////////////////////////////
        // Update document, runs all document level hooks
        // ///////////////////////////////////////////////
        const updatedDoc = await updateDocument({
          id,
          accessResults: accessResult,
          autosave: false,
          collectionConfig,
          config,
          data: deepCopyObjectSimple(data),
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

        return updatedDoc
      } catch (error) {
        errors.push({
          id,
          message: error.message,
        })
      }
      return null
    })

    await unlinkTempFiles({
      collectionConfig,
      config,
      req,
    })

    const awaitedDocs = await Promise.all(promises)

    let result = {
      docs: awaitedDocs.filter(Boolean),
      errors,
    }

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'update',
      result,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
