import type { Payload, PayloadRequest } from '../types/index.js'
import type { DiscardOptions } from './discard.js'
import type { BlockedChange } from './preflight.js'
import type { MergeableChange, MergeProgress, MergeWarning } from './types.js'
import type { BranchMergeValidationError } from './validation.js'

import { assertBranchUpdateAccess } from './assertBranchUpdateAccess.js'
import { discardBranchChanges } from './discard.js'
import { beginBranchMerge, restoreBranchAfterMerge } from './merge/branchMergeStatus.js'
import { executeMerge } from './merge/executeMerge.js'
import { prepareMerge, revalidatePreparedMerge } from './merge/prepareMerge.js'
import { retryFailedCleanups } from './merge/retryFailedCleanups.js'
import { refreshBranchState } from './resolveBranch.js'
import { branchChangesCollectionSlug, branchesCollectionSlug } from './types.js'

export type MergeResult = {
  /** Changes that cannot be applied because of access or an unavailable dependency. */
  blocked: BlockedChange[]
  /** True when at least one selected change can be applied. */
  canMerge: boolean
  mergeable: MergeableChange[]
  merged: MergeableChange[]
  validationErrors: BranchMergeValidationError[]
  warnings: MergeWarning[]
}

/**
 * Emitted once per change, immediately before it is applied.
 *
 * A merge is a sequential loop over an arbitrary number of documents, so it is
 * the one Payload operation where "what is it doing right now" is a real
 * question. Reported by callback rather than persisted: the caller decides
 * whether that means a streamed HTTP response, a log line, or nothing.
 */
export type MergeOptions = {
  branch: string
  /** Change IDs to apply. Omit to apply every pending change. */
  changes?: (number | string)[]
  /**
   * Close the branch once everything it held has been applied.
   *
   * Closing is terminal: a closed branch rejects writes and cannot be merged
   * again. Offered as a choice at merge time rather than implied by merging,
   * because "merge and keep working" and "merge and be done" are both ordinary
   * intents and only the author knows which one this is. Ignored when changes are
   * left behind — a branch with pending work is not finished by definition.
   *
   * @default false
   */
  closeBranch?: boolean
  /** Report what would happen without writing anything. */
  dryRun?: boolean
  /**
   * Called before each change is applied. Awaited, so a slow consumer throttles
   * the merge rather than falling behind it.
   */
  onProgress?: (progress: MergeProgress, req: PayloadRequest) => Promise<void> | void
  /**
   * Skip the per-document permission checks.
   *
   * HTTP callers must pass `false` together with `user`: branch writes are
   * deliberately permissive on the assumption that nothing is real until
   * merge.
   *
   * @default false
   */
  overrideAccess?: boolean
  req?: PayloadRequest
  /**
   * The user whose production permissions the merge is checked against.
   * Defaults to `req.user`.
   */
  user?: NonNullable<PayloadRequest['user']>
}

/**
 * Applies a branch's changes to `main`.
 *
 * Branch data wins outright — there is no field-level reconciliation. What
 * replaces conflict resolution is selection: callers choose which changes to
 * apply, and anything left behind keeps the branch open.
 *
 * Every write runs through the ordinary Local API so that all document hooks,
 * validation and version creation behave exactly as they would for a hand-made
 * edit on main.
 */
export const mergeBranch = async (
  payload: Payload,
  {
    branch,
    changes: selected,
    closeBranch = false,
    dryRun = false,
    onProgress,
    overrideAccess = false,
    req: incomingReq,
    user,
  }: MergeOptions,
): Promise<MergeResult> => {
  const prepared = await prepareMerge({
    branch,
    dryRun,
    incomingReq,
    overrideAccess,
    payload,
    selected,
    user,
  })
  const { applicable, applicableGlobals, branchDoc, mergeable, req, result, retryableCleanups } =
    prepared
  const hasChangesToApply =
    applicable.length > 0 || applicableGlobals.length > 0 || retryableCleanups.length > 0

  if (closeBranch && !dryRun && !overrideAccess) {
    await assertBranchUpdateAccess({ branchDoc, req })
  }

  if (dryRun || !hasChangesToApply) {
    return result
  }

  await beginBranchMerge({ branchDocID: branchDoc.id, payload, req })

  try {
    if (retryableCleanups.length) {
      const cleanupRetry = await retryFailedCleanups({ branch, payload, req, selected })
      const retryableChangeIDs = new Set(retryableCleanups.map(({ changeID }) => String(changeID)))
      const retriedChangeIDs = new Set(cleanupRetry.retried.map(({ changeID }) => String(changeID)))
      const currentMergeable = mergeable.filter(
        ({ changeID }) =>
          !retryableChangeIDs.has(String(changeID)) || retriedChangeIDs.has(String(changeID)),
      )

      mergeable.splice(0, mergeable.length, ...currentMergeable)
      result.canMerge = mergeable.length > 0
      result.mergeable = mergeable
      result.merged.push(...cleanupRetry.retried)

      if (applicable.length === 0 && applicableGlobals.length === 0) {
        const remaining = await payload.count({
          collection: branchChangesCollectionSlug,
          overrideAccess: true,
          req,
          where: { branch: { equals: branch } },
        })
        const mergedAt = new Date().toISOString()

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

        if (incomingReq) {
          refreshBranchState(incomingReq)
        }

        return result
      }
    }

    await payload.config.branching?.hooks?.beforeMerge?.({
      branch,
      changes: mergeable,
      req,
      warnings: result.warnings,
    })

    const revalidation = await revalidatePreparedMerge({
      applicable,
      applicableGlobals,
      branch,
      overrideAccess,
      payload,
      req,
    })

    if (!revalidation.isValid) {
      result.blocked = revalidation.blocked
      result.canMerge = false
      result.mergeable = []
      result.validationErrors = revalidation.validationErrors

      await restoreBranchAfterMerge({ branchDocID: branchDoc.id, payload, req })

      return result
    }

    return await executeMerge({
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
    })
  } catch (error) {
    try {
      await restoreBranchAfterMerge({ branchDocID: branchDoc.id, payload, req })
    } catch (restoreError) {
      payload.logger.error({
        err: restoreError,
        msg: `Failed to restore branch "${branch}" after a merge error`,
      })
    }

    throw error
  }
}

/**
 * A branch document's data, ready to be written onto main's row.
 *
 * Array and block rows carry primary keys belonging to the branch's copy, and writing them
 * onto main's row collides with the rows the branch's copy still owns. Passing an empty
 * `existingDoc` drops every nested key so the write mints its own — which is what
 * `copyDataWithFreshRowIDs` is for, and why the bulk update path already calls it.
 */
export const getBranchesLocalAPI = (payload: Payload) => ({
  discard: (options: DiscardOptions) => discardBranchChanges(payload, options),
  merge: (options: MergeOptions) => mergeBranch(payload, options),
})
