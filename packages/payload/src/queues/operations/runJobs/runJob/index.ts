// @ts-strict-ignore
import type { PayloadRequest } from '../../../../types/index.js'
import type {
  BaseJob,
  RunningJob,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowTypes,
} from '../../../config/types/workflowTypes.js'
import type { RunTaskFunctionState } from './getRunTaskFunction.js'
import type { UpdateJobFunction } from './getUpdateJobFunction.js'

import { getRunTaskFunction } from './getRunTaskFunction.js'
import { handleWorkflowError } from './handleWorkflowError.js'

type Args = {
  job: BaseJob
  req: PayloadRequest
  updateJob: UpdateJobFunction
  workflowConfig: WorkflowConfig<WorkflowTypes>
  workflowHandler: WorkflowHandler<WorkflowTypes>
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
      job: job as unknown as RunningJob<WorkflowTypes>, //TODO: Type this better
      req,
      tasks: getRunTaskFunction(state, job, workflowConfig, req, false, updateJob),
    })
  } catch (err) {
    const { hasFinalError } = handleWorkflowError({
      error: err,
      job,
      req,
      state,
      workflowConfig,
    })

    const errorJSON = hasFinalError
      ? {
          name: err.name,
          cancelled: Boolean('cancelled' in err && err.cancelled),
          message: err.message,
          stack: err.stack,
        }
      : undefined
    // Tasks update the job if they error - but in case there is an unhandled error (e.g. in the workflow itself, not in a task)
    // we need to ensure the job is updated to reflect the error
    await updateJob({
      error: errorJSON,
      hasError: hasFinalError, // If reached max retries => final error. If hasError is true this job will not be retried
      log: job.log,
      processing: false,
      totalTried: (job.totalTried ?? 0) + 1,
    })

    return {
      status: hasFinalError ? 'error-reached-max-retries' : 'error',
    }
  }

  // Workflow has completed
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
