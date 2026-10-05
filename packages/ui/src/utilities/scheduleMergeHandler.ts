import type { ServerFunction, Where } from 'payload'

import { assertBranchUpdateAccess, canAccessAdmin, Forbidden } from 'payload'
import { branchChangesCollectionSlug, branchesCollectionSlug } from 'payload/shared'

import type { SummarizableChange } from '../elements/ChangeSummary/index.js'

import { buildUpcomingMergeWhere } from './buildUpcomingMergeWhere.js'

export type ScheduleMergeHandlerArgs = {
  /** `payload-branches` document ID, so read access can be checked before queueing. */
  branchID?: number | string
  changes?: (number | string)[]
  closeBranch?: boolean
  date?: Date | string
  /** The job to cancel, instead of queueing one. */
  deleteID?: number | string
}

export type GetBranchMergeSummaryHandlerArgs = {
  /** `payload-branches` document ID, so read access is checked before internal rows are read. */
  branchID: number | string
  sampleLimit: number
}

export type BranchMergeSummary = {
  docs: SummarizableChange[]
  totalDocs: number
}

export type UpcomingBranchMerge = {
  id: number | string
  waitUntil: string
}

/**
 * Returns the safe summary used when the merge modal opens outside the branch view.
 *
 * The change registry denies direct API access. Resolve the branch through normal
 * read access first, then read only the non-sensitive grouping fields internally.
 */
export const getBranchMergeSummaryHandler: ServerFunction<
  GetBranchMergeSummaryHandlerArgs,
  Promise<BranchMergeSummary>
> = async ({ branchID, req, sampleLimit }) => {
  const { payload, user } = req
  const requestedSampleLimit = Number.isFinite(sampleLimit) ? Math.floor(sampleLimit) : 200
  const sampleLimitToUse = Math.min(Math.max(requestedSampleLimit, 1), 200)

  await canAccessAdmin({ req })

  const branch = await payload.findByID({
    id: branchID,
    collection: branchesCollectionSlug,
    depth: 0,
    disableErrors: true,
    overrideAccess: false,
    req,
    user,
  })

  if (!branch || typeof branch.slug !== 'string') {
    throw new Forbidden(req.t)
  }

  const summary = await payload.find({
    collection: branchChangesCollectionSlug,
    depth: 0,
    limit: sampleLimitToUse,
    overrideAccess: true,
    req,
    select: {
      collectionSlug: true,
      globalSlug: true,
      operation: true,
    },
    where: { branch: { equals: branch.slug } },
  })

  const docs = summary.docs.reduce<SummarizableChange[]>((summaries, change) => {
    const collectionSlug =
      typeof change.collectionSlug === 'string' ? change.collectionSlug : undefined
    const globalSlug = typeof change.globalSlug === 'string' ? change.globalSlug : undefined
    const operation =
      change.operation === 'create' ||
      change.operation === 'delete' ||
      change.operation === 'update'
        ? change.operation
        : undefined

    if ((!collectionSlug && !globalSlug) || !operation) {
      return summaries
    }

    summaries.push({ collectionSlug, globalSlug, operation })

    return summaries
  }, [])

  return {
    docs,
    totalDocs: summary.totalDocs,
  }
}

/** Returns upcoming merge jobs only after confirming that the caller can read the branch. */
export const getUpcomingBranchMergesHandler: ServerFunction<
  { branchID: number | string },
  Promise<UpcomingBranchMerge[]>
> = async ({ branchID, req }) => {
  const { payload, user } = req

  await canAccessAdmin({ req })

  const branch = await payload.findByID({
    id: branchID,
    collection: branchesCollectionSlug,
    depth: 0,
    disableErrors: true,
    overrideAccess: false,
    req,
    user,
  })

  if (!branch || typeof branch.slug !== 'string') {
    throw new Forbidden(req.t)
  }

  const jobs = await payload.find({
    collection: 'payload-jobs',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    req,
    select: { waitUntil: true },
    sort: 'waitUntil',
    where: buildUpcomingMergeWhere({ branchSlug: branch.slug }),
  })

  return jobs.docs.reduce<UpcomingBranchMerge[]>((upcomingMerges, job) => {
    const hasValidID = typeof job.id === 'number' || typeof job.id === 'string'
    const waitUntil =
      typeof job.waitUntil === 'string'
        ? job.waitUntil
        : job.waitUntil instanceof Date
          ? job.waitUntil.toISOString()
          : undefined

    if (hasValidID && waitUntil) {
      upcomingMerges.push({ id: job.id, waitUntil })
    }

    return upcomingMerges
  }, [])
}

