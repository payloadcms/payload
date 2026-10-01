import type { BranchDeleteOutcome } from '../../branching/tombstone.js'
import type { CollectionSlug, FindOptions } from '../../index.js'
import type {
  PayloadRequest,
  PopulateType,
  SelectType,
  TransformCollectionWithSelect,
} from '../../types/index.js'
import type { DeferredCleanupScope } from '../../utilities/transactionCallbacks.js'
import type { Collection, DataFromCollectionSlug } from '../config/types.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { hasWhereAccessResult } from '../../auth/types.js'
import {
  findCompetingShadow,
  isConcurrentShadowOperationError,
  retryConcurrentShadowOperation,
} from '../../branching/createShadowRow.js'
import { resetBranchState, resolveBranch } from '../../branching/resolveBranch.js'
import {
  assertBranchCreatedDeleteUnreferenced,
  assertBranchDeleteCanUseCallerTransaction,
  requireBranchDeleteOutcome,
  setBranchDeleteOperation,
  setConcurrentBranchDelete,
  willBranchAbsorbDelete,
} from '../../branching/tombstone.js'
import { branchOpField, MAIN_BRANCH } from '../../branching/types.js'
import { combineQueries } from '../../database/combineQueries.js'
import { Forbidden, NotFound } from '../../errors/index.js'
import { afterRead } from '../../fields/hooks/afterRead/index.js'
import { deleteUserPreferences } from '../../preferences/deleteUserPreferences.js'
import { deleteAssociatedFiles } from '../../uploads/deleteAssociatedFiles.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { checkDocumentLockStatus } from '../../utilities/checkDocumentLockStatus.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { hasScheduledPublishEnabled } from '../../utilities/getVersionsConfig.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { resolveSelect } from '../../utilities/resolveSelect.js'
import { sanitizeSelect } from '../../utilities/sanitizeSelect.js'
import {
  beginDeferredCleanupScope,
  clearDeferredCleanupScope,
  flushDeferredCleanupScopeAfterOperation,
} from '../../utilities/transactionCallbacks.js'
import { deleteCollectionVersions } from '../../versions/deleteCollectionVersions.js'
import { deleteScheduledPublishJobs } from '../../versions/deleteScheduledPublishJobs.js'
import { buildAfterOperation } from './utilities/buildAfterOperation.js'
import { buildBeforeOperation } from './utilities/buildBeforeOperation.js'
import { createOperationRetryRequest } from './utilities/createOperationRetryRequest.js'

export type Arguments<TSlug extends CollectionSlug, TSelect extends SelectType> = {
  collection: Collection
  depth?: number
  disableTransaction?: boolean
  id: number | string
  overrideAccess?: boolean
  overrideLock?: boolean
  populate?: PopulateType
  req: PayloadRequest
  showHiddenFields?: boolean
  trash?: boolean
} & Pick<FindOptions<TSlug, TSelect>, 'select'>

export const deleteByIDOperation = async <TSlug extends CollectionSlug, TSelect extends SelectType>(
  incomingArgs: Arguments<TSlug, TSelect>,
): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
  const hasCallerTransaction = Boolean(await incomingArgs.req.transactionID)
  const branch = resolveBranch(incomingArgs.req)
  let didOwnAttemptTransaction = false
  let didReachFinalCommit = false
  let concurrentDeleteRetryError: unknown
  let concurrentDeleteWinnerID: number | string | undefined

  return retryConcurrentShadowOperation({
    onRetry: async ({ error }) => {
      if (!isConcurrentShadowOperationError(error) || branch === MAIN_BRANCH) {
        return
      }

      concurrentDeleteWinnerID = undefined
      concurrentDeleteRetryError = undefined

      const winner = await findCompetingShadow({
        branch,
        collectionSlug: incomingArgs.collection.config.slug,
        docID: incomingArgs.id,
        req: incomingArgs.req,
      })

      const winnerID = winner?.id

      if (
        winner?.[branchOpField] === 'delete' &&
        (typeof winnerID === 'number' || typeof winnerID === 'string')
      ) {
        concurrentDeleteRetryError = error
        concurrentDeleteWinnerID = winnerID
      }
    },
    operation: async () => {
      didOwnAttemptTransaction = false
      didReachFinalCommit = false

      const attemptArgs = hasCallerTransaction
        ? incomingArgs
        : {
            ...incomingArgs,
            req: await createOperationRetryRequest({ req: incomingArgs.req }),
          }

      return deleteByIDOperationAttempt({
        concurrentDeleteRetryError,
        concurrentDeleteWinnerID,
        hasCallerTransaction,
        incomingArgs: attemptArgs,
        reportFinalCommit: () => {
          didReachFinalCommit = true
        },
        reportTransactionOwnership: ({ isOperationTransaction }) => {
          didOwnAttemptTransaction = isOperationTransaction
        },
      })
    },
    shouldRetry: ({ error }) =>
      !hasCallerTransaction &&
      didOwnAttemptTransaction &&
      (didReachFinalCommit || isConcurrentShadowOperationError(error)),
  })
}

