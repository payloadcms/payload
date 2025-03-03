import type { PayloadRequest, Where } from '../../types/index.js'
import type { BaseJob } from '../config/types/workflowTypes.js'

import { jobAfterRead } from '../config/jobsCollection.js'
import { sanitizeUpdateData } from './sanitizeUpdateData.js'

type RunJobArgs = {
  data: Partial<BaseJob>
  depth?: number
  disableTransaction?: boolean
  id: number | string
  /**
   * If you only pass partial job data, this will need to be true.
   * Setting it to true will perform an additional fetch before the update, to merge the data,
   * if mongodb is not used.
   */
  partial: boolean
  req: PayloadRequest
  returning?: boolean
}
export async function updateJob({
  id,
  data,
  depth,
  disableTransaction,
  partial,
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

  let updateData = sanitizeUpdateData({ data })

  if (partial && !req.payload.db.meta?.supportsPartialData) {
    // update updateData
    const currentJob = await req.payload.db.findOne({
      collection: 'payload-jobs',
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
  }

  const updatedJob = (await req.payload.db.updateOne({
    id,
    collection: 'payload-jobs',
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
  /**
   * If you only pass partial job data, this will need to be true.
   * Setting it to true will perform an additional fetch before the update, to merge the data,
   * if mongodb is not used.
   */
  partial: boolean
  req: PayloadRequest
  returning?: boolean
  where: Where
}
export async function updateJobs({
  data,
  depth,
  disableTransaction,
  limit,
  partial,
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
    if (returning === false || !result) {
      return null
    }
    return result.docs as BaseJob[]
  }

  let updatedJobs = []

  if (partial && !req.payload.db.meta?.supportsPartialData) {
    const jobsToUpdate = await req.payload.db.find({
      collection: 'payload-jobs',
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
        collection: 'payload-jobs',
        data: sanitizeUpdateData({ data: updateData }),
        req: disableTransaction === true ? undefined : req,
        returning,
      })
      updatedJobs.push(updatedJob)
    }
  } else {
    updatedJobs = (await req.payload.db.updateMany({
      collection: 'payload-jobs',
      data: sanitizeUpdateData({ data }),
      limit,
      req: disableTransaction === true ? undefined : req,
      returning,
      where,
    })) as BaseJob[]
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
