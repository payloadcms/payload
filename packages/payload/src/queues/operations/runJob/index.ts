import type { PayloadRequest } from '../../../types/index.js'
import type {
  BaseJob,
  JobTasksStatus,
  RunningJob,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowTypes,
} from '../../config/types/workflowTypes.js'
import type { RunTaskFunctionState } from './getRunTaskFunction.js'

import { calculateBackoffWaitUntil } from './calculateBackoffWaitUntil.js'
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

  const state: RunTaskFunctionState = {
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
    let hasError = state.reachedMaxRetries // If any TASK reached max retries, the job has an error
    // Now let's handle workflow retries
    if (!hasError && workflowConfig.retries) {
      const maxRetries =
        typeof workflowConfig.retries === 'object'
          ? workflowConfig.retries.attempts
          : workflowConfig.retries
      if (job.waitUntil) {
        // Check if waitUntil is in the past
        const waitUntil = new Date(job.waitUntil)
        if (waitUntil < new Date()) {
          // Outdated waitUntil, remove it
          delete job.waitUntil
        }
      }
      if (job.totalTried >= maxRetries) {
        state.reachedMaxRetries = true
        hasError = true

        req.payload.logger.error({
          msg: 'Job has reached the maximum amount of retries determined by the workflow configuration.',
        })
      } else {
        // Job will retry. Let's determine when!
        const waitUntil: Date = calculateBackoffWaitUntil({
          retriesConfig: workflowConfig.retries,
          totalTried: job.totalTried ?? 0,
        })

        // Update job's waitUntil only if this waitUntil is later than the current one
        if (!job.waitUntil || waitUntil > new Date(job.waitUntil)) {
          job.waitUntil = waitUntil.toISOString()
        }
      }
    }

    // Tasks update the job if they error - but in case there is an unhandled error (e.g. in the workflow itself, not in a task)
    // we need to ensure the job is updated to reflect the error
    await updateJob({
      ...job, // ensure locally modified job data is saved
      error: state.reachedMaxRetries ? err : undefined,
      hasError: state.reachedMaxRetries, // If reached max retries => final error. If hasError is true this job will not be retried
      processing: false,
      totalTried: (job.totalTried ?? 0) + 1,
    })

    req.payload.logger.error({ err, job, msg: 'Error running job' })
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
