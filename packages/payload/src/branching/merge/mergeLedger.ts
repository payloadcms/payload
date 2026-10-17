import type { Payload, PayloadRequest } from '../../types/index.js'
import type { MergeableChange, MergeEventChange } from '../types.js'

import { createPayloadRequest } from '../../utilities/createPayloadRequest.js'
import { branchMergesCollectionSlug, MAIN_BRANCH } from '../types.js'
import { getMergeErrorMessage } from './utilities.js'

type MergeEventStatus = 'awaitingCommit' | 'cleanupFailed' | 'failed' | 'inProgress' | 'succeeded'

export type MergeLedger = {
  findChange: (args: { changeID: number | string }) => MergeEventChange | undefined
  getChanges: () => MergeEventChange[]
  mapChanges: (args: {
    update: (change: MergeEventChange) => MergeEventChange
  }) => MergeEventChange[]
  persist: (args: {
    completedAt?: string
    error?: string
    mergedAt?: string
    status: MergeEventStatus
  }) => Promise<void>
  persistAppliedChanges: (args: { changeIDs: (number | string)[] }) => Promise<void>
  persistRecovery: (args: { changeID: number | string }) => Promise<boolean>
  updateChange: (args: {
    changeID: number | string
    update: Partial<MergeEventChange>
  }) => MergeEventChange[]
  updateChanges: (args: {
    changeIDs: (number | string)[]
    update: Partial<MergeEventChange>
  }) => MergeEventChange[]
}

export const createMergeLedger = async ({
  branch,
  mergeable,
  payload,
  req,
}: {
  branch: string
  mergeable: MergeableChange[]
  payload: Payload
  req: PayloadRequest
}): Promise<MergeLedger> => {
  const mergeEventReq = await createPayloadRequest({
    branch: false,
    payload,
    user: req.user ?? undefined,
  })
  let changes: MergeEventChange[] = mergeable.map((change) => ({
    applicationOutcome: 'unattempted',
    changeID: String(change.changeID),
    cleanupOutcome: 'pending',
    collectionSlug: change.collectionSlug,
    docID: change.docID === undefined ? undefined : String(change.docID),
    docTitle: String(change.docID ?? change.globalSlug),
    globalSlug: change.globalSlug,
    operation: change.operation,
    recoveryOutcome: 'notNeeded',
    targetID: change.docID === undefined ? change.globalSlug : String(change.docID),
  }))
  const changeIndexByID = new Map(changes.map((change, index) => [change.changeID, index]))
  const mergeEvent = await payload.create({
    collection: branchMergesCollectionSlug,
    data: {
      branch,
      changes,
      mergedByCollection: req.user?.collection,
      mergedByID: req.user?.id === undefined ? undefined : String(req.user.id),
      mergedByLabel: (req.user as { email?: string } | null)?.email,
      startedAt: new Date().toISOString(),
      status: 'inProgress',
      targetBranch: MAIN_BRANCH,
    },
    overrideAccess: true,
    req: mergeEventReq,
  })

  const updateChanges: MergeLedger['updateChanges'] = ({ changeIDs, update }) => {
    for (const changeID of changeIDs) {
      const changeIndex = changeIndexByID.get(String(changeID))
      const change = changeIndex === undefined ? undefined : changes[changeIndex]

      if (changeIndex !== undefined && change) {
        changes[changeIndex] = { ...change, ...update }
      }
    }

    return changes
  }

  const updateChange: MergeLedger['updateChange'] = ({ changeID, update }) =>
    updateChanges({ changeIDs: [changeID], update })

  const persist: MergeLedger['persist'] = async ({ completedAt, error, mergedAt, status }) => {
    await payload.update({
      id: mergeEvent.id,
      collection: branchMergesCollectionSlug,
      data: { changes, completedAt, error, mergedAt, status },
      overrideAccess: true,
      req: mergeEventReq,
    })
  }

  const persistAppliedChanges: MergeLedger['persistAppliedChanges'] = async ({ changeIDs }) => {
    try {
      await persist({ status: 'inProgress' })
    } catch (error) {
      updateChanges({
        changeIDs,
        update: {
          applicationOutcome: 'unknown',
          error: getMergeErrorMessage({ error }),
          recoveryOutcome: 'unknown',
        },
      })

      throw error
    }
  }

  const persistRecovery: MergeLedger['persistRecovery'] = async ({ changeID }) => {
    try {
      await persist({ status: 'inProgress' })

      return true
    } catch (error) {
      const recoveryError = getMergeErrorMessage({ error })
      const change = changes.find(
        ({ changeID: candidateChangeID }) => candidateChangeID === String(changeID),
      )

      updateChange({
        changeID,
        update: {
          recoveryError: change?.recoveryError
            ? `${change.recoveryError}\n${recoveryError}`
            : recoveryError,
          recoveryOutcome: 'unknown',
        },
      })

      return false
    }
  }

  return {
    findChange: ({ changeID }) =>
      changes.find(({ changeID: candidateChangeID }) => candidateChangeID === String(changeID)),
    getChanges: () => changes,
    mapChanges: ({ update }) => {
      changes = changes.map(update)

      return changes
    },
    persist,
    persistAppliedChanges,
    persistRecovery,
    updateChange,
    updateChanges,
  }
}
