import type { DeepPartial } from 'ts-essentials'

import { status as httpStatus } from 'http-status'

import type { FindOneArgs } from '../../database/types.js'
import type {
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
  Where,
} from '../../types/index.js'
import type { DeferredCleanupScope } from '../../utilities/transactionCallbacks.js'
import type {
  Collection,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
  TypeWithID,
} from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { forkDocument } from '../../branching/forkDocument.js'
import { resetBranchState, resolveBranch } from '../../branching/resolveBranch.js'
import { branchField, MAIN_BRANCH } from '../../branching/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { type CollectionSlug, deepCopyObjectSimple, type FindOptions } from '../../index.js'
import { generateFileData } from '../../uploads/generateFileData.js'
import {
  getLocalizedUploadProperties,
  getUploadDestination,
  mergeUploadDataWithDocument,
  sanitizeUploadData,
} from '../../uploads/sanitizeUploadData.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { hasLocalizeStatusEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import {
  beginDeferredCleanupScope,
  clearDeferredCleanupScope,
  flushDeferredCleanupScopeAfterOperation,
} from '../../utilities/transactionCallbacks.js'
import {
  getAllLocalesPublicationStatus,
  normalizeAllLocalesPublicationStatus,
  reconcileAllLocalesPublicationStatus,
  validateAllLocalesPublicationFlags,
} from '../../versions/allLocalesPublicationStatus.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'
import { updateDocument } from './utilities/update.js'

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
  publishAllLocales?: boolean
  req: PayloadRequest
  showHiddenFields?: boolean
  trash?: boolean
  unpublishAllLocales?: boolean
} & Pick<FindOptions<TSlug, SelectType>, 'select'>

export const updateByIDOperation = <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug> = SelectType,
>(
  incomingArgs: Arguments<TSlug>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>> =>
  updateByIDOperationWithLifecycle<TSlug, TSelect>({
    incomingArgs,
    lifecycleOperation: 'update',
  })

/**
 * Promotes a branch-created row while applying create access and lifecycle hooks.
 * This module is not a package export; external callers use `updateByIDOperation`.
 *
 * @internal
 */
export const updateByIDOperationForBranchMerge = <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug> = SelectType,
>(
  incomingArgs: Arguments<TSlug>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>> =>
  updateByIDOperationWithLifecycle<TSlug, TSelect>({
    incomingArgs,
    lifecycleOperation: 'create',
  })

const updateByIDOperationWithLifecycle = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug> = SelectType,
>({
  incomingArgs,
  lifecycleOperation,
}: {
  incomingArgs: Arguments<TSlug>
  lifecycleOperation: 'create' | 'update'
}): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
  let args = incomingArgs
  let cleanupScope: DeferredCleanupScope | null = null
  let didResolveBranchFork = false
  let shouldCommit = false

  try {
    const hasCallerTransaction = Boolean(await args.req.transactionID)

    shouldCommit = !args.disableTransaction && (await initTransaction(args.req))
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
          (hasLocalizeStatusEnabled(initialCollectionConfig) && args.req.locale !== 'all'
            ? false
            : true)),
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
      trash = false,
      unpublishAllLocales: unpublishAllLocalesArg,
    } = args

    if (!id) {
      throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST)
    }

    let { data } = args

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
      data,
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

    const authorizedDocument = await readAuthorizedUpdateDocument<TSlug>({
      id,
      collectionConfig,
      data,
      lifecycleOperation,
      locale: locale!,
      overrideAccess: overrideAccess!,
      req,
      trash,
    })
    let { docWithLocales } = authorizedDocument
    const branch = resolveBranch(req)
    const isBranchingDocument =
      branch !== MAIN_BRANCH &&
      req.payload.config.branching?.branchableCollections.has(collectionConfig.slug)

    if (isBranchingDocument) {
      const isExistingBranchDocument = docWithLocales[branchField] === branch

      if (hasCallerTransaction && !isExistingBranchDocument) {
        throw new APIError(
          'Cannot update an untouched branch document within an existing transaction.',
          httpStatus.CONFLICT,
        )
      }

      await forkDocument({
        id,
        collectionSlug: collectionConfig.slug,
        req,
        // Without an operation-owned transaction, retain the isolated race-recovery path. An
        // adapter with transactions disabled or unavailable cannot roll back a later hook failure.
        useAmbientTransaction: shouldCommit,
      })
      didResolveBranchFork = true

      if (!isExistingBranchDocument) {
        docWithLocales = await readUpdateDocument<TSlug>({
          id,
          collectionConfig,
          hasWherePolicy: authorizedDocument.hasWherePolicy,
          locale: locale!,
          req,
          where: authorizedDocument.where,
        })
      }
    }

    if (collectionConfig.upload && !overrideAccess) {
      data = mergeUploadDataWithDocument(data, docWithLocales, {
        locale:
          locale === 'all' || !locale
            ? config.localization
              ? config.localization.defaultLocale
              : undefined
            : locale,
        localizedProperties: getLocalizedUploadProperties(collectionConfig.flattenedFields),
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
      originalDoc: docWithLocales,
      overwriteExistingFiles,
      req,
      throwOnMissingFile: false,
    })

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

    let result = await updateDocument<TSlug, TSelect>({
      id,
      autosave,
      collectionConfig,
      config,
      data: deepCopyObjectSimple(newFileData),
      depth: depth!,
      docWithLocales,
      draftArg,
      fallbackLocale: fallbackLocale!,
      filesToUpload,
      locale: locale!,
      operation: lifecycleOperation,
      overrideAccess: overrideAccess!,
      overrideLock: overrideLock!,
      payload,
      populate,
      publishAllLocales,
      req,
      select: select!,
      showHiddenFields: showHiddenFields!,
      unpublishAllLocales,
    })

    // /////////////////////////////////////
    // Add collection property for auth collections
    // /////////////////////////////////////

    if (collectionConfig.auth) {
      result = { ...result, collection: collectionConfig.slug }
    }

    await unlinkTempFiles({
      collectionConfig,
      config,
      req,
    }).catch((unlinkError) => {
      req.payload.logger.error({ err: unlinkError, msg: 'Failed to remove temp file' })
    })

    // /////////////////////////////////////
    // afterOperation - Collection
    // /////////////////////////////////////

    result = (await buildAfterOperation({
      args,
      collection: collectionConfig,
      operation: 'updateByID',
      overrideAccess,
      result,
    })) as TransformCollectionWithSelect<TSlug, TSelect>

    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////

    if (cleanupScope) {
      await flushDeferredCleanupScopeAfterOperation({ req, scope: cleanupScope })
    }
    if (shouldCommit) {
      await commitTransaction(req)
    }

    return result
  } catch (error: unknown) {
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
      if (didResolveBranchFork) {
        resetBranchState(args.req)
      }
    }
    throw error
  }
}

