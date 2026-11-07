import type { BulkOperationResult, TypeWithID } from '../../collections/config/types.js'
import type { ManyOptions } from '../../collections/operations/local/update.js'
import type { Find, FindArgs, PaginatedDocs, UpdateJobsArgs } from '../../database/types.js'
import type { Job, JobLog } from '../../index.js'
import type { PayloadRequest, Sort, Where } from '../../types/index.js'

import { jobAfterRead, jobsCollectionSlug } from '../config/collection.js'
import { getCurrentDate } from './getCurrentDate.js'

type BaseArgs = {
  data: Partial<Job>
  depth?: number
  disableTransaction?: boolean
  limit?: number
  req: PayloadRequest
  returning?: boolean
}

type ArgsByID = {
  id: number | string
  limit?: never
  sort?: never
  where?: never
}

type ArgsWhere = {
  id?: never
  limit?: number
  sort?: Sort
  where: Where
}

type RunJobsArgs = (ArgsByID | ArgsWhere) & BaseArgs

const pendingClaimHooksByReq = new WeakMap<object, Set<number | string>>()
const patchedDbAdapters = new WeakSet<object>()

/**
 * Convenience method for updateJobs by id
 */
export async function updateJob(args: ArgsByID & BaseArgs) {
  const result = await updateJobs(args)
  if (result) {
    return result[0]
  }
}

/**
 * Helper for updating jobs in the most performant way possible.
 * Handles deciding whether it can used direct db methods or not, and if so,
 * manually runs the afterRead hook that populates the `taskStatus` property.
 */
export async function updateJobs({
  id,
  data,
  depth,
  disableTransaction,
  limit: limitArg,
  req,
  returning,
  sort,
  where: whereArg,
}: RunJobsArgs): Promise<Job[] | null> {
  const limit = id ? 1 : limitArg
  const where = id ? { id: { equals: id } } : whereArg

  if (depth || req.payload.config?.jobs?.runHooks) {
    if (!id && isJobClaim(data)) {
      return claimJobsWithHooks({
        data,
        depth,
        disableTransaction,
        limit,
        req,
        returning,
        sort,
        where: where as Where,
      })
    }

    if (id && data.log && '$push' in data.log) {
      const job = await req.payload.findByID({
        id,
        collection: jobsCollectionSlug,
        depth: 0,
        req,
      })

      data = { ...data, log: [...(job.log ?? []), data.log.$push as JobLog] }
    }

    const result = await req.payload.update({
      id,
      collection: jobsCollectionSlug,
      data,
      depth,
      disableTransaction,
      limit,
      req,
      where,
    } as ManyOptions<any, any>)
    if (returning === false || !result) {
      return null
    }
    return result.docs as Job[]
  }

  return updateJobsInDatabase({ id, data, limit, req, returning, sort, where })
}

/**
 * A claim marks jobs as `processing: true` before they are run. Database adapters perform claims
 * conditionally, so that a job selected by multiple runners at the same time is claimed by only one of them.
 */
function isJobClaim(data: Partial<Job>): boolean {
  return (
    data.processing === true &&
    Object.keys(data).every((field) => field === 'processing' || field === 'updatedAt')
  )
}

/**
 * Ensures the initial `payload.db.find` performed by `payload.update` for a pre-claimed batch sees
 * `processing: false` on the claimed documents, so collection and field hooks (`beforeValidate`,
 * `beforeChange`, `afterChange`) observe the `false -> true` transition while the database rows
 * remain locked with `processing: true`.
 */
function registerPendingClaimHooks(req: PayloadRequest, claimedIDs: (number | string)[]): void {
  const db = req.payload?.db
  if (!db || typeof db.find !== 'function') {
    return
  }

  if (!patchedDbAdapters.has(db)) {
    const originalFind = db.find.bind(db)

    const wrappedFind: Find = async <T = TypeWithID>(
      findArgs: FindArgs,
    ): Promise<PaginatedDocs<T>> => {
      const claimedSet =
        findArgs?.collection === jobsCollectionSlug && findArgs?.req
          ? pendingClaimHooksByReq.get(findArgs.req)
          : undefined

      if (claimedSet && findArgs.req) {
        pendingClaimHooksByReq.delete(findArgs.req)
      }

      const findResult = await originalFind<T>(findArgs)

      if (!claimedSet || !findResult?.docs?.length) {
        return findResult
      }

      return {
        ...findResult,
        docs: findResult.docs.map((doc) =>
          doc &&
          typeof doc === 'object' &&
          'id' in doc &&
          claimedSet.has((doc as { id: number | string }).id)
            ? ({ ...doc, processing: false } as T)
            : doc,
        ),
      }
    }

    db.find = wrappedFind
    patchedDbAdapters.add(db)
  }

  pendingClaimHooksByReq.set(req, new Set(claimedIDs))
}

