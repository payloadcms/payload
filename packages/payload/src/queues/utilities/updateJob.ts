import type { ManyOptions } from '../../collections/operations/local/update.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { BaseJob } from '../config/types/workflowTypes.js'

import { jobAfterRead, jobsCollectionSlug } from '../config/index.js'
import { sanitizeUpdateData } from './sanitizeUpdateData.js'

type BaseArgs = {
  data: Partial<BaseJob>
  depth?: number
  disableTransaction?: boolean
  limit?: number
  req: PayloadRequest
  returning?: boolean
}

type ArgsByID = {
  id: number | string
  limit?: never
  where?: never
}

/**
 * Convenience method for updateJobs by id
 */
export async function updateJob(args: ArgsByID & BaseArgs) {
  const result = await updateJobs({
    ...args,
    id: undefined,
    limit: 1,
    where: { id: { equals: args.id } },
  })
  if (result) {
    return result[0]
  }
}

type ArgsWhere = {
  id?: never | undefined
  limit?: number
  where: Where
}

type RunJobsArgs = (ArgsByID | ArgsWhere) & BaseArgs

export async function updateJobs({
  id,
  data,
  depth,
  disableTransaction,
  limit: limitArg,
  req,
  returning,
  where,
}: RunJobsArgs): Promise<BaseJob[] | null> {
  const limit = id ? 1 : limitArg
  if (depth || req.payload.config?.jobs?.runHooks) {
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
    return result.docs as BaseJob[]
  }

  const updatedJobs = []

  // TODO: this can be optimized in the future - partial updates are supported in mongodb. In postgres,
  // we can support this by manually constructing the sql query. We should use req.payload.db.updateMany instead
  // of req.payload.db.updateOne once this is supported
  const jobsToUpdate = await req.payload.db.find({
    collection: jobsCollectionSlug,
    limit,
    pagination: false,
    req: disableTransaction === true ? undefined : req,
    where,
  })
  if (!jobsToUpdate?.docs) {
    return null
  }

  for (const job of jobsToUpdate.docs) {
    const updateData = {
      ...job,
      ...data,
    }
    const updatedJob = await req.payload.db.updateOne({
      id: job.id,
      collection: jobsCollectionSlug,
      data: sanitizeUpdateData({ data: updateData }),
      req: disableTransaction === true ? undefined : req,
      returning,
    })
    updatedJobs.push(updatedJob)
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
