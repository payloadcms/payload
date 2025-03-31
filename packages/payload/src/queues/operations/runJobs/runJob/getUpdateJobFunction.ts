// @ts-strict-ignore
import type { PayloadRequest } from '../../../../types/index.js'
import type { BaseJob } from '../../../config/types/workflowTypes.js'

import { updateJob } from '../../../utilities/updateJob.js'

export type UpdateJobFunction = (jobData: Partial<BaseJob>) => Promise<BaseJob>

export function getUpdateJobFunction(job: BaseJob, req: PayloadRequest): UpdateJobFunction {
  return async (jobData) => {
    const updatedJob = await updateJob({
      id: job.id,
      data: jobData,
      depth: req.payload.config.jobs.depth,
      disableTransaction: true,
      req,
    })

    // Update job object like this to modify the original object - that way, incoming changes (e.g. taskStatus field that will be re-generated through the hook) will be reflected in the calling function
    for (const key in updatedJob) {
      job[key] = updatedJob[key]
    }

    if ((updatedJob.error as Record<string, unknown>)?.cancelled) {
      const cancelledError = new Error('Job cancelled') as { cancelled: boolean } & Error
      cancelledError.cancelled = true
      throw cancelledError
    }

    return updatedJob
  }
}
