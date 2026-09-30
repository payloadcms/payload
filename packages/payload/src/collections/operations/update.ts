import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { AccessResult } from '../../config/types.js'
import type { PayloadRequest, PopulateType, SelectType, Sort, Where } from '../../types/index.js'
import type { UploadFileRollbacks } from '../../uploads/uploadFileRollback.js'
import type { DeferredCleanupScope } from '../../utilities/transactionCallbacks.js'
import type {
  BulkOperationResult,
  Collection,
  DataFromCollectionSlug,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { forkDocument } from '../../branching/forkDocument.js'
import {
  refreshRequestDataLoader,
  resetBranchState,
  resolveBranch,
} from '../../branching/resolveBranch.js'
import { branchField, MAIN_BRANCH } from '../../branching/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { validateQueryPaths } from '../../database/queryValidation/validateQueryPaths.js'
import { validateSortQuery } from '../../database/queryValidation/validateSortQuery.js'
import { sanitizeWhereQuery } from '../../database/sanitizeWhereQuery.js'
import { APIError } from '../../errors/index.js'
import { type CollectionSlug, type FindOptions } from '../../index.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import {
  getLocalizedUploadProperties,
  getUploadDestination,
  mergeUploadDataWithDocument,
  sanitizeUploadData,
} from '../../uploads/sanitizeUploadData.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import {
  cleanupUploadFileRollbacks,
  rollbackUploadFiles,
} from '../../uploads/uploadFileRollback.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import {
  commitTransaction,
  shouldRollbackTransactionArtifacts,
} from '../../utilities/commitTransaction.js'
import { hasDraftsEnabled, hasLocalizeStatusEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isErrorPublic } from '../../utilities/isErrorPublic.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import {
  beginDeferredCleanupScope,
  clearDeferredCleanupScope,
  createIsolatedDeferredCleanupContext,
  flushDeferredCleanupScope,
  flushDeferredCleanupScopeAfterOperation,
} from '../../utilities/transactionCallbacks.js'
import {
  hasTransactionWrite,
  runInTransactionMutationScope,
} from '../../utilities/transactionMutationTracker.js'
import {
  getAllLocalesPublicationStatus,
  normalizeAllLocalesPublicationStatus,
  reconcileAllLocalesPublicationStatus,
  validateAllLocalesPublicationFlags,
} from '../../versions/allLocalesPublicationStatus.js'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
import { getQueryDraftsSort } from '../../versions/drafts/getQueryDraftsSort.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'
import { copyDataWithFreshRowIDs } from './utilities/copyDataWithFreshRowIDs.js'
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
  let cleanupScope: DeferredCleanupScope | null = null
  let shouldUsePerDocumentBranchTransactions = false
  let shouldCommit = false
  const uploadFileRollbacks: UploadFileRollbacks = new Map()

  if (args.collection.config.disableBulkEdit && !args.overrideAccess) {
    throw new APIError(`Collection ${args.collection.config.slug} has disabled bulk edit`, 403)
  }

  try {
    const branch = resolveBranch(args.req)
    const isBranchUpdate =
      branch !== MAIN_BRANCH &&
      Boolean(
        args.req.payload.config.branching?.branchableCollections.has(args.collection.config.slug),
      )
    const hasCallerTransaction = Boolean(await args.req.transactionID)

    shouldUsePerDocumentBranchTransactions = isBranchUpdate && !hasCallerTransaction
    shouldCommit =
      !args.disableTransaction &&
      !args.req.payload.db.bulkOperationsSingleTransaction &&
      !shouldUsePerDocumentBranchTransactions &&
      (await initTransaction(args.req))
    cleanupScope = await beginDeferredCleanupScope({ req: args.req })

    if (args.collection.config.upload && !args.overrideAccess) {
      const { objectKey, prefix } = getUploadDestination({ data: args.data, file: args.req.file })
      const data = sanitizeUploadData(args.data, 'update')

      args = {
        ...args,
        data:
          typeof data === 'object' && data !== null
            ? {
                ...data,
                ...(prefix !== undefined ? { prefix } : {}),
                ...(objectKey !== undefined ? { _objectKey: objectKey } : {}),
              }
            : data,
      }
    }

    validateAllLocalesPublicationFlags({
      publishAllLocales: args.publishAllLocales,
      unpublishAllLocales: args.unpublishAllLocales,
    })

    const initialCollectionConfig = args.collection.config
    const initialAllLocalesPublicationStatus = getAllLocalesPublicationStatus({
      hasLocalizedStatus: Boolean(
        args.req.payload.config.localization && hasLocalizeStatusEnabled(initialCollectionConfig),
      ),
      publishAllLocales:
        !args.draft &&
        (args.publishAllLocales ??
          !(hasLocalizeStatusEnabled(initialCollectionConfig) && args.req.locale !== 'all')),
      unpublishAllLocales: Boolean(args.unpublishAllLocales),
    })

    const initialAllLocalesPublicationIntent = normalizeAllLocalesPublicationStatus({
      data: args.data,
      status: initialAllLocalesPublicationStatus,
    })
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'update',
      overrideAccess: args.overrideAccess!,
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
      publishAllLocales: publishAllLocalesArg,
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
      unpublishAllLocales: unpublishAllLocalesArg,
      where,
    } = args

    if (!where) {
      throw new APIError("Missing 'where' query of documents to update.", httpStatus.BAD_REQUEST)
    }

    const { data: bulkUpdateData } = args

    validateAllLocalesPublicationFlags({
      publishAllLocales: publishAllLocalesArg,
      unpublishAllLocales: unpublishAllLocalesArg,
    })

    const requestedAllLocalesPublicationStatus = getAllLocalesPublicationStatus({
      hasLocalizedStatus: Boolean(
        config.localization && hasLocalizeStatusEnabled(collectionConfig),
      ),
      publishAllLocales:
        !draftArg &&
        (publishAllLocalesArg ?? !(hasLocalizeStatusEnabled(collectionConfig) && locale !== 'all')),
      unpublishAllLocales: Boolean(unpublishAllLocalesArg),
    })
    const allLocalesPublicationStatus = reconcileAllLocalesPublicationStatus({
      data: bulkUpdateData,
      intent: initialAllLocalesPublicationIntent,
      status: requestedAllLocalesPublicationStatus,
    })
    const publicationIntentSurvivedBeforeOperation =
      !requestedAllLocalesPublicationStatus || Boolean(allLocalesPublicationStatus)
    const publishAllLocales = publicationIntentSurvivedBeforeOperation
      ? publishAllLocalesArg
      : false
    const unpublishAllLocales = publicationIntentSurvivedBeforeOperation
      ? unpublishAllLocalesArg
      : false

    const shouldSaveDraft = Boolean(draftArg && hasDraftsEnabled(collectionConfig))

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    let accessResult: AccessResult
    if (!overrideAccess) {
      accessResult = await executeAccess(
        { slug: collectionConfig.slug, data: bulkUpdateData, req },
        collectionConfig.access.update,
      )
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
      // Pass data so access function can check data.deletedAt to know it's a trash attempt
      const deleteAccessResult = await executeAccess(
        { slug: collectionConfig.slug, data: bulkUpdateData, req },
        collectionConfig.access.delete,
      )
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
      sort: incomingSort || collectionConfig.defaultSort,
    })

    await validateSortQuery({
      collectionConfig,
      overrideAccess: overrideAccess!,
      req,
      sort,
    })

    if (hasDraftsEnabled(collectionConfig) && (shouldSaveDraft || isTrashAttempt)) {
      await validateQueryPaths({
        collectionConfig: collection.config,
        overrideAccess: overrideAccess!,
        req,
        versionFields: buildVersionCollectionFields(payload.config, collection.config, true),
        where: appendVersionToQueryKey(where),
      })
    }

    const runQuery = async ({
      queryLimit = limit,
      queryReq = req,
      queryWhere = fullWhere,
    }: {
      queryLimit?: number
      queryReq?: PayloadRequest
      queryWhere?: Where
    } = {}) => {
      if (hasDraftsEnabled(collectionConfig) && (shouldSaveDraft || isTrashAttempt)) {
        const versionsWhere = appendVersionToQueryKey(queryWhere)

        const query = await payload.db.queryDrafts<DataFromCollectionSlug<TSlug>>({
          collection: collectionConfig.slug,
          limit: queryLimit,
          locale: locale!,
          pagination: false,
          req: queryReq,
          sort: getQueryDraftsSort({ collectionConfig, sort }),
          where: versionsWhere,
        })

        return query.docs
      }

      const query = await payload.db.find({
        collection: collectionConfig.slug,
        limit: queryLimit,
        locale: locale!,
        pagination: false,
        req: queryReq,
        sort,
        where: queryWhere,
      })

      return query.docs
    }

    const docs = await runQuery()

    const sharedGeneratedFileData =
      !collectionConfig.upload || (overrideAccess && Boolean(req.file))
        ? await generateFileData({
            collection,
            config,
            data: bulkUpdateData,
            operation: 'update',
            overwriteExistingFiles,
            req,
            throwOnMissingFile: false,
          })
        : null

    const errors: BulkOperationResult<TSlug, TSelect>['errors'] = []
    // File replacement cleanup needs a per-document checkpoint. Process file uploads in order so
    // each checkpoint remains the active nested scope until that document finishes.
    const shouldProcessDocumentsSequentially =
      isBranchUpdate ||
      req.payload.db.bulkOperationsSingleTransaction ||
      hasCallerTransaction ||
      Boolean(collectionConfig.upload && (req.file || shouldCommit))

    const processDocument = (initialDocWithLocales: (typeof docs)[number]) =>
      runInTransactionMutationScope({
        adapter: req.payload.db,
        callback: async (transactionMutationScope) => {
          const { id } = initialDocWithLocales
          let documentCleanupScope: DeferredCleanupScope | null = null
          let documentReq = req
          let documentTempFilePath: string | undefined
          let docShouldCommit = false
          let hasEnteredUpdateDocument = false
          let hasWrittenTransactionArtifact = false
          const documentUploadFileRollbacks: UploadFileRollbacks = new Map()

          if (collectionConfig.upload) {
            documentReq = isolateObjectProperty(documentReq, [
              'context',
              'file',
              'payloadUploadSizes',
            ])
            documentReq.context = createIsolatedDeferredCleanupContext({ req })
            delete documentReq.context._payloadCloudStorage
            documentReq.file = req.file ? { ...req.file } : undefined
            documentReq.payloadUploadSizes =
              sharedGeneratedFileData === null ? {} : { ...req.payloadUploadSizes }
          }

          try {
            // Branch updates need a transaction per result so a caught document failure can roll back
            // its fork without removing successful documents from the same bulk operation.
            if (
              !args.disableTransaction &&
              (req.payload.db.bulkOperationsSingleTransaction ||
                shouldUsePerDocumentBranchTransactions)
            ) {
              docShouldCommit = await initTransaction(documentReq)
            }
            if (collectionConfig.upload || shouldProcessDocumentsSequentially) {
              documentCleanupScope = await beginDeferredCleanupScope({ req: documentReq })
            }

            let docWithLocales = initialDocWithLocales

            if (isBranchUpdate) {
              const isExistingBranchDocument =
                (docWithLocales as Record<string, unknown>)[branchField] === branch

              if (hasCallerTransaction && !isExistingBranchDocument) {
                throw new APIError(
                  'Cannot update an untouched branch document within an existing transaction.',
                  httpStatus.CONFLICT,
                )
              }

              await forkDocument({
                id,
                collectionSlug: collection.config.slug,
                req: documentReq,
                // Without an operation-owned transaction, keep the isolated race-recovery path. An
                // adapter with transactions disabled or unavailable cannot roll back a later hook
                // failure after its write has completed.
                useAmbientTransaction: docShouldCommit,
              })

              const branchDocuments = await runQuery({
                queryLimit: 1,
                queryReq: documentReq,
                queryWhere: combineQueries(fullWhere, { id: { equals: id } }),
              })
              const branchDocument = branchDocuments[0]

              if (!branchDocument) {
                throw new Error('Unable to read the branch document after creating its shadow.')
              }

              docWithLocales = branchDocument
            }

            const documentFile = documentReq.file ? { ...documentReq.file } : undefined
            if (collectionConfig.upload && !overrideAccess && documentFile?.tempFilePath) {
              const extension = path.extname(documentFile.tempFilePath)
              documentTempFilePath = path.join(
                path.dirname(documentFile.tempFilePath),
                `${path.basename(documentFile.tempFilePath, extension)}-${randomUUID()}${extension}`,
              )
              await fs.copyFile(documentFile.tempFilePath, documentTempFilePath)
              documentFile.tempFilePath = documentTempFilePath
            }

            if (collectionConfig.upload && documentFile) {
              documentReq.file = documentFile
            }
            const generatedFileData =
              sharedGeneratedFileData ??
              (await generateFileData({
                collection,
                config,
                data: mergeUploadDataWithDocument(bulkUpdateData, docWithLocales, {
                  locale:
                    locale === 'all' || !locale
                      ? config.localization
                        ? config.localization.defaultLocale
                        : undefined
                      : locale,
                  localizedProperties: getLocalizedUploadProperties(
                    collectionConfig.flattenedFields,
                  ),
                }),
                operation: 'update',
                originalDoc: docWithLocales,
                overwriteExistingFiles,
                req: documentReq,
                throwOnMissingFile: false,
              }))

            const shouldTrackUploadFileRollback = Boolean(
              (shouldCommit || docShouldCommit) &&
                collectionConfig.upload &&
                !collectionConfig.upload.disableLocalStorage,
            )

            const select = sanitizeSelect({
              fields: collectionConfig.flattenedFields,
              select: resolveSelect({
                config: collectionConfig.select,
                operation: 'update',
                req,
                select: incomingSelect,
              }),
            })

            // ///////////////////////////////////////////////
            // Update document, runs all document level hooks
            // ///////////////////////////////////////////////
            hasEnteredUpdateDocument = true
            hasWrittenTransactionArtifact =
              shouldTrackUploadFileRollback && generatedFileData.files.length > 0
            let updatedDoc = await updateDocument({
              id,
              autosave,
              collectionConfig,
              config,
              data: copyDataWithFreshRowIDs({
                config,
                data: generatedFileData.data,
                existingDoc: docWithLocales,
                fields: collectionConfig.fields,
              }),
              depth: depth!,
              docWithLocales,
              draftArg,
              fallbackLocale: fallbackLocale!,
              filesToUpload: generatedFileData.files,
              locale: locale!,
              onBeforeDocumentWrite: () => {
                hasWrittenTransactionArtifact = true
              },
              overrideAccess: overrideAccess!,
              overrideLock: overrideLock!,
              payload,
              populate,
              publishAllLocales,
              req: documentReq,
              select: select!,
              showHiddenFields: showHiddenFields!,
              unpublishAllLocales,
              uploadFileRollbacks: shouldTrackUploadFileRollback
                ? docShouldCommit
                  ? documentUploadFileRollbacks
                  : uploadFileRollbacks
                : undefined,
            })

            // /////////////////////////////////////
            // Add collection property for auth collections
            // /////////////////////////////////////

            if (collectionConfig.auth) {
              updatedDoc = { ...updatedDoc, collection: collectionConfig.slug }
            }

            if (documentCleanupScope) {
              if (documentCleanupScope.transactionID === undefined) {
                await flushDeferredCleanupScopeAfterOperation({
                  req: documentReq,
                  scope: documentCleanupScope,
                })
              } else {
                await flushDeferredCleanupScope({ req: documentReq, scope: documentCleanupScope })
              }
            }
            if (docShouldCommit) {
              await commitTransaction(documentReq)

              await cleanupUploadFileRollbacks({ rollbacks: documentUploadFileRollbacks }).catch(
                (error) => {
                  args.req.payload.logger.error({
                    err: error,
                    msg: 'Failed to remove an upload rollback backup after committing its document database write.',
                  })
                },
              )
            }

            return updatedDoc
          } catch (error) {
            const isPublic = error instanceof Error ? isErrorPublic(error, config) : false
            const shouldRollbackArtifacts = shouldRollbackTransactionArtifacts({ error })

            if (documentCleanupScope) {
              clearDeferredCleanupScope({ req: documentReq, scope: documentCleanupScope })
            }
            if (docShouldCommit) {
              await killTransaction(documentReq)

              if (shouldRollbackArtifacts) {
                await rollbackUploadFiles({ rollbacks: documentUploadFileRollbacks }).catch(
                  (rollbackError) => {
                    args.req.payload.logger.error({
                      err: rollbackError,
                      msg: 'Failed to restore upload files after rolling back their document database write.',
                    })
                  },
                )
              }
            }
            if (isBranchUpdate) {
              resetBranchState(documentReq)
            }
            if (
              (hasCallerTransaction && hasEnteredUpdateDocument) ||
              (shouldCommit &&
                (hasTransactionWrite({ scope: transactionMutationScope }) ||
                  hasWrittenTransactionArtifact))
            ) {
              throw error
            }
            errors.push({
              id,
              isPublic,
              message: error instanceof Error ? error.message : 'Unknown error',
            })
          } finally {
            if (documentTempFilePath) {
              await fs.rm(documentTempFilePath, { force: true }).catch((error) => {
                req.payload.logger.error({ err: error, msg: 'Failed to remove temp file copy' })
              })
            }
          }
          return null
        },
      })

    // Upload processing may mutate its temp file while cropping, so each upload document must
    // finish before the next starts. Branch updates also run in order because each result owns its
    // fork transaction. Other metadata-only bulk updates retain their parallel behavior.
    let awaitedDocs: (DataFromCollectionSlug<TSlug> | null)[]
    if (shouldProcessDocumentsSequentially) {
      awaitedDocs = []
      for (const doc of docs) {
        awaitedDocs.push(await processDocument(doc))
      }
    } else {
      const documentPromises = docs.map(processDocument)

      try {
        awaitedDocs = await Promise.all(documentPromises)
      } catch (error) {
        await Promise.allSettled(documentPromises)
        throw error
      }
    }

    await unlinkTempFiles({
      collectionConfig,
      config,
      req,
    }).catch((unlinkError) => {
      req.payload.logger.error({ err: unlinkError, msg: 'Failed to remove temp file' })
    })

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
      overrideAccess,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      result,
    })

    if (cleanupScope) {
      if (errors.length === 0 || shouldProcessDocumentsSequentially) {
        await flushDeferredCleanupScopeAfterOperation({ req, scope: cleanupScope })
      } else {
        clearDeferredCleanupScope({ req: args.req, scope: cleanupScope })
      }
    }
    if (shouldCommit) {
      await commitTransaction(req)

      await cleanupUploadFileRollbacks({ rollbacks: uploadFileRollbacks }).catch((error) => {
        args.req.payload.logger.error({
          err: error,
          msg: 'Failed to remove an upload rollback backup after committing its database write.',
        })
      })
    }

    if (isBranchUpdate) {
      refreshRequestDataLoader(req)
    }

    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return result
  } catch (error: unknown) {
    const shouldRollbackArtifacts = shouldRollbackTransactionArtifacts({ error })

    if (shouldUsePerDocumentBranchTransactions) {
      resetBranchState(args.req)
    }

    if (cleanupScope) {
      clearDeferredCleanupScope({ req: args.req, scope: cleanupScope })
    }

    await unlinkTempFiles({
      collectionConfig: args.collection.config,
      config: args.req.payload.config,
      req: args.req,
    }).catch((unlinkError) => {
      args.req.payload.logger.error({ err: unlinkError, msg: 'Failed to remove temp file' })
    })
    if (shouldCommit) {
      await killTransaction(args.req)

      if (shouldRollbackArtifacts) {
        await rollbackUploadFiles({ rollbacks: uploadFileRollbacks }).catch((error) => {
          args.req.payload.logger.error({
            err: error,
            msg: 'Failed to restore upload files after rolling back their database write.',
          })
        })
      }
    }
    throw error
  }
}
