import type { Job } from '../../../../index.js'
import type { PayloadRequest } from '../../../../types/index.js'
import type { WorkflowConfig, WorkflowHandler } from '../../../config/types/workflowTypes.js'
import type { RunJobsSilent } from '../../../localAPI.js'
import type { UpdateJobFunction } from './getUpdateJobFunction.js'

import { handleTaskError } from '../../../errors/handleTaskError.js'
import { handleWorkflowError } from '../../../errors/handleWorkflowError.js'
import { JobCancelledError, TaskError, WorkflowError } from '../../../errors/index.js'
import { getCurrentDate } from '../../../utilities/getCurrentDate.js'
import { getRunTaskFunction } from './getRunTaskFunction.js'

type Args = {
  job: Job
  req: PayloadRequest
  /**
   * If set to true, the job system will not log any output to the console (for both info and error logs).
   * Can be an option for more granular control over logging.
   *
   * This will not automatically affect user-configured logs (e.g. if you call `console.log` or `payload.logger.info` in your job code).
   *
   * @default false
   */
  silent?: RunJobsSilent
  updateJob: UpdateJobFunction
  workflowConfig: WorkflowConfig
  workflowHandler: WorkflowHandler
}

export type JobRunStatus = 'error' | 'error-reached-max-retries' | 'success'

export type RunJobResult = {
  status: JobRunStatus
}

export const runJob = async ({
  job,
  req,
  silent,
  updateJob,
  workflowConfig,
  workflowHandler,
}: Args): Promise<RunJobResult> => {
  // Run the job
  try {
    await workflowHandler({
      inlineTask: getRunTaskFunction(job, workflowConfig, req, true, updateJob),
      job,
      req,
      tasks: getRunTaskFunction(job, workflowConfig, req, false, updateJob),
    })
  } catch (error) {
    if (error instanceof JobCancelledError) {
      throw error // Job cancellation is handled in a top-level error handler, as higher up code may themselves throw this error
    }
    if (error instanceof TaskError) {
      const { hasFinalError } = await handleTaskError({
        error,
        req,
        silent,
        updateJob,
      })

      return {
        status: hasFinalError ? 'error-reached-max-retries' : 'error',
      }
    }

    const { hasFinalError } = await handleWorkflowError({
      error:
        error instanceof WorkflowError
          ? error
          : new WorkflowError({
              job,
              message:
                typeof error === 'object' && error && 'message' in error
                  ? (error.message as string)
                  : 'An unhandled error occurred',
              workflowConfig,
            }),
      req,
      silent,
      updateJob,
    })

    return {
      status: hasFinalError ? 'error-reached-max-retries' : 'error',
    }
  }

  // Workflow has completed successfully
  // Do not update the job log here, as that would result in unnecessary db calls when using postgres.
  // Solely updating simple fields here will result in optimized db calls.
  // Job log modifications are already updated at the end of the runTask function.
  await updateJob({
    completedAt: getCurrentDate().toISOString(),
    processing: false,
    totalTried: (job.totalTried ?? 0) + 1,
  })

  return {
    status: 'success',
  }
}
