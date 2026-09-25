import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

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
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { assertNoValidationWrite } from '../../utilities/assertNoValidationWrite.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { hasDraftsEnabled, hasLocalizeStatusEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isErrorPublic } from '../../utilities/isErrorPublic.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
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

  assertNoValidationWrite(args.req)

  if (args.collection.config.disableBulkEdit && !args.overrideAccess) {
    throw new APIError(`Collection ${args.collection.config.slug} has disabled bulk edit`, 403)
  }

  try {
    const shouldCommit = !args.disableTransaction && (await initTransaction(args.req))

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

    let docs

    if (hasDraftsEnabled(collectionConfig) && (shouldSaveDraft || isTrashAttempt)) {
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

    const processDocument = async (docWithLocales: (typeof docs)[number]) => {
      const { id } = docWithLocales
      let documentTempFilePath: string | undefined

      try {
        // Each document gets its own transaction when singleTransaction is enabled
        let docShouldCommit = false
        if (req.payload.db.bulkOperationsSingleTransaction) {
          docShouldCommit = await initTransaction(req)
        }

        const documentFile = req.file ? { ...req.file } : undefined
        if (collectionConfig.upload && !overrideAccess && documentFile?.tempFilePath) {
          const extension = path.extname(documentFile.tempFilePath)
          documentTempFilePath = path.join(
            path.dirname(documentFile.tempFilePath),
            `${path.basename(documentFile.tempFilePath, extension)}-${randomUUID()}${extension}`,
          )
          await fs.copyFile(documentFile.tempFilePath, documentTempFilePath)
          documentFile.tempFilePath = documentTempFilePath
        }

        let documentReq = req
        if (collectionConfig.upload && sharedGeneratedFileData === null) {
          documentReq = isolateObjectProperty(req, ['file', 'payloadUploadSizes'])
          documentReq.file = documentFile
          documentReq.payloadUploadSizes = {}
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
              localizedProperties: getLocalizedUploadProperties(collectionConfig.flattenedFields),
            }),
            operation: 'update',
            originalDoc: docWithLocales,
            overwriteExistingFiles,
            req: documentReq,
            throwOnMissingFile: false,
          }))

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
          overrideAccess: overrideAccess!,
          overrideLock: overrideLock!,
          payload,
          populate,
          publishAllLocales,
          req: documentReq,
          select: select!,
          showHiddenFields: showHiddenFields!,
          unpublishAllLocales,
        })

        // /////////////////////////////////////
        // Add collection property for auth collections
        // /////////////////////////////////////

        if (collectionConfig.auth) {
          updatedDoc = { ...updatedDoc, collection: collectionConfig.slug }
        }

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
      } finally {
        if (documentTempFilePath) {
          await fs.rm(documentTempFilePath, { force: true }).catch((error) => {
            req.payload.logger.error({ err: error, msg: 'Failed to remove temp file copy' })
          })
        }
      }
      return null
    }

    // Upload processing may mutate its temp file while cropping, so each document must finish
    // before the next document starts. This only applies when an actual file is being written
    // (`req.file`); metadata-only bulk updates use isolated per-document request state and can
    // stay parallel. Other bulk updates retain their existing parallel behavior.
    const processSequentially =
      req.payload.db.bulkOperationsSingleTransaction ||
      Boolean(collectionConfig.upload && !overrideAccess && req.file)
    let awaitedDocs: (DataFromCollectionSlug<TSlug> | null)[]
    if (processSequentially) {
      awaitedDocs = []
      for (const doc of docs) {
        awaitedDocs.push(await processDocument(doc))
      }
    } else {
      awaitedDocs = await Promise.all(docs.map(processDocument))
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

    if (shouldCommit) {
      await commitTransaction(req)
    }

    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return result
  } catch (error: unknown) {
    await unlinkTempFiles({
      collectionConfig: args.collection.config,
      config: args.req.payload.config,
      req: args.req,
    }).catch((unlinkError) => {
      args.req.payload.logger.error({ err: unlinkError, msg: 'Failed to remove temp file' })
    })
    await killTransaction(args.req)
    throw error
  }
}
