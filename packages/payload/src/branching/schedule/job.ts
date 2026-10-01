import type { CollectionSlug, User } from '../../index.js'
import type { TaskConfig } from '../../queues/config/types/taskTypes.js'
import type { MergeResult } from '../merge.js'

import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { createIsolatedDeferredCleanupContext } from '../../utilities/transactionCallbacks.js'
import { mergeBranch } from '../merge.js'
import { branchesCollectionSlug } from '../types.js'

export type ScheduleMergeTaskInput = {
  /** Branch slug. Stored rather than the document ID: the slug is what `_branch` holds. */
  branch: string
  /** Change IDs to apply, or empty to apply whatever is pending when the job fires. */
  changes?: string[]
  closeBranch?: boolean
  /** The user whose production permissions the merge is checked against. */
  user?:
    | {
        relationTo: CollectionSlug
        value: number | string
      }
    | number
    | string
}

type Args = {
  authCollectionSlugs: string[]
}

/**
 * The `scheduleMerge` task: applies a branch to main at an appointed time.
 *
 * Modelled on `schedulePublish`, and identical in shape — a job carrying the intent,
 * the user who formed it, and a `waitUntil`. Merging raises three questions that
 * publishing one document does not, and the answers are the substance of this task:
 *
 * **Whose permissions?** The queueing user's, re-resolved at fire time and applied
 * through the ordinary preflight (`overrideAccess: false`). This deliberately differs
 * from `schedulePublish`, which falls back to `overrideAccess: user === null` when the
 * user has since been deleted. A merge writes across production, so the same fallback
 * would turn a deleted account into an unchecked one — the job fails instead, and a
 * failed job is a signal someone can act on.
 *
 * **What if the branch moved?** Queued change IDs that no longer exist are skipped:
 * `mergeBranch` matches the selection against what is pending, so a discarded or
 * already-merged change simply does not match. A schedule with no selection applies
 * whatever is pending when it fires, which is what "merge this branch at 9am" means.
 *
 * **What if main moved?** It proceeds. `main-moved` is advisory even interactively —
 * branch data wins outright (§16) — and failing would leave the branch unmerged with
 * nobody watching either. The warnings are returned as task output so they remain
 * inspectable on the job afterwards.
 */
export const getScheduleMergeTask = ({
  authCollectionSlugs,
}: Args): TaskConfig<{
  input: ScheduleMergeTaskInput
  output: { merged: number; warnings: MergeResult['warnings'] }
}> => ({
  slug: 'scheduleMerge',
  handler: async ({ input, req }) => {
    let user: null | User = null

    if (input.user != null) {
      if (typeof input.user !== 'object') {
        throw new Error(
          `Scheduled merge of branch "${input.branch}" is missing the scheduling user auth collection and cannot run.`,
        )
      }

      if (
        typeof input.user.relationTo !== 'string' ||
        !authCollectionSlugs.includes(input.user.relationTo) ||
        (typeof input.user.value !== 'number' && typeof input.user.value !== 'string')
      ) {
        throw new Error(
          `Scheduled merge of branch "${input.branch}" has an invalid scheduling user relationship and cannot run.`,
        )
      }

      user = (await req.payload.findByID({
        id: input.user.value,
        collection: input.user.relationTo,
        depth: 0,
        disableErrors: true,
        overrideAccess: true,
        req,
      })) as null | User

      if (user) {
        user.collection = input.user.relationTo
      }
    }

    if (!user) {
      throw new Error(
        `Scheduled merge of branch "${input.branch}" has no resolvable user, so its permissions cannot be checked. Re-schedule it as a current user.`,
      )
    }

    const branchDoc = (
      await req.payload.find({
        collection: branchesCollectionSlug,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: { slug: { equals: input.branch } },
      })
    ).docs[0]

    const progressReq = isolateObjectProperty(req, ['context', 'transactionID'])

    progressReq.context = createIsolatedDeferredCleanupContext({ req })
    delete progressReq.transactionID

    const writeProgress = async ({ mergeProgress }: { mergeProgress: null | string }) => {
      if (branchDoc) {
        await req.payload.update({
          id: branchDoc.id,
          collection: branchesCollectionSlug,
          data: { mergeProgress },
          depth: 0,
          overrideAccess: true,
          req: progressReq,
        })
      }
    }

    await writeProgress({ mergeProgress: 'running' })

    let result: MergeResult

    try {
      result = await mergeBranch(req.payload, {
        branch: input.branch,
        changes: input.changes?.length ? input.changes : undefined,
        closeBranch: Boolean(input.closeBranch),
        overrideAccess: false,
        req,
        user,
      })
    } catch (error) {
      try {
        await writeProgress({ mergeProgress: null })
      } catch (err) {
        req.payload.logger.error({ err, msg: 'Failed to clear scheduled merge progress.' })
      }

      throw error
    }

    // Cleared after a successful merge too: a stale "running" outlives the run and reads as a
    // merge still in flight. A cleanup failure now fails the job because there is no primary merge
    // error to preserve.
    await writeProgress({ mergeProgress: null })

    return {
      output: { merged: result.merged.length, warnings: result.warnings },
    }
  },
  inputSchema: [
    {
      name: 'branch',
      type: 'text',
      required: true,
    },
    {
      name: 'changes',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'closeBranch',
      type: 'checkbox',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: authCollectionSlugs,
    },
  ],
})