const deleteByIDOperationAttempt = async <
  TSlug extends CollectionSlug,
  TSelect extends SelectType,
>({
  concurrentDeleteRetryError,
  concurrentDeleteWinnerID,
  hasCallerTransaction,
  incomingArgs,
  reportFinalCommit,
  reportTransactionOwnership,
}: {
  concurrentDeleteRetryError?: unknown
  concurrentDeleteWinnerID?: number | string
  hasCallerTransaction: boolean
  incomingArgs: Arguments<TSlug, TSelect>
  reportFinalCommit: () => void
  reportTransactionOwnership: (args: { isOperationTransaction: boolean }) => void
}): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
  let args = incomingArgs
  let cleanupScope: DeferredCleanupScope | null = null
  let shouldCommit = false

  try {
    shouldCommit = !args.disableTransaction && (await initTransaction(args.req))
    reportTransactionOwnership({ isOperationTransaction: shouldCommit })
    cleanupScope = await beginDeferredCleanupScope({ req: args.req })

    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////

    args = await buildBeforeOperation({
      args,
      collection: args.collection.config,
      operation: 'delete',
      overrideAccess: args.overrideAccess!,
    })

    const {
      id,
      collection: { config: collectionConfig },
      depth,
      overrideAccess,
      overrideLock,
      populate,
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
    } = args

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    const accessResults = !overrideAccess
      ? await executeAccess(
          { id, slug: collectionConfig.slug, req },
          collectionConfig.access.delete,
        )
      : true
    const hasWhereAccess = hasWhereAccessResult(accessResults)

    // /////////////////////////////////////
    // Retrieve document
    // /////////////////////////////////////

    let where = combineQueries({ id: { equals: id } }, accessResults)

    // Exclude trashed documents when trash: false
    where = appendNonTrashedFilter({
      enableTrash: collectionConfig.trash,
      trash,
      where,
    })

    let docToDelete = await req.payload.db.findOne({
      collection: collectionConfig.slug,
      locale: req.locale!,
      req,
      where,
    })

    if (!docToDelete && concurrentDeleteWinnerID !== undefined) {
      docToDelete = await req.payload.db.findOne({
        branch: false,
        collection: collectionConfig.slug,
        locale: req.locale!,
        req,
        where,
      })
    }

    if (!docToDelete && !hasWhereAccess) {
      throw new NotFound(req.t)
    }
    if (!docToDelete && hasWhereAccess) {
      throw new Forbidden(req.t)
    }

    const documentToDelete = docToDelete as Record<string, unknown>

    const branch = resolveBranch(req)
    const isBranchingDocument =
      branch !== MAIN_BRANCH &&
      req.payload.config.branching?.branchableCollections.has(collectionConfig.slug)

    if (hasCallerTransaction && isBranchingDocument) {
      await assertBranchDeleteCanUseCallerTransaction({
        branch,
        collectionSlug: collectionConfig.slug,
        docID: id,
        req,
      })
    }

    await assertBranchCreatedDeleteUnreferenced({
      collectionSlug: collectionConfig.slug,
      doc: documentToDelete,
      req,
    })

    // /////////////////////////////////////
    // beforeDelete - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.beforeDelete?.length) {
      for (const hook of collectionConfig.hooks.beforeDelete) {
        await hook({
          id,
          collection: collectionConfig,
          context: req.context,
          req,
        })
      }
    }

    await assertBranchCreatedDeleteUnreferenced({
      collectionSlug: collectionConfig.slug,
      doc: documentToDelete,
      req,
    })

    // /////////////////////////////////////
    // Handle potentially locked documents
    // /////////////////////////////////////

    await checkDocumentLockStatus({
      id,
      collectionSlug: collectionConfig.slug,
      lockErrorMessage: `Document with ID ${id} is currently locked and cannot be deleted.`,
      overrideLock,
      req,
    })

    // A delete on a branch becomes a tombstone, and main keeps its row — so the
    // cascades below, which all address the canonical document, would strip data
    // main still depends on. The version cascade is scoped to the branch rather
    // than skipped, since a branch's own version rows do go with it.
    const absorbedByBranch = willBranchAbsorbDelete({
      collectionSlug: collectionConfig.slug,
      doc: documentToDelete,
      req,
    })

    if (!isBranchingDocument && !absorbedByBranch) {
      await deleteAssociatedFiles({
        collectionConfig,
        config,
        doc: documentToDelete,
        overrideDelete: true,
        req,
      })
    }

    // /////////////////////////////////////
    // Delete versions
    // /////////////////////////////////////

    if (collectionConfig.versions) {
      await deleteCollectionVersions({
        id,
        slug: collectionConfig.slug,
        payload,
        req,
      })
    }

    // /////////////////////////////////////
    // Delete scheduled posts
    // /////////////////////////////////////
    if (!isBranchingDocument && hasScheduledPublishEnabled(collectionConfig) && !absorbedByBranch) {
      await deleteScheduledPublishJobs({
        id,
        slug: collectionConfig.slug,
        payload,
        req,
      })
    }

    const select = sanitizeSelect({
      fields: collectionConfig.flattenedFields,
      select: resolveSelect({
        config: collectionConfig.select,
        operation: 'delete',
        req,
        select: incomingSelect,
      }),
    })

    // /////////////////////////////////////
    // Delete document
    // /////////////////////////////////////

    if (concurrentDeleteWinnerID !== undefined && concurrentDeleteRetryError !== undefined) {
      setConcurrentBranchDelete({
        branch,
        collectionSlug: collectionConfig.slug,
        doc: documentToDelete,
        docID: id,
        req,
        retryError: concurrentDeleteRetryError,
        winnerID: concurrentDeleteWinnerID,
      })
    }
    let branchDeleteOutcome: BranchDeleteOutcome | undefined
    if (isBranchingDocument) {
      setBranchDeleteOperation({
        branch,
        collectionSlug: collectionConfig.slug,
        docID: id,
        isTombstoneExpected: absorbedByBranch,
        onResolved: (outcome) => {
          branchDeleteOutcome = outcome
        },
        req,
        useAmbientTransaction: shouldCommit,
      })
    }

    let result: DataFromCollectionSlug<TSlug> = await req.payload.db.deleteOne({
      collection: collectionConfig.slug,
      req,
      select,
      where: { id: { equals: id } },
    })

    const finalBranchDeleteOutcome = isBranchingDocument
      ? requireBranchDeleteOutcome({ outcome: branchDeleteOutcome })
      : ({ doc: documentToDelete, tombstoned: false } as const)

    if (isBranchingDocument && !finalBranchDeleteOutcome.tombstoned) {
      await deleteAssociatedFiles({
        collectionConfig,
        config,
        doc: finalBranchDeleteOutcome.doc,
        overrideDelete: true,
        req,
      })

      if (hasScheduledPublishEnabled(collectionConfig)) {
        await deleteScheduledPublishJobs({
          id,
          slug: collectionConfig.slug,
          payload,
          req,
        })
      }
    }

    // /////////////////////////////////////
    // Add collection property for auth collections
    // /////////////////////////////////////

    if (collectionConfig.auth) {
      result = { ...result, collection: collectionConfig.slug }
    }

    // /////////////////////////////////////
    // Delete Preferences
    // /////////////////////////////////////

    if (!finalBranchDeleteOutcome.tombstoned) {
      await deleteUserPreferences({
        collectionConfig,
        ids: [id],
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
      depth: depth!,
      doc: result,
      draft: undefined!,
      fallbackLocale: fallbackLocale!,
      global: null,
      locale: locale!,
      overrideAccess: overrideAccess!,
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
    // afterDelete - Collection
    // /////////////////////////////////////

    if (collectionConfig.hooks?.afterDelete?.length) {
      for (const hook of collectionConfig.hooks.afterDelete) {
        result =
          (await hook({
            id,
            collection: collectionConfig,
            context: req.context,
            doc: result,
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
      operation: 'deleteByID',
      overrideAccess,
      result,
    })

    // /////////////////////////////////////
    // 8. Return results
    // /////////////////////////////////////

    if (cleanupScope) {
      await flushDeferredCleanupScopeAfterOperation({ req, scope: cleanupScope })
    }
    if (shouldCommit) {
      reportFinalCommit()
      await commitTransaction(req)
    }

    return result as TransformCollectionWithSelect<TSlug, TSelect>
  } catch (error: unknown) {
    if (cleanupScope) {
      clearDeferredCleanupScope({ req: args.req, scope: cleanupScope })
    }

    if (shouldCommit) {
      await killTransaction(args.req)
    }
    resetBranchState(args.req)
    throw error
  }
}
