import type { Payload, PayloadRequest } from '../../types/index.js'
import type { MergeResult } from '../merge.js'
import type { MergeEventChange } from '../types.js'
import type { MergeLedger } from './mergeLedger.js'
import type { SourceCleanupOutcome, SourceRecoveryOutcome } from './utilities.js'

import { deleteUploadFilesExclusiveToDocument } from '../../uploads/deleteUploadFilesExclusiveToDocument.js'
import {
  collectStoredFiles,
  scheduleUnreferencedFileCleanup,
} from '../../uploads/fileVersioning/cleanup.js'
import { refreshBranchState } from '../resolveBranch.js'
import { branchChangesCollectionSlug, branchesCollectionSlug } from '../types.js'
import { restoreBranchAfterMerge } from './branchMergeStatus.js'
import { getMergeErrorMessage } from './utilities.js'

export type SourceCleanupPlan = {
  changeID: number | string
  cleanup: () => Promise<SourceCleanupOutcome>
  recover?: () => Promise<SourceRecoveryOutcome>
}

export type UploadCleanupPlan = {
  changeID: number | string
  collectionSlug: string
  retainedDoc: null | Record<string, unknown>
  sourceDocs: Record<string, unknown>[]
}

export const finalizeMergeAfterCommit = async ({
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
}: {
  branch: string
  branchDoc: { id: number | string }
  closeBranch: boolean
  incomingReq?: PayloadRequest
  ledger: MergeLedger
  mergedAt?: string
  payload: Payload
  req: PayloadRequest
  result: MergeResult
  sourceCleanupPlans: SourceCleanupPlan[]
  uploadCleanupPlans: UploadCleanupPlan[]
}): Promise<void> => {
  const cleanupErrors: string[] = []
  const uploadCleanupPlanByChangeID = new Map(
    uploadCleanupPlans.map((plan) => [String(plan.changeID), plan]),
  )
  const recordCleanupOutcome = ({
    changeID,
    cleanupError,
    cleanupOutcome,
  }: {
    changeID: number | string
    cleanupError?: string
    cleanupOutcome: MergeEventChange['cleanupOutcome']
  }): void => {
    if (cleanupError) {
      cleanupErrors.push(cleanupError)
    }

    ledger.updateChange({
      changeID,
      update: cleanupError
        ? { cleanupError, cleanupOutcome: 'failed' }
        : { cleanupError: undefined, cleanupOutcome },
    })
  }

  ledger.mapChanges({
    update: (change) => ({
      ...change,
      applicationOutcome:
        change.applicationOutcome === 'applied' ? 'committed' : change.applicationOutcome,
    }),
  })
  await ledger.persist({ mergedAt, status: 'inProgress' })

  const completedSourceCleanups: SourceCleanupPlan[] = []

  for (const sourceCleanupPlan of sourceCleanupPlans) {
    const { changeID, cleanup } = sourceCleanupPlan

    try {
      const cleanupOutcome = await cleanup()

      if (cleanupOutcome === 'superseded') {
        recordCleanupOutcome({ changeID, cleanupOutcome })
        continue
      }

      completedSourceCleanups.push(sourceCleanupPlan)
    } catch (error) {
      recordCleanupOutcome({
        changeID,
        cleanupError: getMergeErrorMessage({ error }),
        cleanupOutcome: 'failed',
      })
    }
  }

  if (completedSourceCleanups.length) {
    let registryCleanupResults: Awaited<ReturnType<typeof payload.db.batchProcessing>> | undefined

    try {
      registryCleanupResults = await payload.db.batchProcessing({
        operations: completedSourceCleanups.map(({ changeID }) => ({
          args: {
            branch: false,
            collection: branchChangesCollectionSlug,
            returning: false,
            where: { id: { equals: changeID } },
          },
          operation: 'deleteOne',
        })),
        req,
      })
    } catch (error) {
      const cleanupError = getMergeErrorMessage({ error })

      for (const { changeID } of completedSourceCleanups) {
        recordCleanupOutcome({ changeID, cleanupError, cleanupOutcome: 'failed' })
      }
    }

    const registryCleanupResultByIndex = new Map(
      registryCleanupResults?.map((cleanupResult) => [cleanupResult.index, cleanupResult]),
    )

    for (const [index, { changeID }] of completedSourceCleanups.entries()) {
      if (!registryCleanupResults) {
        continue
      }

      const registryCleanupResult = registryCleanupResultByIndex.get(index)
      let cleanupError: string | undefined

      if (!registryCleanupResult || registryCleanupResult.status === 'unattempted') {
        cleanupError = 'Branch change registry cleanup was not attempted.'
      } else if (registryCleanupResult.status === 'failed') {
        cleanupError = getMergeErrorMessage({ error: registryCleanupResult.error })
      }

      if (!cleanupError) {
        const uploadCleanupPlan = uploadCleanupPlanByChangeID.get(String(changeID))

        if (uploadCleanupPlan) {
          try {
            const collectionConfig = payload.collections[uploadCleanupPlan.collectionSlug]!.config

            for (const sourceDoc of uploadCleanupPlan.sourceDocs) {
              const candidates = await collectStoredFiles({
                collection: collectionConfig,
                doc: sourceDoc,
                req,
              })

              if (candidates.length) {
                await scheduleUnreferencedFileCleanup({
                  candidates,
                  collection: collectionConfig,
                  req,
                })
              } else {
                await deleteUploadFilesExclusiveToDocument({
                  collectionConfig,
                  config: payload.config,
                  deleteFromAdapter: false,
                  req,
                  retainedDoc: uploadCleanupPlan.retainedDoc,
                  sourceDoc,
                })
              }
            }

            const legacyCleanupSourceDoc = uploadCleanupPlan.sourceDocs[0]

            if (!collectionConfig.upload.fileOperations && legacyCleanupSourceDoc) {
              await collectionConfig.upload.deleteFiles?.({
                req,
                retainedDoc: uploadCleanupPlan.retainedDoc,
                sourceDoc: legacyCleanupSourceDoc,
              })
            }
          } catch (error) {
            cleanupError = getMergeErrorMessage({ error })
          }
        }
      }

      recordCleanupOutcome({
        changeID,
        cleanupError,
        cleanupOutcome: cleanupError ? 'failed' : 'completed',
      })
    }
  }

  try {
    const remaining = await payload.count({
      collection: branchChangesCollectionSlug,
      overrideAccess: true,
      req,
      where: { branch: { equals: branch } },
    })

    await payload.update({
      id: branchDoc.id,
      collection: branchesCollectionSlug,
      data:
        remaining.totalDocs === 0
          ? { mergedAt, status: closeBranch ? 'closed' : 'merged' }
          : { mergedAt: null, status: 'open' },
      overrideAccess: true,
      req,
    })
  } catch (error) {
    cleanupErrors.push(getMergeErrorMessage({ error }))

    try {
      await restoreBranchAfterMerge({ branchDocID: branchDoc.id, payload, req })
    } catch (restoreError) {
      cleanupErrors.push(getMergeErrorMessage({ error: restoreError }))
    }
  }

  const completedAt = new Date().toISOString()

  await ledger.persist({
    completedAt,
    error: cleanupErrors.length ? cleanupErrors.join('\n') : undefined,
    mergedAt: mergedAt ?? completedAt,
    status: cleanupErrors.length ? 'cleanupFailed' : 'succeeded',
  })

  await payload.config.branching?.hooks?.afterMerge?.({ branch, req, results: result.merged })

  if (incomingReq) {
    refreshBranchState(incomingReq)
  }
}

export const recordMergeRollback = async ({
  branchDoc,
  incomingReq,
  ledger,
  payload,
  req,
}: {
  branchDoc: { id: number | string }
  incomingReq?: PayloadRequest
  ledger: MergeLedger
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  ledger.mapChanges({
    update: (change) =>
      change.applicationOutcome === 'applied'
        ? { ...change, applicationOutcome: 'rolledBack' }
        : change,
  })
  await ledger.persist({
    completedAt: new Date().toISOString(),
    error: 'Caller-owned transaction rolled back.',
    status: 'failed',
  })
  await restoreBranchAfterMerge({ branchDocID: branchDoc.id, payload, req })

  if (incomingReq) {
    refreshBranchState(incomingReq)
  }
}
