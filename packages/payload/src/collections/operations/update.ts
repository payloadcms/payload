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

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/index.js'
import { type CollectionSlug, deepCopyObjectSimple, type FindOptions } from '../../index.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { hasDraftsEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isErrorPublic } from '../../utilities/isErrorPublic.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { getQueryDraftsSort } from '../../versions/drafts/getQueryDraftsSort.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'
import { sanitizeSortQuery } from './utilities/sanitizeSortQuery.js'
import { updateDocument } from './utilities/update.js'

export type Arguments<TSlug extends CollectionSlug> = {
  autosave?: boolean
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
  publishAllLocales?: boolean
  publishSpecificLocale?: string
  req: PayloadRequest
  showHiddenFields?: boolean
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-createdAt' // Sort DESC by createdAt
   * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  trash?: boolean
  unpublishAllLocales?: boolean
  where: Where
} & Pick<FindOptions<TSlug, SelectType>, 'select'>

export const updateOperation = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  incomingArgs: Arguments<TSlug>,
): Promise<BulkOperationResult<TSlug, TSelect>> => {
  let args = incomingArgs

  if (args.collection.config.disableBulkEdit && !args.overrideAccess) {
    throw new APIError(`Collection ${args.collection.config.slug} has disabled bulk edit`, 403)
  }

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(args.req))

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'update',
    })

    const {
      autosave = false,
      collection: { config: collectionConfig },
      collection,
      depth,
      draft: draftArg = false,
      limit = 0,
      overrideAccess,
      overrideLock,
      overwriteExistingFiles = false,
      populate,
      publishAllLocales,
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
      sort: incomingSort,
      trash = false,
      unpublishAllLocales,
      where,
    } = args

    if (!where) {
      throw new APIError("Missing 'where' query of documents to update.", httpStatus.BAD_REQUEST)
    }

    const { data: bulkUpdateData } = args
    const shouldSaveDraft = Boolean(draftArg && hasDraftsEnabled(collectionConfig))

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult
    if (!overrideAccess) {
      accessResult = await executeAccess({ req }, collectionConfig.access.update)
    }

    await validateQueryPaths({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req,
      where,
    })

    // /////////////////////////////////////
    // Retrieve documents
    // /////////////////////////////////////

    let fullWhere = combineQueries(where, accessResult!)

    const isTrashAttempt =
      collectionConfig.trash &&
      typeof bulkUpdateData === 'object' &&
      bulkUpdateData !== null &&
      'deletedAt' in bulkUpdateData &&
      bulkUpdateData.deletedAt != null

    // Enforce delete access if performing a soft-delete (trash)
    if (isTrashAttempt && !overrideAccess) {
      const deleteAccessResult = await executeAccess({ req }, collectionConfig.access.delete)
      fullWhere = combineQueries(fullWhere, deleteAccessResult)
    }

    // Exclude trashed documents when trash: false
    fullWhere = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash,
      where: fullWhere,
    })

    sanitizeWhereQuery({ fields: collectionConfig.flattenedFields, payload, where: fullWhere })

    const sort = sanitizeSortQuery({
      fields: collection.config.flattenedFields,
      sort: incomingSort,
    })

    let docs

    if (hasDraftsEnabled(collectionConfig) && shouldSaveDraft) {
      const versionsWhere = appendVersionToQueryKey(fullWhere)

      await validateQueryPaths({
        collectionConfig: collection.config,
        overrideAccess: overrideAccess!,
        req,
        versionFields: buildVersionCollectionFields(payload.config, collection.config, true),
        where: appendVersionToQueryKey(where),
      })

      const query = await payload.db.queryDrafts<DataFromCollectionSlug<TSlug>>({
        collection: collectionConfig.slug,
        limit,
        locale: locale!,
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
        locale: locale!,
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

    const errors: BulkOperationResult<TSlug, TSelect>['errors'] = []

    const promises = docs.map(async (docWithLocales) => {
      const { id } = docWithLocales

      try {
        // Each document gets its own transaction when singleTransaction is enabled
        let docShouldCommit = false
        if (req.payload.db.bulkOperationsSingleTransaction) {
          docShouldCommit = await initTransaction(req)
        }

        const select = sanitizeSelect({
          fields: collectionConfig.flattenedFields,
          forceSelect: collectionConfig.forceSelect,
          select: incomingSelect,
        })

        // ///////////////////////////////////////////////
        // Update document, runs all document level hooks
        // ///////////////////////////////////////////////
        const updatedDoc = await updateDocument({
          id,
          autosave,
          collectionConfig,
          config,
          data: deepCopyObjectSimple(data),
          depth: depth!,
          docWithLocales,
          draftArg,
          fallbackLocale: fallbackLocale!,
          filesToUpload,
          locale: locale!,
          overrideAccess: overrideAccess!,
          overrideLock: overrideLock!,
          payload,
          populate,
          publishAllLocales,
          publishSpecificLocale,
          req,
          select: select!,
          showHiddenFields: showHiddenFields!,
          unpublishAllLocales,
        })

        if (docShouldCommit) {
          await commitTransaction(req)
        }

        return updatedDoc
      } catch (error) {
        const isPublic = error instanceof Error ? isErrorPublic(error, config) : false

        if (req.payload.db.bulkOperationsSingleTransaction) {
          await killTransaction(req)
        }
        errors.push({
          id,
          isPublic,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      return null
    })

    await unlinkTempFiles({
      collectionConfig,
      config,
      req,
    })

    // Process sequentially when using single transaction mode to avoid shared state issues
    // Process in parallel when using one transaction for better performance
    let awaitedDocs: (DataFromCollectionSlug<TSlug> | null)[]
    if (req.payload.db.bulkOperationsSingleTransaction) {
      awaitedDocs = []
      for (const promise of promises) {
        awaitedDocs.push(await promise)
      }
    } else {
      awaitedDocs = await Promise.all(promises)
    }

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
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      result,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return result
  } catch (error: unknown) {
    await killTransaction(args.req)
    throw error
  }
}
