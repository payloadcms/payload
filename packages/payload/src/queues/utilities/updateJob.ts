import type { ManyOptions } from '../../collections/operations/local/update.js'
import type { UpdateJobsArgs } from '../../database/types.js'
import type { Job } from '../../index.js'
import type { PayloadRequest, Sort, Where } from '../../types/index.js'

import { jobAfterRead, jobsCollectionSlug } from '../config/collection.js'

type BaseArgs = {
  data: Partial<Job>
  debugID?: string
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
  debugID,
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
  const prefix = debugID ? `[${debugID}] updateJobs` : null

  if (prefix) {
    console.log(`${prefix} - enter`, { id, depth, disableTransaction, limit, returning, sort })
  }

  if (depth || req.payload.config?.jobs?.runHooks) {
    if (prefix) {
      console.log(`${prefix} - using payload.update (depth or runHooks)`)
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
    if (prefix) {
      console.log(`${prefix} - payload.update done`, { docCount: result?.docs?.length ?? 0 })
    }
    if (returning === false || !result) {
      return null
    }
    return result.docs as Job[]
  }

  if (prefix) {
    console.log(`${prefix} - using direct db path`)
  }

  const txStart = Date.now()
  const jobReq = {
    transactionID:
      req.payload.db.name !== 'mongoose'
        ? ((await req.payload.db.beginTransaction()) as string)
        : undefined,
  }
  if (prefix) {
    console.log(
      `${prefix} - beginTransaction took ${Date.now() - txStart}ms, txID: ${jobReq.transactionID}`,
    )
  }

  if (typeof data.updatedAt === 'undefined') {
    data.updatedAt = new Date().toISOString()
  }

  const args: UpdateJobsArgs = id
    ? {
        id,
        data,
        debugID,
        req: jobReq,
        returning,
      }
    : {
        data,
        debugID,
        limit,
        req: jobReq,
        returning,
        sort,
        where: where as Where,
      }

  const dbStart = Date.now()
  if (prefix) {
    console.log(`${prefix} - calling db.updateJobs`)
  }
  const updatedJobs: Job[] | null = await req.payload.db.updateJobs(args)
  if (prefix) {
    console.log(
      `${prefix} - db.updateJobs took ${Date.now() - dbStart}ms, returned ${updatedJobs?.length ?? 0} jobs`,
    )
  }

  if (req.payload.db.name !== 'mongoose' && jobReq.transactionID) {
    const commitStart = Date.now()
    await req.payload.db.commitTransaction(jobReq.transactionID)
    if (prefix) {
      console.log(`${prefix} - commitTransaction took ${Date.now() - commitStart}ms`)
    }
  }

  if (prefix) {
    console.log(`${prefix} - total elapsed ${Date.now() - txStart}ms`)
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
