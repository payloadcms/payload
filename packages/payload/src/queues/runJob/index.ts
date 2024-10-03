import { pathToFileURL } from 'url'

import type { PayloadRequest } from '../../types/index.js'
import type {
  BaseJob,
  JobTasksStatus,
  RunningJob,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowTypes,
} from '../config/workflowTypes.js'

import { getRunTaskFunction } from './getRunTaskFunction.js'

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

  // the runner will either be passed to the config
  // OR it will be a path, which we will need to import via eval to avoid
  // Next.js compiler dynamic import expression errors

  let workflowHandler: WorkflowHandler<WorkflowTypes>

  if (typeof workflowConfig.handler === 'function') {
    workflowHandler = workflowConfig.handler
  } else {
    const [runnerPath, runnerImportName] = workflowConfig.handler.split('#')

    const runnerModule =
      typeof require === 'function'
        ? await eval(`require('${runnerPath.replaceAll('\\', '/')}')`)
        : await eval(`import('${pathToFileURL(runnerPath).href}')`)

    // If the path has indicated an #exportName, try to get it
    if (runnerImportName && runnerModule[runnerImportName]) {
      workflowHandler = runnerModule[runnerImportName]
    }

    // If there is a default export, use it
    if (!workflowHandler && runnerModule.default) {
      workflowHandler = runnerModule.default
    }

    // Finally, use whatever was imported
    if (!workflowHandler) {
      workflowHandler = runnerModule
    }

    if (!workflowHandler) {
      const errorMessage = `Can't find runner while importing with the path ${workflowConfig.handler} in job type ${job.workflowSlug}.`
      req.payload.logger.error(errorMessage)

      const updatedJob = (await req.payload.update({
        id: job.id,
        collection: 'payload-jobs',
        data: {
          error: {
            error: errorMessage,
          },
          hasError: true,
          log: [
            ...job.log,
            {
              error: errorMessage,
              executedAt: new Date().toISOString(),
              state: 'failed',
            },
          ],
          processing: false,
        },
        req,
      })) as BaseJob
      // Update job object like this to modify the original object - that way, the changes will be reflected in the calling function
      for (const key in updatedJob) {
        job[key] = updatedJob[key]
      }

      return
    }
  }

  const updatedJob = (await req.payload.update({
    id: job.id,
    collection: 'payload-jobs',
    data: {
      processing: true,
      seenByWorker: true,
    },
    req,
  })) as BaseJob
  // Update job object like this to modify the original object - that way, the changes will be reflected in the calling function
  for (const key in updatedJob) {
    job[key] = updatedJob[key]
  }

  const state = {
    jobTasksStatus,
    reachedMaxRetries: false,
  }

  // Run the job
  try {
    await workflowHandler({
      job: job as unknown as RunningJob<WorkflowTypes>, //TODO: Type this better
      req,
      runTask: getRunTaskFunction(state, job, workflowConfig, req, false),
      runTaskInline: getRunTaskFunction(state, job, workflowConfig, req, true),
    })
  } catch (err) {
    await req.payload.update({
      id: job.id,
      collection: 'payload-jobs',
      data: {
        ...job,
        processing: false,
        // TODO: Eventually et waitUntil here if backoff strategy is implemented
      } as BaseJob,
      req,
    })

    req.payload.logger.error({ err, job, msg: 'Error running workflow' })
    return {
      status: state.reachedMaxRetries ? 'error-reached-max-retries' : 'error',
    }
  }

  // Workflow has completed
  await req.payload.update({
    id: job.id,
    collection: 'payload-jobs',
    data: {
      ...job, // Ensure any data that has changed during the workflow (e.g. through the user manually mutating the job arg) is saved
      completedAt: new Date(),
      processing: false,
    },
    req,
  })

  return {
    status: 'success',
  }
}
