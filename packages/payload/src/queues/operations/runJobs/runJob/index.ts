import type { Job } from '../../../../index.js'
import type { PayloadRequest } from '../../../../types/index.js'
import type { WorkflowConfig, WorkflowHandler } from '../../../config/types/workflowTypes.js'
import type { RunTaskFunctionState } from './getRunTaskFunction.js'
import type { UpdateJobFunction } from './getUpdateJobFunction.js'

import { handleTaskError } from '../../../errors/handleTaskError.js'
import { handleWorkflowError } from '../../../errors/handleWorkflowError.js'
import { TaskError, WorkflowError } from '../../../errors/index.js'
import { getRunTaskFunction } from './getRunTaskFunction.js'

type Args = {
  job: Job
  req: PayloadRequest
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
  updateJob,
  workflowConfig,
  workflowHandler,
}: Args): Promise<RunJobResult> => {
  // Object so that we can pass contents by reference, not value.
  // We want any mutations to be reflected in here.
  const state: RunTaskFunctionState = {
    reachedMaxRetries: false,
  }

  // Run the job
  try {
    await workflowHandler({
      inlineTask: getRunTaskFunction(state, job, workflowConfig, req, true, updateJob),
      job,
      req,
      tasks: getRunTaskFunction(state, job, workflowConfig, req, false, updateJob),
    })
  } catch (error) {
    if (error instanceof TaskError) {
      const { hasFinalError } = await handleTaskError({
        error,
        req,
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
              state,
              workflowConfig,
            }),
      req,
      updateJob,
    })

    return {
      status: hasFinalError ? 'error-reached-max-retries' : 'error',
    }
  }

  // Workflow has completed successfully
  await updateJob({
    completedAt: new Date().toISOString(),
    log: job.log,
    processing: false,
    totalTried: (job.totalTried ?? 0) + 1,
  })

  return {
    status: 'success',
  }
}
