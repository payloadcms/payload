import type { PayloadRequest } from '../../../types/index.js'
import type {
  BaseJob,
  JobTasksStatus,
  RunningJob,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowTypes,
} from '../../config/types/workflowTypes.js'

import { getRunTaskFunction } from './getRunTaskFunction.js'
import { getUpdateJobFunction } from './getUpdateJobFunction.js'
import { importHandlerPath } from './importHandlerPath.js'

type Args = {
  job: BaseJob
  jobTasksStatus: JobTasksStatus
  req: PayloadRequest
  workflowConfig: WorkflowConfig<WorkflowTypes>
}

export type JobRunStatus = 'error' | 'error-reached-max-retries' | 'success'

export type RunJobResult = {
  status: JobRunStatus
}

export const runJob = async ({
  job,
  jobTasksStatus,
  req,
  workflowConfig,
}: Args): Promise<RunJobResult> => {
  if (!workflowConfig.handler) {
    throw new Error('Currently, only JS-based workflows are supported')
  }

  const updateJob = getUpdateJobFunction(job, req)

  // the runner will either be passed to the config
  // OR it will be a path, which we will need to import via eval to avoid
  // Next.js compiler dynamic import expression errors

  let workflowHandler: WorkflowHandler<WorkflowTypes>

  if (typeof workflowConfig.handler === 'function') {
    workflowHandler = workflowConfig.handler
  } else {
    workflowHandler = await importHandlerPath<WorkflowHandler<WorkflowTypes>>(
      workflowConfig.handler,
    )

    if (!workflowHandler) {
      const errorMessage = `Can't find runner while importing with the path ${workflowConfig.handler} in job type ${job.workflowSlug}.`
      req.payload.logger.error(errorMessage)

      await updateJob({
        error: {
          error: errorMessage,
        },
        hasError: true,
        processing: false,
      })

      return
    }
  }

  await updateJob({
    processing: true,
    seenByWorker: true,
  })

  const state = {
    jobTasksStatus,
    reachedMaxRetries: false,
  }

  // Run the job
  try {
    await workflowHandler({
      job: job as unknown as RunningJob<WorkflowTypes>, //TODO: Type this better
      req,
      runTask: getRunTaskFunction(state, job, workflowConfig, req, false, updateJob),
      runTaskInline: getRunTaskFunction(state, job, workflowConfig, req, true, updateJob),
    })
  } catch (err) {
    await updateJob({
      ...job, // ensure locally modified job data is saved
      hasError: state.reachedMaxRetries, // If reached max retries => final error. If hasError is true this job will not be retried
      processing: false,
    })

    req.payload.logger.error({ err, job, msg: 'Error running workflow' })
    return {
      status: state.reachedMaxRetries ? 'error-reached-max-retries' : 'error',
    }
  }

  // Workflow has completed
  await updateJob({
    ...job, // ensure locally modified job data is saved
    completedAt: new Date().toISOString(),
    processing: false,
  })

  return {
    status: 'success',
  }
}
