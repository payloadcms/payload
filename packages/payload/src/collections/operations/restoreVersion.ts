import { status as httpStatus } from 'http-status'

import type { FindOneArgs } from '../../database/types.js'
import type {
  JsonObject,
  PayloadRequest,
  PopulateType,
  SelectType,
  Where,
} from '../../types/index.js'
import type { Collection, TypeWithID } from '../config/types.js'
import type { FindOptions } from './local/find.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import { forkDocument } from '../../branching/forkDocument.js'
import {
  refreshRequestDataLoader,
  resetBranchState,
  resolveBranch,
} from '../../branching/resolveBranch.js'
import { branchDocIDField, branchField, MAIN_BRANCH } from '../../branching/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound } from '../../errors/index.js'
import { afterChange } from '../../fields/hooks/afterChange/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { beforeChange } from '../../fields/hooks/beforeChange/index.js'
import { beforeValidate } from '../../fields/hooks/beforeValidate/index.js'
import {
  getLocalizedUploadProperties,
  restoreUploadDataFromDocument,
  sanitizeUploadData,
} from '../../uploads/sanitizeUploadData.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'
import { hasDraftValidationEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import { markTransactionWrite } from '../../utilities/transactionMutationTracker.js'
import { getLatestCollectionVersion } from '../../versions/getLatestCollectionVersion.js'
import { getRestoredStatusesToAuthorize } from '../../versions/getRestoredStatusesToAuthorize.js'
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
  let shouldCommit = false
  const branch = resolveBranch(req)
  const isBranchingDocument =
    branch !== MAIN_BRANCH &&
    payload.config.branching?.branchableCollections.has(collectionConfig.slug)

  try {
    shouldCommit = !args.disableTransaction && (await initTransaction(args.req))

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'restoreVersion',
      overrideAccess,
    })

    const restoreTarget = await readAuthorizedRestoreTarget<TData>({
      id,
      collectionConfig,
      draft: draftArg,
      overrideAccess,
      req,
    })
    const { findOneArgs, parentDocID, rawVersionToRestore } = restoreTarget
    let { versionToRestoreWithLocales } = restoreTarget

    if (isBranchingDocument) {
      const hasCallerTransaction = !shouldCommit && Boolean(await req.transactionID)
      const isUntouchedBranch = restoreTarget.document[branchField] !== branch

      if (hasCallerTransaction && isUntouchedBranch) {
        throw new APIError(
          'Cannot restore an untouched branch document within an existing transaction.',
          httpStatus.CONFLICT,
        )
      }

      await forkDocument({
        id: parentDocID,
        collectionSlug: collectionConfig.slug,
        req,
        useAmbientTransaction: shouldCommit,
      })
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
    const validationLocale = payload.config.localization
      ? payload.config.localization.defaultLocale
      : locale!

    const originalDoc = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: 0,
      doc: deepCopyObjectSimple(prevDocWithLocales),
      draft: draftArg,
      fallbackLocale: null,
      global: null,
      locale: validationLocale,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    })

    if (collectionConfig.upload && !overrideAccess) {
      versionToRestoreWithLocales = restoreUploadDataFromDocument(
        sanitizeUploadData(versionToRestoreWithLocales, 'update'),
        prevDocWithLocales,
      )
    }

    // Use locale-hoisted version data for validation while preserving all locales in docWithLocales.
    let prevVersionDoc = await afterRead({
      collection: collectionConfig,
      context: req.context,
      depth: 0,
      doc: deepCopyObjectSimple(rawVersionToRestore.version),
      draft: draftArg,
      fallbackLocale: null,
      global: null,
      locale: validationLocale,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    })

    if (collectionConfig.upload && !overrideAccess) {
      prevVersionDoc = restoreUploadDataFromDocument(
        sanitizeUploadData(prevVersionDoc, 'update'),
        prevDocWithLocales,
        {
          locale: validationLocale,
          localizedProperties: getLocalizedUploadProperties(collectionConfig.flattenedFields),
        },
      )
    }

    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////

    req.context.isRestoringVersion = true

    const reqWithValidationLocale = isolateObjectProperty(req, ['fallbackLocale', 'locale'])
    reqWithValidationLocale.fallbackLocale = null
    reqWithValidationLocale.locale = validationLocale

    let data = await beforeValidate({
      id: parentDocID,
      collection: collectionConfig,
      context: req.context,
      data: deepCopyObjectSimple(prevVersionDoc),
      doc: originalDoc,
      global: null,
      operation: 'update',
      overrideAccess,
      req: reqWithValidationLocale,
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
            req: reqWithValidationLocale,
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
            req: reqWithValidationLocale,
          })) || data
      }
    }

    if (isBranchingDocument) {
      const branchDocument = prevDocWithLocales as Record<string, unknown>

      data[branchField] = branchDocument[branchField]
      data[branchDocIDField] = branchDocument[branchDocIDField]
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
      req: reqWithValidationLocale,
      skipValidation: draftArg && !hasDraftValidationEnabled(collectionConfig),
    })

    // /////////////////////////////////////
    // Update
    // /////////////////////////////////////

    const select = sanitizeSelect({
      fields: collectionConfig.flattenedFields,
      select: resolveSelect({
        config: collectionConfig.select,
        operation: 'restoreVersion',
        req,
        select: incomingSelect,
      }),
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
        req: reqWithValidationLocale,
        select,
      })
      markTransactionWrite({ req: reqWithValidationLocale })
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
      req: reqWithValidationLocale,
      select,
    })
    markTransactionWrite({ req: reqWithValidationLocale })

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
            overrideAccess,
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
      overrideAccess,
      result,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    if (isBranchingDocument) {
      refreshRequestDataLoader(req)
    }

    return result
  } catch (error: unknown) {
    if (shouldCommit) {
      await killTransaction(req)
      resetBranchState(req)
    }
    throw error
  }
}

