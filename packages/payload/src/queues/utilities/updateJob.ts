import type { PayloadRequest, Where } from '../../types/index.js'
import type { BaseJob } from '../config/types/workflowTypes.js'

import { jobAfterRead, jobsCollectionSlug } from '../config/index.js'
import { sanitizeUpdateData } from './sanitizeUpdateData.js'

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
      collection: jobsCollectionSlug,
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

  let updateData = sanitizeUpdateData({ data })

  // update updateData to support partial updates
  // TODO: this can be optimized in the future - partial updates are supported in mongodb. In postgres,
  // we can support this by manually constructing the sql query
  const currentJob = await req.payload.db.findOne({
    collection: jobsCollectionSlug,
    req: disableTransaction === true ? undefined : req,
    where: {
      id: {
        equals: id,
      },
    },
  })

  if (currentJob) {
    updateData = {
      ...currentJob,
      ...updateData,
    }
  }

  const updatedJob = (await req.payload.db.updateOne({
    id,
    collection: jobsCollectionSlug,
    data: updateData,
    req: disableTransaction === true ? undefined : req,
    returning: true,
  })) as BaseJob

  if (returning === false) {
    return null
  }

  const res = jobAfterRead({
    config: req.payload.config,
    doc: updatedJob,
  })

  return res
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
      collection: jobsCollectionSlug,
      data,
      depth,
      disableTransaction,
      limit,
      req,
      where,
    })
    if (returning === false || !result) {
      return null
    }
    return result.docs as BaseJob[]
  }

  let updatedJobs = []

  // TODO: this can be optimized in the future - partial updates are supported in mongodb. In postgres,
  // we can support this by manually constructing the sql query. We should use req.payload.db.updateMany instead
  // of req.payload.db.updateOne once this is supported
  const jobsToUpdate = await req.payload.db.find({
    collection: jobsCollectionSlug,
    limit,
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

  const res = updatedJobs.map((updatedJob) => {
    return jobAfterRead({
      config: req.payload.config,
      doc: updatedJob,
    })
  })

  return res
}
