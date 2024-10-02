import { pathToFileURL } from 'url'

import type { PayloadRequest } from '../../types/index.js'
import type {
  RunInlineTaskFunction,
  RunTaskFunction,
  TaskConfig,
  TaskRunner,
  TaskType,
} from '../config/taskTypes.js'
import type {
  BaseJob,
  JobTasksStatus,
  RunningJob,
  WorkflowConfig,
  WorkflowTypes,
} from '../config/workflowTypes.js'

// Helper object type to force being passed by reference
export type RunTaskFunctionState = {
  jobTasksStatus: JobTasksStatus
  reachedMaxRetries: boolean
}

async function getTaskRunnerFromConfig(taskConfig: TaskConfig<any>) {
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
  }
  return runner
}

export const getRunTaskFunction = <TIsInline extends boolean>(
  state: RunTaskFunctionState,
  job: BaseJob,
  workflowConfig: WorkflowConfig<any>,
  req: PayloadRequest,
  isInline: TIsInline,
): TIsInline extends true ? RunInlineTaskFunction : RunTaskFunction => {
  const runTask: RunTaskFunction = async ({ id, input, retries, task }) => {
    let inlineRunner: TaskRunner<TaskType> = null
    if (isInline) {
      inlineRunner = task as unknown as TaskRunner<TaskType>
      // @ts-expect-error
      task = 'inline'
    }

    let maxRetries = retries
    let taskConfig: TaskConfig<any>
    if (!isInline) {
      taskConfig = req.payload.config.jobs.tasks.find((t) => t.slug === task)
      if (!retries) {
        maxRetries = taskConfig.retries
      }

      if (!taskConfig) {
        throw new Error(`Task ${task} not found in workflow ${job.workflowSlug}`)
      }
    }

    const taskStatus = state.jobTasksStatus[id]

    if (taskStatus && taskStatus.complete === true) {
      return taskStatus.output
    }

    if (taskStatus && !taskStatus.complete && taskStatus.totalTried >= maxRetries) {
      state.reachedMaxRetries = true
      throw new Error(
        `Task ${task} has failed more than the allowed retries in workflow ${job.workflowSlug}`,
      )
    }

    let runner: TaskRunner<TaskType>
    if (isInline) {
      runner = inlineRunner
    } else {
      if (!taskConfig) {
        throw new Error(`Task ${task} not found in workflow ${job.workflowSlug}`)
      }
      runner = await getTaskRunnerFromConfig(taskConfig)
    }

    if (!runner || typeof runner !== 'function') {
      const errorMessage = isInline
        ? `Can't find runner for inline task with ID ${id}`
        : `Can't find runner while importing with the path ${workflowConfig.controlFlowInJS} in job type ${job.workflowSlug} for task ${task}.`
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

    state.jobTasksStatus[id] = {
      complete: true,
      input,
      output,
      taskSlug: String(task),
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

  return runTask as any
}
