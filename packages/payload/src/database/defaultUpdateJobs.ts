import type { BaseJob, DatabaseAdapter } from '../index.js'
import type { UpdateJobs } from './types.js'

import { jobsCollectionSlug } from '../queues/config/index.js'
import { sanitizeUpdateData } from '../queues/utilities/sanitizeUpdateData.js'

export const defaultUpdateJobs: UpdateJobs = async function updateMany(
  this: DatabaseAdapter,
  { id, data, limit, req, returning, where },
) {
  const updatedJobs: BaseJob[] | null = []

  const jobsToUpdate = id
    ? [
        await this.findOne({
          collection: jobsCollectionSlug,
          req,
          where,
        }),
      ]
    : (
        await this.find({
          collection: jobsCollectionSlug,
          limit,
          pagination: false,
          req,
          where,
        })
      )?.docs

  if (!jobsToUpdate) {
    return null
  }

  for (const job of jobsToUpdate) {
    if (!job) {
      continue
    }

    const updateData = {
      ...job,
      ...data,
    }
    const updatedJob = await this.updateOne({
      id: job.id,
      collection: jobsCollectionSlug,
      data: sanitizeUpdateData({ data: updateData }),
      req,
      returning,
    })
    updatedJobs.push(updatedJob)
  }

  return updatedJobs
}
