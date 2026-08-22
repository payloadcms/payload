import type { User } from '../../index.js'
import type { TaskConfig } from '../../queues/config/types/taskTypes.js'
import type { MergeResult } from '../merge.js'

import { mergeBranch } from '../merge.js'
import { branchesCollectionSlug } from '../types.js'

export type ScheduleMergeTaskInput = {
  /** Branch slug. Stored rather than the document ID: the slug is what `_branch` holds. */
  branch: string
  /** Change IDs to apply, or empty to apply whatever is pending when the job fires. */
  changes?: string[]
  closeBranch?: boolean
  /** The user whose production permissions the merge is checked against. */
  user?: number | string
}

type Args = {
  adminUserSlug: string
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
  adminUserSlug,
}: Args): TaskConfig<{
  input: ScheduleMergeTaskInput
  output: { merged: number; warnings: MergeResult['warnings'] }
}> => ({
  slug: 'scheduleMerge',
  handler: async ({ input, req }) => {
    const userID = input.user

    let user: null | User = null

    if (userID) {
      user = (await req.payload.findByID({
        id: userID,
        collection: adminUserSlug,
        depth: 0,
        disableErrors: true,
      })) as null | User

      if (user) {
        user.collection = adminUserSlug
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

    const writeProgress = async (mergeProgress: null | string) => {
      if (branchDoc) {
        await req.payload.update({
          id: branchDoc.id,
          collection: branchesCollectionSlug,
          data: { mergeProgress },
          depth: 0,
          overrideAccess: true,
          req,
        })
      }
    }

    // Throttled to about twenty writes regardless of branch size. A scheduled merge
    // has no reader mid-run — this is only for whoever opens the branch page while it
    // is going — so a write per document would double the transaction's work to
    // narrate it to nobody, which is the cost the streamed path exists to avoid.
    let lastWritten = 0

    try {
      const result = await mergeBranch(req.payload, {
        branch: input.branch,
        changes: input.changes?.length ? input.changes : undefined,
        closeBranch: Boolean(input.closeBranch),
        onProgress: async ({ current, total }) => {
          const step = Math.max(1, Math.floor(total / 20))

          if (current === 1 || current === total || current - lastWritten >= step) {
            lastWritten = current
            await writeProgress(`${current}/${total}`)
          }
        },
        overrideAccess: false,
        req,
        user,
      })

      return {
        output: { merged: result.merged.length, warnings: result.warnings },
      }
    } finally {
      // Cleared whether the merge finished or threw: a stale "12/230" outlives the
      // run and reads as a merge still in flight.
      await writeProgress(null)
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
      relationTo: adminUserSlug,
    },
  ],
})
