import type { Payload, PayloadRequest } from '../../types/index.js'
import type { MergeResult } from '../merge.js'
import type { BranchOperation, MergeableChange, MergeProgress } from '../types.js'
import type { SourceCleanupPlan, UploadCleanupPlan } from './finalizeMerge.js'
import type { PreparedBranchChange } from './prepareMerge.js'
import type { AppliedChangeResult } from './utilities.js'

import { APIError, Forbidden } from '../../errors/index.js'
import { throwOnFieldAccessDeniedContextKey } from '../../fields/hooks/beforeValidate/throwOnAccessDenied.js'
import {
  commitTransaction,
  isUnknownTransactionCommitResult,
} from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import {
  beginDeferredCleanupScope,
  clearDeferredCleanupScope,
  flushDeferredCleanupScopeAfterOperation,
  scheduleAfterTransactionCommit,
  scheduleAfterTransactionRollback,
} from '../../utilities/transactionCallbacks.js'
import {
  type CaptureSavedVersionID,
  captureSavedVersionIDContextKey,
} from '../../versions/saveVersion.js'
import { resolveEffectiveOperations } from '../effectiveOperations.js'
import { type BranchMergeWriteGuard, branchMergeWriteGuardContextKey } from '../mergeWriteGuard.js'
import {
  hasUnavailableBranchCreatedDependency,
  resolveMergeDependencies,
  runGlobalMergePreflight,
  runMergeDependencyPreflight,
  runMergePreflight,
} from '../preflight.js'
import { readCollectionMergeSnapshot } from '../readMergeSnapshot.js'
import { refreshBranchState } from '../resolveBranch.js'
import { branchField, MAIN_BRANCH } from '../types.js'
import { createMainBranchRequest } from '../validation.js'
import { applyChange, applyGlobalChange } from './applyMergeChange.js'
import { finalizeMergeAfterCommit, recordMergeRollback } from './finalizeMerge.js'
import { createMergeLedger } from './mergeLedger.js'
import { recoverMergeFailure } from './recoverMerge.js'
import { changeDocID } from './utilities.js'

const mergeEventCheckpointBatchSize = 1_000
export const unknownMergeCommitResultContextKey = Symbol('unknownMergeCommitResult')

const findLatestTargetCollectionVersionID = async ({
  collectionSlug,
  docID,
  payload,
  req,
}: {
  collectionSlug: string
  docID: number | string
  payload: Payload
  req: PayloadRequest
}): Promise<string | undefined> => {
  if (!payload.collections[collectionSlug]?.config.versions) {
    return undefined
  }

  const { docs } = await payload.db.findVersions({
    branch: false,
    collection: collectionSlug,
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: { parent: { equals: docID } },
  })
  const versionID = docs[0]?.id

  return versionID === undefined ? undefined : String(versionID)
}

const findLatestTargetGlobalVersionID = async ({
  globalSlug,
  payload,
  req,
}: {
  globalSlug: string
  payload: Payload
  req: PayloadRequest
}): Promise<string | undefined> => {
  const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)

  if (!globalConfig?.versions) {
    return undefined
  }

  const { docs } = await payload.db.findGlobalVersions({
    branch: false,
    global: globalSlug,
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: { [branchField]: { equals: MAIN_BRANCH } },
  })
  const versionID = docs[0]?.id

  return versionID === undefined ? undefined : String(versionID)
}

const orderChangesByDependencies = <TChange extends { id: unknown }>({
  changes,
  dependencyChangeIDsByChangeID,
}: {
  changes: TChange[]
  dependencyChangeIDsByChangeID: Map<string, Set<string>>
}): TChange[] => {
  const changesByID = new Map(changes.map((change) => [String(change.id), change]))
  const orderedChanges: TChange[] = []
  const orderedChangeIDs = new Set<string>()
  const visitingChangeIDs = new Set<string>()

  const visitChange = (change: TChange): void => {
    const changeID = String(change.id)

    if (orderedChangeIDs.has(changeID) || visitingChangeIDs.has(changeID)) {
      return
    }

    visitingChangeIDs.add(changeID)

    for (const dependencyChangeID of dependencyChangeIDsByChangeID.get(changeID) ?? []) {
      const dependencyChange = changesByID.get(dependencyChangeID)

      if (dependencyChange) {
        visitChange(dependencyChange)
      }
    }

    visitingChangeIDs.delete(changeID)
    orderedChangeIDs.add(changeID)
    orderedChanges.push(change)
  }

  for (const change of changes) {
    visitChange(change)
  }

  return orderedChanges
}

const getSnapshotDocumentTitle = ({
  after,
  docID,
  useAsTitle,
}: {
  after: null | Record<string, unknown> | undefined
  docID: number | string
  useAsTitle: string | undefined
}): string => {
  const title = useAsTitle ? after?.[useAsTitle] : undefined

  return typeof title === 'number' || typeof title === 'string' ? String(title) : String(docID)
}

