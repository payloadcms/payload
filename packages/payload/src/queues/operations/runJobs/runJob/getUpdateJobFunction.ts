import type { Job } from '../../../../index.js'
import type { PayloadRequest } from '../../../../types/index.js'

import { JobCancelledError, JobRunAbortedError } from '../../../errors/index.js'
import { getCurrentDate } from '../../../utilities/getCurrentDate.js'
import { updateJobs } from '../../../utilities/updateJob.js'

export type UpdateJobFunction = (jobData: Partial<Job>) => Promise<Job>

/**
 * Helper for updating a job that does the following, additionally to updating the job:
 * - Merges incoming data from the updated job into the original job object
 * - Throws a `JobCancelledError` if another process cancelled the job.
 * - Stops updates after this worker loses the job's lease.
 */
export function getUpdateJobFunction(job: Job, req: PayloadRequest): UpdateJobFunction {
  return async (jobData) => {
    const processingToken = job.processingToken

    if (!processingToken) {
      throw new JobRunAbortedError(`Job ${job.id} can no longer be updated by this runner`)
    }

    const minimumProcessingUntil = new Date(
      getCurrentDate().getTime() + req.payload.config.jobs.processingLease.safetyBuffer,
    ).toISOString()
    const updatedJobs = await updateJobs({
      data: jobData,
      limit: 1,
      req,
      returning: true,
      where: {
        and: [
          { id: { equals: job.id } },
          { processingToken: { equals: processingToken } },
          { processingUntil: { greater_than: minimumProcessingUntil } },
        ],
      },
    })
    const updatedJob = updatedJobs?.[0]

    if (!updatedJob) {
      throw new JobRunAbortedError(`Job ${job.id} can no longer be updated by this runner`)
    }

    // Update job object like this to modify the original object - that way, incoming changes (e.g. taskStatus field that will be re-generated through the hook) will be reflected in the calling function
    for (const key in updatedJob) {
      if (key === 'log') {
        // Add all new log entries to the original job.log object. Do not delete any existing log entries.
        // Do not update existing log entries, as existing log entries should be immutable.
        for (const logEntry of updatedJob?.log ?? []) {
          if (!job.log || !job.log.some((entry) => entry.id === logEntry.id)) {
            ;(job.log ??= []).push(logEntry)
          }
        }
      } else {
        ;(job as any)[key] = updatedJob[key as keyof Job]
      }
    }

    if (
      (updatedJob.error as Record<string, unknown>)?.cancelled &&
      !(jobData.error as Record<string, unknown> | undefined)?.cancelled
    ) {
      throw new JobCancelledError(`Job ${job.id} was cancelled`)
    }

    return updatedJob
  }
}
