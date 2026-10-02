import type { Payload, PayloadRequest } from '../types/index.js'
import type { DiscardOptions } from './discard.js'
import type { BlockedChange } from './preflight.js'
import type { MergeableChange, MergeProgress, MergeWarning } from './types.js'
import type { BranchMergeValidationError } from './validation.js'

import { discardBranchChanges } from './discard.js'
import { executeMerge } from './merge/executeMerge.js'
import { prepareMerge, revalidatePreparedMerge } from './merge/prepareMerge.js'
import { refreshBranchState } from './resolveBranch.js'
import { branchesCollectionSlug } from './types.js'

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
  const {
    allChangesCount,
    applicable,
    applicableGlobals,
    branchDoc,
    mergeable,
    req,
    result,
    retriedCleanups,
  } = prepared
  const hasChangesToApply = applicable.length > 0 || applicableGlobals.length > 0

  if (dryRun || !hasChangesToApply) {
    if (!dryRun && retriedCleanups.length && allChangesCount === 0) {
      const mergedAt = new Date().toISOString()

      await payload.update({
        id: branchDoc.id,
        collection: branchesCollectionSlug,
        data: { mergedAt, status: closeBranch ? 'closed' : 'merged' },
        overrideAccess: true,
        req,
      })

      if (incomingReq) {
        refreshBranchState(incomingReq)
      }
    }

    return result
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

    return result
  }

  return executeMerge({
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
