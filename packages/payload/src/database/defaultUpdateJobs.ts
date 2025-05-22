import type { BaseJob, DatabaseAdapter } from '../index.js'
import type { UpdateJobs } from './types.js'

import { jobsCollectionSlug } from '../queues/config/index.js'

export const defaultUpdateJobs: UpdateJobs = async function updateMany(
  this: DatabaseAdapter,
  { id, data, limit, req, returning, where },
) {
  const updatedJobs: BaseJob[] | null = []

  const jobsToUpdate: BaseJob[] = (
    id
      ? [
          await this.findOne({
            collection: jobsCollectionSlug,
            req,
            where: { id: { equals: id } },
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
        ).docs
  ).filter(Boolean) as BaseJob[]

  if (!jobsToUpdate) {
    return null
  }

  for (const job of jobsToUpdate) {
    const updateData = {
      ...job,
      ...data,
    }
    const updatedJob = await this.updateOne({
      id: job.id,
      collection: jobsCollectionSlug,
      data: updateData,
      req,
      returning,
    })
    updatedJobs.push(updatedJob)
  }

  return updatedJobs
}