/**
 * `payload.update` selects documents and then updates them one by one, which is not atomic.
 * When hooks or population are enabled, jobs are therefore claimed through the database adapter first,
 * and only the jobs this runner actually claimed are passed through `payload.update` so that the
 * collection hooks and `depth` population still run for them.
 *
 * Pre-claim `processing: false` state is preserved for `originalDoc` / `previousDoc` in hooks, and any
 * job whose hook update throws or fails is released back to `processing: false`.
 */
async function claimJobsWithHooks({
  data,
  depth,
  disableTransaction,
  limit,
  req,
  returning,
  sort,
  where,
}: ArgsWhere & BaseArgs): Promise<Job[] | null> {
  const claimedJobs = await updateJobsInDatabase({
    data: { ...data },
    limit,
    req,
    returning: true,
    sort,
    where,
  })

  if (!claimedJobs?.length) {
    return null
  }

  const claimedIDs = claimedJobs.map((job) => job.id)
  const claimReq = {
    ...req,
  } as PayloadRequest

  registerPendingClaimHooks(claimReq, claimedIDs)

  let result: BulkOperationResult<any, any>
  try {
    result = await req.payload.update({
      collection: jobsCollectionSlug,
      data,
      depth,
      disableTransaction,
      limit: claimedIDs.length,
      req: claimReq,
      where: { id: { in: claimedIDs } },
    } as ManyOptions<any, any>)
  } catch (error) {
    await updateJobsInDatabase({
      data: { processing: false },
      req,
      returning: false,
      where: { id: { in: claimedIDs } },
    })
    throw error
  } finally {
    pendingClaimHooksByReq.delete(claimReq)
  }

  const erroredIDs = new Set((result?.errors ?? []).map((err: { id: number | string }) => err.id))
  const updatedDocs = ((result?.docs as Job[] | undefined) ?? []).filter(
    (doc) => !erroredIDs.has(doc.id) && doc.processing !== false,
  )
  const succeededIDs = new Set(updatedDocs.map((doc) => doc.id))
  const failedIDs = claimedIDs.filter((claimedID) => !succeededIDs.has(claimedID))

  if (failedIDs.length > 0) {
    await updateJobsInDatabase({
      data: { processing: false },
      req,
      returning: false,
      where: { id: { in: failedIDs } },
    })
  }

  if (returning === false || !updatedDocs.length) {
    return null
  }

  // Preserve the processing order the jobs were claimed in
  const claimedOrder = new Map(claimedIDs.map((claimedID, index) => [claimedID, index]))

  return updatedDocs.sort(
    (a, b) => (claimedOrder.get(a.id) ?? 0) - (claimedOrder.get(b.id) ?? 0),
  )
}

async function updateJobsInDatabase({
  id,
  data,
  limit,
  req,
  returning,
  sort,
  where,
}: {
  id?: number | string
  sort?: Sort
  where?: Where
} & Omit<BaseArgs, 'depth' | 'disableTransaction'>): Promise<Job[] | null> {
  const jobReq = {
    transactionID:
      req.payload.db.name !== 'mongoose'
        ? ((await req.payload.db.beginTransaction()) as string)
        : undefined,
  }

  if (typeof data.updatedAt === 'undefined') {
    // Ensure updatedAt date is always updated
    data.updatedAt = getCurrentDate().toISOString()
  }

  const args: UpdateJobsArgs = id
    ? {
        id,
        data,
        req: jobReq,
        returning,
      }
    : {
        data,
        limit,
        req: jobReq,
        returning,
        sort,
        where: where as Where,
      }

  const updatedJobs: Job[] | null = await req.payload.db.updateJobs(args)

  if (req.payload.db.name !== 'mongoose' && jobReq.transactionID) {
    await req.payload.db.commitTransaction(jobReq.transactionID)
  }

  if (returning === false || !updatedJobs?.length) {
    return null
  }

  return updatedJobs.map((updatedJob) => {
    return jobAfterRead({
      config: req.payload.config,
      doc: updatedJob,
    })
  })
}
