import type { ManyOptions } from '../../collections/operations/local/update.js'
import type { UpdateJobsArgs } from '../../database/types.js'
import type { Job } from '../../index.js'
import type { PayloadRequest, Sort, Where } from '../../types/index.js'

import { jobAfterRead, jobsCollectionSlug } from '../config/collection.js'

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
  if (depth || req.payload.config?.jobs?.runHooks) {
    if (id) {
      const result = await req.payload.update({
        id,
        collection: jobsCollectionSlug,
        data,
        depth,
        disableTransaction,
        req,
      })
      if (returning === false || !result) {
        return null
      }
      return [result as unknown as Job]
    }
    const result = await req.payload.update({
      collection: jobsCollectionSlug,
      data,
      depth,
      disableTransaction,
      limit: limitArg,
      req,
      where: whereArg,
    } as ManyOptions<any, any>)
    if (returning === false || !result) {
      return null
    }
    return result.docs as Job[]
  }

  const jobReq = {
    transactionID:
      req.payload.db.name !== 'mongoose'
        ? ((await req.payload.db.beginTransaction()) as string)
        : undefined,
  }

  if (typeof data.updatedAt === 'undefined') {
    // Ensure updatedAt date is always updated
    data.updatedAt = new Date().toISOString()
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
        limit: limitArg,
        req: jobReq,
        returning,
        sort,
        where: whereArg as Where,
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