const readAuthorizedRestoreTarget = async <
  TData extends JsonObject & TypeWithID = JsonObject & TypeWithID,
>({
  id,
  collectionConfig,
  draft,
  overrideAccess,
  req,
}: {
  collectionConfig: Collection['config']
  draft: boolean
  id: number | string
  overrideAccess: boolean
  req: PayloadRequest
}) => {
  if (!id) {
    throw new APIError('Missing ID of version to restore.', httpStatus.BAD_REQUEST)
  }

  const { docs: versionDocs } = await req.payload.db.findVersions({
    collection: collectionConfig.slug,
    limit: 1,
    locale: 'all',
    pagination: false,
    req,
    where: { id: { equals: id } },
  })

  const [rawVersionToRestore] = versionDocs

  if (!rawVersionToRestore) {
    throw new NotFound(req.t)
  }

  const { parent: parentDocID } = rawVersionToRestore
  const versionToRestoreWithLocales = rawVersionToRestore.version
  const restoredStatuses = draft
    ? ['draft']
    : getRestoredStatusesToAuthorize(versionToRestoreWithLocales?._status)

  // A localized `_status` can publish and unpublish locales in one restore, so authorize every
  // status it writes. executeAccess throws Forbidden on the first denial; Where constraints are
  // AND-combined into the lookup below.
  const accessResultsList: Array<boolean | Where> = []

  if (overrideAccess) {
    accessResultsList.push(true)
  } else {
    const statusesToAuthorize = restoredStatuses.length > 0 ? restoredStatuses : [undefined]

    for (const status of statusesToAuthorize) {
      accessResultsList.push(
        await executeAccess(
          {
            id: parentDocID,
            slug: collectionConfig.slug,
            data: { _status: status },
            req,
          },
          collectionConfig.access.update,
        ),
      )
    }
  }

  const hasWherePolicy = accessResultsList.some((result) => hasWhereAccessResult(result))
  const findOneArgs: FindOneArgs = {
    collection: collectionConfig.slug,
    locale: 'all',
    req,
    where: accessResultsList.reduce<Where>((where, result) => combineQueries(where, result), {
      id: { equals: parentDocID },
    }),
  }
  const document = await req.payload.db.findOne<TData>(findOneArgs)

  if (!document) {
    if (hasWherePolicy) {
      throw new Forbidden(req.t)
    }

    throw new NotFound(req.t)
  }

  if (collectionConfig.trash && document.deletedAt) {
    throw new APIError(
      `Cannot restore a version of a trashed document (ID: ${parentDocID}). Restore the document first.`,
      httpStatus.FORBIDDEN,
    )
  }

  return {
    document,
    findOneArgs,
    parentDocID,
    rawVersionToRestore,
    versionToRestoreWithLocales,
  }
}
