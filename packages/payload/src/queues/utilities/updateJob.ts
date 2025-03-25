import type { ManyOptions } from '../../collections/operations/local/update.js'
import type { UpdateJobsArgs } from '../../database/types.js'
import type { PayloadRequest, Sort, Where } from '../../types/index.js'
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
}: RunJobsArgs): Promise<BaseJob[] | null> {
  const limit = id ? 1 : limitArg
  const where = id ? { id: { equals: id } } : whereArg

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

  let updatedJobs: BaseJob[] | null = []

  if (req.payload.db.updateJobs) {
    const args: UpdateJobsArgs = id
      ? {
          id,
          data: sanitizeUpdateData({ data }),
          req: disableTransaction === true ? undefined : req,
          returning,
        }
      : {
          data: sanitizeUpdateData({ data }),
          limit,
          req: disableTransaction === true ? undefined : req,
          returning,
          sort,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          where: where as Where,
        }

    updatedJobs = await req.payload.db.updateJobs(args)
  } else {
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
