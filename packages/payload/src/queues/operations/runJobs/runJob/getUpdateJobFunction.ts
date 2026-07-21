import type { Job } from '../../../../index.js'
import type { PayloadRequest } from '../../../../types/index.js'

import { jobsCollectionSlug } from '../../../config/collection.js'
import { JobCancelledError, JobLeaseLostError } from '../../../errors/index.js'
import { getCurrentDate } from '../../../utilities/getCurrentDate.js'
import { updateJobs } from '../../../utilities/updateJob.js'

export type UpdateJobFunction = (jobData: Partial<Job>) => Promise<Job>

/**
 * Helper for updating a job that does the following, additionally to updating the job:
 * - Merges incoming data from the updated job into the original job object
 * - Handles job cancellation by throwing a `JobCancelledError` if the job was cancelled.
 */
export function getUpdateJobFunction(job: Job, req: PayloadRequest): UpdateJobFunction {
  return async (jobData) => {
    const processingToken = job.processingToken

    if (!processingToken) {
      throw new JobLeaseLostError(`Job ${job.id} has no processing token`)
    }

    const now = getCurrentDate()
    const isCancelling = Boolean((jobData.error as Record<string, unknown> | undefined)?.cancelled)
    const isSettling = jobData.processingUntil === null
    const data = {
      ...jobData,
      processingToken: isSettling ? null : processingToken,
    }
    const updatedJobs = await updateJobs({
      data,
      limit: 1,
      req,
      returning: true,
      where: {
        and: [
          { id: { equals: job.id } },
          { processingToken: { equals: processingToken } },
          { processingUntil: { greater_than: now.toISOString() } },
        ],
      },
    })
    const updatedJob = updatedJobs?.[0]

    if (!updatedJob) {
      const currentJob = await req.payload.db.findOne<Job>({
        collection: jobsCollectionSlug,
        req,
        where: { id: { equals: job.id } },
      })

      if (currentJob) {
        mergeJob({ job, updatedJob: currentJob })
      }

      if ((currentJob?.error as Record<string, unknown> | undefined)?.cancelled) {
        if (isCancelling && currentJob) {
          return currentJob
        }
        throw new JobCancelledError(`Job ${job.id} was cancelled`)
      }

      throw new JobLeaseLostError(`Job ${job.id} is no longer owned by this runner`)
    }

    mergeJob({ job, updatedJob })

    if (!isCancelling && (updatedJob?.error as Record<string, unknown>)?.cancelled) {
      throw new JobCancelledError(`Job ${job.id} was cancelled`)
    }

    return updatedJob
  }
}

function mergeJob({ job, updatedJob }: { job: Job; updatedJob: Job }): void {
  // Modify the original object so incoming changes, including the generated taskStatus, are reflected in the calling function.
  for (const key in updatedJob) {
    if (key === 'log') {
      // Logs are immutable. Add new entries without replacing entries already held in memory.
      for (const logEntry of updatedJob.log ?? []) {
        if (!job.log || !job.log.some((entry) => entry.id === logEntry.id)) {
          ;(job.log ??= []).push(logEntry)
        }
      }
    } else {
      ;(job as any)[key] = updatedJob[key as keyof Job]
    }
  }
}
