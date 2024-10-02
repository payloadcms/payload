import { pathToFileURL } from 'url'

import type { PayloadRequest } from '../types/index.js'
import type { RunTaskFunction, TaskRunner, TaskType } from './config/taskTypes.js'
import type {
  BaseJob,
  JobTasksStatus,
  RunningJob,
  WorkflowConfig,
  WorkflowControlFlow,
  WorkflowTypes,
} from './config/workflowTypes.js'

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
  if (!workflowConfig.controlFlowInJS) {
    throw new Error('Currently, only workflows with controlFlowInJS are supported')
  }

  // the runner will either be passed to the config
  // OR it will be a path, which we will need to import via eval to avoid
  // Next.js compiler dynamic import expression errors

  let controlFlowRunner: WorkflowControlFlow<WorkflowTypes>

  if (typeof workflowConfig.controlFlowInJS === 'function') {
    controlFlowRunner = workflowConfig.controlFlowInJS
  } else {
    const [runnerPath, runnerImportName] = workflowConfig.controlFlowInJS.split('#')

    const runnerModule =
      typeof require === 'function'
        ? await eval(`require('${runnerPath.replaceAll('\\', '/')}')`)
        : await eval(`import('${pathToFileURL(runnerPath).href}')`)

    // If the path has indicated an #exportName, try to get it
    if (runnerImportName && runnerModule[runnerImportName]) {
      controlFlowRunner = runnerModule[runnerImportName]
    }

    // If there is a default export, use it
    if (!controlFlowRunner && runnerModule.default) {
      controlFlowRunner = runnerModule.default
    }

    // Finally, use whatever was imported
    if (!controlFlowRunner) {
      controlFlowRunner = runnerModule
    }

    if (!controlFlowRunner) {
      const errorMessage = `Can't find runner while importing with the path ${workflowConfig.controlFlowInJS} in job type ${job.workflowSlug}.`
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

  let reachedMaxRetries = false

  const runTask: RunTaskFunction = async ({ id, input, retries, task }) => {
    const taskConfig = req.payload.config.jobs.tasks.find((t) => t.slug === task)

    if (!taskConfig) {
      throw new Error(`Task ${task} not found in workflow ${job.workflowSlug}`)
    }

    const taskStatus = jobTasksStatus[id]

    if (taskStatus && taskStatus.complete === true) {
      return taskStatus.output
    }

    const maxRetries = retries ?? taskConfig.retries
    if (taskStatus && !taskStatus.complete && taskStatus.totalTried >= maxRetries) {
      reachedMaxRetries = true
      throw new Error(
        `Task ${task} has failed more than the allowed retries in workflow ${job.workflowSlug}`,
      )
    }

    let runner: TaskRunner<TaskType>

    if (typeof taskConfig.run === 'function') {
      runner = taskConfig.run
    } else {
      const [runnerPath, runnerImportName] = taskConfig.run.split('#')

      const runnerModule =
        typeof require === 'function'
          ? await eval(`require('${runnerPath.replaceAll('\\', '/')}')`)
          : await eval(`import('${pathToFileURL(runnerPath).href}')`)

      // If the path has indicated an #exportName, try to get it
      if (runnerImportName && runnerModule[runnerImportName]) {
        runner = runnerModule[runnerImportName]
      }

      // If there is a default export, use it
      if (!runner && runnerModule.default) {
        runner = runnerModule.default
      }

      // Finally, use whatever was imported
      if (!runner) {
        runner = runnerModule
      }

      if (!runner) {
        const errorMessage = `Can't find runner while importing with the path ${workflowConfig.controlFlowInJS} in job type ${job.workflowSlug} for task ${taskConfig.slug}.`
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
                executedAt: new Date(),
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

    const executedAt = new Date()
    let output: object
    try {
      const runnerOutput = await runner({
        input,
        job: job as unknown as RunningJob<WorkflowTypes>, // TODO: Type this better
        req,
      })

      if (runnerOutput.state === 'failed') {
        if (!job.log) {
          job.log = []
        }
        job.log.push({
          completedAt: new Date().toISOString(),
          error: runnerOutput.state,
          executedAt: executedAt.toISOString(),
          input,
          output,
          state: 'failed',
          taskID: id,
          taskSlug: String(task),
        })
        const updatedJob = (await req.payload.update({
          id: job.id,
          collection: 'payload-jobs',
          data: job,
          req,
        })) as BaseJob

        // Update job object like this to modify the original object - that way, the changes will be reflected in the calling function
        for (const key in updatedJob) {
          job[key] = updatedJob[key]
        }
        throw new Error('Task failed')
      } else {
        output = runnerOutput.output
      }
    } catch (err) {
      console.error('Error in task', err)
      if (!job.log) {
        job.log = []
      }
      job.log.push({
        completedAt: new Date().toISOString(),
        error: err,
        executedAt: executedAt.toISOString(),
        input,
        output,
        state: 'failed',
        taskID: id,
        taskSlug: String(task),
      })
      const updatedJob = (await req.payload.update({
        id: job.id,
        collection: 'payload-jobs',
        data: job,
        req,
      })) as BaseJob

      // Update job object like this to modify the original object - that way, the changes will be reflected in the calling function
      for (const key in updatedJob) {
        job[key] = updatedJob[key]
      }

      throw err
    }

    jobTasksStatus[id] = {
      complete: true,
      input,
      output,
      retries: taskConfig.retries,
      taskConfig,
      totalTried: 0,
    }

    if (!job.log) {
      job.log = []
    }
    job.log.push({
      completedAt: new Date().toISOString(),
      executedAt: executedAt.toISOString(),
      input,
      output,
      state: 'succeeded',
      taskID: id,
      taskSlug: String(task),
    })

    const updatedJob = (await req.payload.update({
      id: job.id,
      collection: 'payload-jobs',
      data: job,
      req,
    })) as BaseJob

    // Update job object like this to modify the original object - that way, the changes will be reflected in the calling function
    for (const key in updatedJob) {
      job[key] = updatedJob[key]
    }

    return output
  }

  // Run the job
  try {
    await controlFlowRunner({
      job: job as unknown as RunningJob<WorkflowTypes>, //TODO: Type this better
      req,
      runTask,
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
      status: reachedMaxRetries ? 'error-reached-max-retries' : 'error',
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
