import type { Job } from '../../../../index.js'
import type { PayloadRequest } from '../../../../types/index.js'

import { JobCancelledError } from '../../../errors/index.js'
import { updateJob } from '../../../utilities/updateJob.js'

export type UpdateJobFunction = (jobData: Partial<Job>) => Promise<Job>

/**
 * Helper for updating a job that does the following, additionally to updating the job:
 * - Merges incoming data from the updated job into the original job object
 * - Handles job cancellation by throwing a `JobCancelledError` if the job was cancelled.
 */
export function getUpdateJobFunction(job: Job, req: PayloadRequest): UpdateJobFunction {
  return async (jobData) => {
    const updatedJob = await updateJob({
      id: job.id,
      data: jobData,
      depth: req.payload.config.jobs.depth,
      disableTransaction: true,
      req,
    })

    if (!updatedJob) {
      return job
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

    if ((updatedJob?.error as Record<string, unknown>)?.cancelled) {
      throw new JobCancelledError(`Job ${job.id} was cancelled`)
    }

    return updatedJob
  }
}