export const executeMerge = async ({
  applicable,
  applicableGlobals,
  branch,
  branchDoc,
  closeBranch,
  incomingReq,
  mergeable,
  onProgress,
  overrideAccess,
  payload,
  req,
  result,
}: {
  applicable: PreparedBranchChange[]
  applicableGlobals: PreparedBranchChange[]
  branch: string
  branchDoc: { id: number | string }
  closeBranch: boolean
  incomingReq?: PayloadRequest
  mergeable: MergeableChange[]
  onProgress?: (progress: MergeProgress, req: PayloadRequest) => Promise<void> | void
  overrideAccess: boolean
  payload: Payload
  req: PayloadRequest
  result: MergeResult
}): Promise<MergeResult> => {
  const ledger = await createMergeLedger({ branch, mergeable, payload, req })
  // A request supplied by an HTTP caller does not yet have a transaction, so it
  // must start one just as a Local API call would.
  const shouldCommit = await initTransaction(req)
  const transactionID = req.transactionID ? await req.transactionID : undefined
  const hasTransaction = transactionID !== null && transactionID !== undefined
  const cleanupScope = await beginDeferredCleanupScope({ req })

  const uploadCleanupPlans: UploadCleanupPlan[] = []
  const sourceCleanupPlans: SourceCleanupPlan[] = []
  const appliedChangeIDs = new Set<string>()
  const reqContext = req.context as Record<PropertyKey, unknown>
  const previousBranchMergeWriteGuard = reqContext[branchMergeWriteGuardContextKey]
  const previousThrowOnFieldAccessDenied = reqContext[throwOnFieldAccessDeniedContextKey]

  reqContext[branchMergeWriteGuardContextKey] = (async ({
    collectionSlug,
    data,
    globalSlug,
    req: writeReq,
  }) => {
    if (
      await hasUnavailableBranchCreatedDependency({
        availableChangeIDs: appliedChangeIDs,
        collectionSlug,
        data,
        globalSlug,
        payload,
        req: writeReq,
      })
    ) {
      throw new APIError(
        'This change refers to branch-created content that will not be available on main.',
        409,
      )
    }
  }) satisfies BranchMergeWriteGuard

  if (!overrideAccess) {
    reqContext[throwOnFieldAccessDeniedContextKey] = true
  }

  let activeChangeID: number | string | undefined
  let isFinalCommitInProgress = false
  let mergedAt: string | undefined

  const finalizeAfterCommit = (): Promise<void> =>
    finalizeMergeAfterCommit({
      branch,
      branchDoc,
      closeBranch,
      incomingReq,
      ledger,
      mergedAt,
      payload,
      req,
      result,
      sourceCleanupPlans,
      uploadCleanupPlans,
    })

  const recordRollback = (): Promise<void> =>
    recordMergeRollback({ branchDoc, incomingReq, ledger, payload, req })

  try {
    const writeTargetReq = createMainBranchRequest({ req })
    const refreshedApplicable = await resolveEffectiveOperations({
      branch,
      changes: applicable,
      payload,
      req,
    })
    const dependencyPlan = await resolveMergeDependencies({
      initiallyBlocked: [],
      payload,
      pending: refreshedApplicable,
      pendingGlobals: applicableGlobals,
      req,
    })

    if (dependencyPlan.blocked.length) {
      throw new APIError(dependencyPlan.blocked[0]!.message, 409)
    }

    const applicableInWriteOrder = orderChangesByDependencies({
      changes: applicable,
      dependencyChangeIDsByChangeID: dependencyPlan.dependencyChangeIDsByChangeID,
    })

    for (
      let batchStart = 0;
      batchStart < applicableInWriteOrder.length;
      batchStart += mergeEventCheckpointBatchSize
    ) {
      const changeBatch = applicableInWriteOrder.slice(
        batchStart,
        batchStart + mergeEventCheckpointBatchSize,
      )
      const changeBatchIDs = changeBatch.map(({ id }) => id)

      ledger.updateChanges({
        changeIDs: changeBatchIDs,
        update: { applicationOutcome: 'attempted' },
      })
      await ledger.persist({ status: 'inProgress' })

      for (const [batchIndex, change] of changeBatch.entries()) {
        const index = batchStart + batchIndex

        activeChangeID = change.id

        await onProgress?.(
          {
            collectionSlug: change.collectionSlug as string,
            current: index + 1,
            docID: changeDocID(change),
            operation: change.operation as BranchOperation,
            total: applicableInWriteOrder.length,
          },
          req,
        )

        const [resolvedChange] = await resolveEffectiveOperations({
          branch,
          changes: [change],
          payload,
          req,
        })

        if (!resolvedChange) {
          throw new Error(`Branch change ${String(change.id)} could not be resolved.`)
        }

        if (!overrideAccess) {
          const blockedAtUse = await runMergePreflight({
            payload,
            pending: [resolvedChange],
            req: writeTargetReq,
          })

          if (blockedAtUse.length) {
            throw new Forbidden(req.t)
          }
        }

        const collectionSlug = change.collectionSlug as string
        const docID = changeDocID(change)
        const collectionConfig = payload.collections[collectionSlug]!.config
        const beforeVersionID =
          change.operation === 'create'
            ? undefined
            : await findLatestTargetCollectionVersionID({
                collectionSlug,
                docID,
                payload,
                req: writeTargetReq,
              })
        let afterVersionID: string | undefined
        const writeTargetContext = writeTargetReq.context as Record<PropertyKey, unknown>
        const previousCaptureSavedVersionID = writeTargetContext[captureSavedVersionIDContextKey]

        writeTargetContext[captureSavedVersionIDContextKey] = ((capturedVersion) => {
          if (capturedVersion.collectionSlug === collectionSlug) {
            afterVersionID = String(capturedVersion.versionID)
          }
        }) satisfies CaptureSavedVersionID
        let uploadSourceDoc: null | Record<string, unknown> = null

        if (collectionConfig.upload) {
          if (change.operation === 'create') {
            uploadSourceDoc = resolvedChange.shadow
          } else if (change.operation === 'update') {
            uploadSourceDoc = (await payload.db.findOne({
              branch: false,
              collection: collectionSlug,
              req,
              where: {
                and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: docID } }],
              },
            })) as null | Record<string, unknown>
          }
        }

        const dependencyBlockedAtUse = await runMergeDependencyPreflight({
          availableChangeIDs: appliedChangeIDs,
          initiallyBlocked: [],
          payload,
          pending: [resolvedChange],
          pendingGlobals: [],
          req: writeTargetReq,
        })

        if (dependencyBlockedAtUse.length) {
          throw new APIError(dependencyBlockedAtUse[0]!.message, 409)
        }

        let appliedChange: AppliedChangeResult

        try {
          appliedChange = await applyChange({
            hasTransaction,
            overrideAccess,
            payload,
            req,
            resolved: resolvedChange,
            targetReq: writeTargetReq,
          })
        } finally {
          if (previousCaptureSavedVersionID === undefined) {
            delete writeTargetContext[captureSavedVersionIDContextKey]
          } else {
            writeTargetContext[captureSavedVersionIDContextKey] = previousCaptureSavedVersionID
          }
        }

        sourceCleanupPlans.push({ changeID: change.id, ...appliedChange })
        appliedChangeIDs.add(String(change.id))
        ledger.updateChange({
          changeID: change.id,
          update: {
            afterVersionID,
            applicationOutcome: 'applied',
            beforeVersionID,
            sourceID: appliedChange.sourceID,
            sourceUpdatedAt: appliedChange.sourceUpdatedAt,
            sourceVersionIDs: appliedChange.sourceVersionIDs,
          },
        })

        if (uploadSourceDoc) {
          const retainedDoc = (await payload.db.findOne({
            branch: false,
            collection: collectionSlug,
            req,
            where: {
              and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: docID } }],
            },
          })) as null | Record<string, unknown>

          uploadCleanupPlans.push({
            changeID: change.id,
            collectionSlug,
            retainedDoc,
            sourceDoc: uploadSourceDoc,
          })
        }

        const persistedTarget = await readCollectionMergeSnapshot({
          collectionSlug,
          docID,
          payload,
          req,
        })

        ledger.updateChange({
          changeID: change.id,
          update: {
            docTitle: getSnapshotDocumentTitle({
              after: persistedTarget,
              docID,
              useAsTitle: collectionConfig.admin?.useAsTitle,
            }),
          },
        })

        result.merged.push({
          changeID: change.id,
          collectionSlug: change.collectionSlug as string,
          docID: changeDocID(change),
          entityType: 'collection',
          operation: change.operation as BranchOperation,
        })
        activeChangeID = undefined
      }

      await ledger.persistAppliedChanges({ changeIDs: changeBatchIDs })
    }

    // Globals, after the documents. Ordered that way because a global usually points at
    // documents rather than the other way round, so merging it last means whatever it
    // references is already on main.
    for (const [index, change] of applicableGlobals.entries()) {
      const globalSlug = change.globalSlug as string

      activeChangeID = change.id
      ledger.updateChange({
        changeID: change.id,
        update: { applicationOutcome: 'attempted' },
      })
      await ledger.persist({ status: 'inProgress' })

      await onProgress?.(
        {
          collectionSlug: globalSlug,
          current: applicableInWriteOrder.length + index + 1,
          docID: globalSlug,
          operation: 'update',
          total: applicableInWriteOrder.length + applicableGlobals.length,
        },
        req,
      )

      if (!overrideAccess) {
        const blockedAtUse = await runGlobalMergePreflight({
          payload,
          pending: [change],
          req: writeTargetReq,
        })

        if (blockedAtUse.length) {
          throw new Forbidden(req.t)
        }
      }

      const beforeVersionID = await findLatestTargetGlobalVersionID({
        globalSlug,
        payload,
        req: writeTargetReq,
      })
      let afterVersionID: string | undefined
      const writeTargetContext = writeTargetReq.context as Record<PropertyKey, unknown>
      const previousCaptureSavedVersionID = writeTargetContext[captureSavedVersionIDContextKey]

      writeTargetContext[captureSavedVersionIDContextKey] = ((capturedVersion) => {
        if (capturedVersion.globalSlug === globalSlug) {
          afterVersionID = String(capturedVersion.versionID)
        }
      }) satisfies CaptureSavedVersionID

      const dependencyBlockedAtUse = await runMergeDependencyPreflight({
        availableChangeIDs: appliedChangeIDs,
        initiallyBlocked: [],
        payload,
        pending: [],
        pendingGlobals: [change],
        req: writeTargetReq,
      })

      if (dependencyBlockedAtUse.length) {
        throw new APIError(dependencyBlockedAtUse[0]!.message, 409)
      }

      let appliedGlobal: AppliedChangeResult

      try {
        appliedGlobal = await applyGlobalChange({
          branch,
          globalSlug,
          overrideAccess,
          payload,
          req,
          targetReq: writeTargetReq,
        })
      } finally {
        if (previousCaptureSavedVersionID === undefined) {
          delete writeTargetContext[captureSavedVersionIDContextKey]
        } else {
          writeTargetContext[captureSavedVersionIDContextKey] = previousCaptureSavedVersionID
        }
      }

      sourceCleanupPlans.push({ changeID: change.id, ...appliedGlobal })
      appliedChangeIDs.add(String(change.id))
      ledger.updateChange({
        changeID: change.id,
        update: {
          afterVersionID,
          applicationOutcome: 'applied',
          beforeVersionID,
          sourceRevision: appliedGlobal.sourceRevision,
        },
      })
      await ledger.persistAppliedChanges({ changeIDs: [change.id] })

      const globalConfig = payload.globals?.config?.find((config) => config.slug === globalSlug)

      ledger.updateChange({
        changeID: change.id,
        update: {
          docTitle: typeof globalConfig?.label === 'string' ? globalConfig.label : globalSlug,
        },
      })

      result.merged.push({
        changeID: change.id,
        entityType: 'global',
        globalSlug,
        operation: 'update',
      })
      activeChangeID = undefined
    }

    mergedAt = new Date().toISOString()

    if (cleanupScope) {
      await flushDeferredCleanupScopeAfterOperation({ req, scope: cleanupScope })
    }

    if (hasTransaction) {
      await ledger.persist({ mergedAt, status: 'awaitingCommit' })
      await scheduleAfterTransactionCommit({ callback: finalizeAfterCommit, req })
      await scheduleAfterTransactionRollback({ callback: recordRollback, req })
    }

    if (shouldCommit) {
      isFinalCommitInProgress = true
      await commitTransaction(req)
      isFinalCommitInProgress = false
    }
  } catch (error) {
    const isCommitResultUnknown = isFinalCommitInProgress && isUnknownTransactionCommitResult(error)

    if (isCommitResultUnknown) {
      reqContext[unknownMergeCommitResultContextKey] = true
    }

    if (cleanupScope) {
      clearDeferredCleanupScope({ req, scope: cleanupScope })
    }

    if (shouldCommit && !isCommitResultUnknown) {
      await killTransaction(req)
    }

    await recoverMergeFailure({
      activeChangeID,
      didRollbackTransaction: shouldCommit && !isCommitResultUnknown,
      error,
      hasTransaction,
      isTransactionOutcomeUnknown: isCommitResultUnknown,
      ledger,
      overrideAccess,
      payload,
      req,
      sourceCleanupPlans,
    })

    throw error
  } finally {
    if (previousBranchMergeWriteGuard === undefined) {
      delete reqContext[branchMergeWriteGuardContextKey]
    } else {
      reqContext[branchMergeWriteGuardContextKey] = previousBranchMergeWriteGuard
    }

    if (!overrideAccess) {
      if (previousThrowOnFieldAccessDenied === undefined) {
        delete reqContext[throwOnFieldAccessDeniedContextKey]
      } else {
        reqContext[throwOnFieldAccessDeniedContextKey] = previousThrowOnFieldAccessDenied
      }
    }

    if (incomingReq) {
      refreshBranchState(incomingReq)
    }
  }

  if (!hasTransaction) {
    await finalizeAfterCommit()
  }

  return result
}