const readAuthorizedUpdateDocument = async <TSlug extends CollectionSlug>({
  id,
  collectionConfig,
  data,
  lifecycleOperation,
  locale,
  overrideAccess,
  req,
  trash,
}: {
  collectionConfig: Collection['config']
  data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
  id: number | string
  lifecycleOperation: 'create' | 'update'
  locale: string
  overrideAccess: boolean
  req: PayloadRequest
  trash: boolean
}): Promise<{
  docWithLocales: RequiredDataFromCollectionSlug<TSlug> & TypeWithID
  hasWherePolicy: boolean
  where: Where
}> => {
  if (!id) {
    throw new APIError('Missing ID of document to update.', httpStatus.BAD_REQUEST)
  }

  const accessResults = !overrideAccess
    ? await executeAccess(
        {
          id: lifecycleOperation === 'create' ? undefined : id,
          slug: collectionConfig.slug,
          data,
          req,
        },
        collectionConfig.access[lifecycleOperation],
      )
    : true
  const hasWherePolicy = lifecycleOperation !== 'create' && hasWhereAccessResult(accessResults)
  const where = { id: { equals: id } }
  let fullWhere = hasWherePolicy ? combineQueries(where, accessResults) : where
  const isTrashAttempt =
    collectionConfig.trash &&
    typeof data === 'object' &&
    data !== null &&
    'deletedAt' in data &&
    data.deletedAt != null

  if (isTrashAttempt && !overrideAccess) {
    const deleteAccessResult = await executeAccess(
      { id, slug: collectionConfig.slug, data, req },
      collectionConfig.access.delete,
    )

    fullWhere = combineQueries(fullWhere, deleteAccessResult)
  }

  fullWhere = appendNonTrashedFilter({
    enableTrash: collectionConfig.trash,
    trash,
    where: fullWhere,
  })

  const docWithLocales = await readUpdateDocument<TSlug>({
    id,
    collectionConfig,
    hasWherePolicy,
    locale,
    req,
    where: fullWhere,
  })

  return { docWithLocales, hasWherePolicy, where: fullWhere }
}

const readUpdateDocument = async <TSlug extends CollectionSlug>({
  id,
  collectionConfig,
  hasWherePolicy,
  locale,
  req,
  where,
}: {
  collectionConfig: Collection['config']
  hasWherePolicy: boolean
  id: number | string
  locale: string
  req: PayloadRequest
  where: Where
}): Promise<RequiredDataFromCollectionSlug<TSlug> & TypeWithID> => {
  const findOneArgs: FindOneArgs = {
    collection: collectionConfig.slug,
    locale,
    req,
    where,
  }
  const docWithLocales = await getLatestCollectionVersion<
    RequiredDataFromCollectionSlug<TSlug> & TypeWithID
  >({
    id,
    config: collectionConfig,
    payload: req.payload,
    query: findOneArgs,
    req,
  })

  if (!docWithLocales) {
    if (hasWherePolicy) {
      throw new Forbidden(req.t)
    }

    throw new NotFound(req.t)
  }

  return docWithLocales
}