/**
 * Queues — or cancels — a merge to run at an appointed time.
 *
 * The counterpart of `schedulePublishHandler`, and deliberately the same shape: a
 * `payload-jobs` row with `waitUntil` and the user who formed the intent, fired by
 * whatever runs the queue.
 *
 * Access is checked twice, in two different senses. Here, that the caller can reach
 * the branch at all; and again when the job fires, where the per-document preflight
 * runs as the stored user (§13). Queue-time permission is not evidence of fire-time
 * permission, and the merge is the write that matters.
 */
export const scheduleMergeHandler: ServerFunction<ScheduleMergeHandlerArgs> = async ({
  branchID,
  changes,
  closeBranch,
  date,
  deleteID,
  req,
}) => {
  const { i18n, payload, user } = req

  await canAccessAdmin({ req })

  try {
    if (deleteID) {
      const scheduledMergeJob = await payload.findByID({
        id: deleteID,
        collection: 'payload-jobs',
        depth: 0,
        disableErrors: true,
        overrideAccess: true,
        req,
      })
      const scheduledBranchSlug =
        scheduledMergeJob?.taskSlug === 'scheduleMerge' &&
        typeof scheduledMergeJob.input?.branch === 'string'
          ? scheduledMergeJob.input.branch
          : undefined

      if (!scheduledBranchSlug) {
        throw new Forbidden(req.t)
      }

      const readableBranch = (
        await payload.find({
          collection: branchesCollectionSlug,
          depth: 0,
          limit: 1,
          overrideAccess: false,
          pagination: false,
          req,
          user,
          where: { slug: { equals: scheduledBranchSlug } },
        })
      ).docs[0]

      if (!readableBranch) {
        throw new Forbidden(req.t)
      }

      await assertBranchUpdateAccess({ branchDoc: readableBranch, req })

      await payload.delete({
        collection: 'payload-jobs',
        overrideAccess: true,
        req,
        where: buildScheduledMergeCancellationWhere({
          branchSlug: scheduledBranchSlug,
          jobID: deleteID,
        }),
      })

      return { message: i18n.t('general:success') }
    }

    if (!branchID || !date) {
      return { error: 'A branch and a date are both required to schedule a merge.' }
    }

    const branchDoc = await payload.findByID({
      id: branchID,
      collection: branchesCollectionSlug,
      depth: 0,
      disableErrors: true,
      overrideAccess: false,
      req,
      user,
    })

    if (!branchDoc) {
      return { error: 'Branch not found.' }
    }

    await assertBranchUpdateAccess({ branchDoc, req })

    // A closed branch takes no further merges, so it must not take a promise of one
    // either — the job would fail at fire time with nobody watching.
    if (branchDoc.status === 'closed') {
      return { error: 'This branch is closed and cannot be merged.' }
    }

    await payload.jobs.queue({
      input: {
        branch: branchDoc.slug as string,
        changes: changes?.map(String),
        closeBranch: Boolean(closeBranch),
        user:
          user && user.collection
            ? {
                relationTo: user.collection,
                value: user.id,
              }
            : undefined,
      },
      req,
      task: 'scheduleMerge',
      waitUntil: date instanceof Date ? date : new Date(date),
    })

    return { message: i18n.t('general:success') }
  } catch (err) {
    const error = deleteID
      ? `Error cancelling scheduled merge ${deleteID}`
      : `Error scheduling merge of branch ${branchID}`

    payload.logger.error({ err, msg: error })

    return { error }
  }
}

export const buildScheduledMergeCancellationWhere = ({
  branchSlug,
  jobID,
}: {
  branchSlug: string
  jobID: number | string
}): Where => ({
  and: [
    { id: { equals: jobID } },
    { taskSlug: { equals: 'scheduleMerge' } },
    { completedAt: { exists: false } },
    { processingUntil: { exists: false } },
    { 'input.branch': { equals: branchSlug } },
  ],
})

/**
 * The `where` for a branch's upcoming scheduled merges.
 *
 * Mirrors `buildUpcomingScheduleWhere`: same collection, same shape, filtered on the
 * branch slug carried in the job's input.
 */
export { buildUpcomingMergeWhere }
