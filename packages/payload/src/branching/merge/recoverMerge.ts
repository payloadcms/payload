import type { Payload, PayloadRequest } from '../../types/index.js'
import type { MergeEventChange } from '../types.js'
import type { SourceCleanupPlan } from './finalizeMerge.js'
import type { MergeLedger } from './mergeLedger.js'
import type { SourceRecoveryOutcome } from './utilities.js'

import { createMainBranchRequest } from '../validation.js'
import { getMergeErrorMessage } from './utilities.js'

const hasTargetVersion = async ({
  change,
  payload,
  req,
}: {
  change: MergeEventChange
  payload: Payload
  req: PayloadRequest
}): Promise<boolean> => {
  if (!change.beforeVersionID) {
    return false
  }

  if (change.globalSlug) {
    const { docs } = await payload.db.findGlobalVersions({
      branch: false,
      global: change.globalSlug,
      limit: 1,
      pagination: false,
      req,
      where: { id: { equals: change.beforeVersionID } },
    })

    return docs.length > 0
  }

  if (!change.collectionSlug) {
    return false
  }

  const { docs } = await payload.db.findVersions({
    branch: false,
    collection: change.collectionSlug,
    limit: 1,
    pagination: false,
    req,
    where: {
      and: [{ id: { equals: change.beforeVersionID } }, { parent: { equals: change.targetID } }],
    },
  })

  return docs.length > 0
}

export const recoverMergeFailure = async ({
  activeChangeID,
  didRollbackTransaction,
  error,
  hasTransaction,
  isTransactionOutcomeUnknown,
  ledger,
  overrideAccess,
  payload,
  req,
  sourceCleanupPlans,
}: {
  activeChangeID?: number | string
  didRollbackTransaction: boolean
  error: unknown
  hasTransaction: boolean
  isTransactionOutcomeUnknown: boolean
  ledger: MergeLedger
  overrideAccess: boolean
  payload: Payload
  req: PayloadRequest
  sourceCleanupPlans: SourceCleanupPlan[]
}): Promise<void> => {
  if (isTransactionOutcomeUnknown) {
    ledger.mapChanges({
      update: (change) =>
        change.applicationOutcome === 'applied'
          ? { ...change, applicationOutcome: 'unknown', cleanupOutcome: 'unknown' }
          : change,
    })
  } else if (didRollbackTransaction) {
    ledger.mapChanges({
      update: (change) =>
        change.applicationOutcome === 'applied'
          ? { ...change, applicationOutcome: 'rolledBack', cleanupOutcome: 'pending' }
          : change,
    })
  }

  if (!hasTransaction) {
    for (const recoveryPlan of [...sourceCleanupPlans].reverse()) {
      const change = ledger.findChange({ changeID: recoveryPlan.changeID })

      if (!change || change.applicationOutcome !== 'applied') {
        continue
      }

      ledger.updateChange({
        changeID: change.changeID,
        update: { recoveryOutcome: 'pending' },
      })

      if (!(await ledger.persistRecovery({ changeID: change.changeID }))) {
        continue
      }

      if (
        !recoveryPlan.recover &&
        (!change.beforeVersionID || (!change.collectionSlug && !change.globalSlug))
      ) {
        ledger.updateChange({
          changeID: change.changeID,
          update: { recoveryOutcome: 'unavailable' },
        })
        await ledger.persistRecovery({ changeID: change.changeID })
        continue
      }

      try {
        let recoveryOutcome: SourceRecoveryOutcome

        if (recoveryPlan.recover) {
          recoveryOutcome = await recoveryPlan.recover()
        } else {
          const recoveryReq = createMainBranchRequest({ req })

          if (!(await hasTargetVersion({ change, payload, req: recoveryReq }))) {
            ledger.updateChange({
              changeID: change.changeID,
              update: { recoveryOutcome: 'unavailable' },
            })
            await ledger.persistRecovery({ changeID: change.changeID })
            continue
          }

          if (change.globalSlug) {
            await payload.restoreGlobalVersion({
              id: change.beforeVersionID!,
              slug: change.globalSlug,
              overrideAccess,
              req: recoveryReq,
            })
          } else {
            await payload.restoreVersion({
              id: change.beforeVersionID!,
              collection: change.collectionSlug!,
              overrideAccess,
              req: recoveryReq,
            })
          }

          recoveryOutcome = 'restored'
        }

        ledger.updateChange({
          changeID: change.changeID,
          update: { recoveryOutcome },
        })
      } catch (recoveryError) {
        ledger.updateChange({
          changeID: change.changeID,
          update: {
            recoveryError: getMergeErrorMessage({ error: recoveryError }),
            recoveryOutcome: 'failed',
          },
        })
      }

      await ledger.persistRecovery({ changeID: change.changeID })
    }
  }

  const errorMessage = getMergeErrorMessage({ error })

  if (activeChangeID !== undefined) {
    const activeChange = ledger.findChange({ changeID: activeChangeID })

    if (activeChange?.applicationOutcome === 'attempted') {
      ledger.updateChange({
        changeID: activeChangeID,
        update: { applicationOutcome: 'failed', error: errorMessage },
      })
    }
  }

  ledger.mapChanges({
    update: (change) =>
      change.applicationOutcome === 'attempted'
        ? { ...change, applicationOutcome: 'unattempted' }
        : change,
  })

  try {
    await ledger.persist({
      completedAt: new Date().toISOString(),
      error: errorMessage,
      status: 'failed',
    })
  } catch (mergeEventError) {
    payload.logger.error({
      err: mergeEventError,
      msg: 'Failed to record a branch merge failure.',
    })
  }
}
