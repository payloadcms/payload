import type { PayloadRequest, Where } from '../../types/index.js'
import type { BaseJob } from '../config/types/workflowTypes.js'

import { jobAfterRead } from '../config/jobsCollection.js'

type RunJobArgs = {
  data: Partial<BaseJob>
  depth?: number
  disableTransaction?: boolean
  id: number | string
  req: PayloadRequest
  returning?: boolean
}
export async function updateJob({
  id,
  data,
  depth,
  disableTransaction,
  req,
  returning,
}: RunJobArgs): Promise<BaseJob | null> {
  if (depth || req.payload.config.jobs.runHooks) {
    const result = await req.payload.update({
      id,
      collection: 'payload-jobs',
      data,
      depth,
      disableTransaction,
      req,
    })
    if (returning === false) {
      return null
    }
    return result as BaseJob
  }

  const updatedJob = (await req.payload.db.updateOne({
    id,
    collection: 'payload-jobs',
    data,
    req: disableTransaction === true ? undefined : req,
    returning,
  })) as BaseJob

  if (returning === false) {
    return null
  }

  return jobAfterRead({
    doc: updatedJob,
    req,
  })
}

type RunJobsArgs = {
  data: Partial<BaseJob>
  depth?: number
  disableTransaction?: boolean
  limit?: number
  req: PayloadRequest
  returning?: boolean
  where: Where
}
export async function updateJobs({
  data,
  depth,
  disableTransaction,
  limit,
  req,
  returning,
  where,
}: RunJobsArgs): Promise<BaseJob[] | null> {
  if (depth || req.payload.config?.jobs?.runHooks) {
    const result = await req.payload.update({
      collection: 'payload-jobs',
      data,
      depth,
      disableTransaction,
      limit,
      req,
      where,
    })
    if (returning === false) {
      return null
    }
    return result.docs as BaseJob[]
  }

  const updatedJobs = (await req.payload.db.updateMany({
    collection: 'payload-jobs',
    data,
    limit,
    req: disableTransaction === true ? undefined : req,
    returning,
    where,
  })) as BaseJob[]

  if (returning === false) {
    return null
  }

  return updatedJobs.map((updatedJob) => {
    return jobAfterRead({
      doc: updatedJob,
      req,
    })
  })
}
