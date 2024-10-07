import type { PayloadRequest } from '../../../types/index.js'
import type {
  RetryConfig,
  RunInlineTaskFunction,
  RunTaskFunction,
  TaskConfig,
  TaskHandler,
  TaskHandlerResult,
  TaskType,
} from '../../config/types/taskTypes.js'
import type {
  BaseJob,
  JobTasksStatus,
  JobTaskStatus,
  RunningJob,
  WorkflowConfig,
  WorkflowTypes,
} from '../../config/types/workflowTypes.js'
import type { UpdateJobFunction } from './getUpdateJobFunction.js'

import { calculateBackoffWaitUntil } from './calculateBackoffWaitUntil.js'
import { importHandlerPath } from './importHandlerPath.js'

// Helper object type to force being passed by reference
export type RunTaskFunctionState = {
  jobTasksStatus: JobTasksStatus
  reachedMaxRetries: boolean
}

async function getTaskHandlerFromConfig(taskConfig: TaskConfig<any>) {
  let handler: TaskHandler<TaskType>

  if (typeof taskConfig.handler === 'function') {
    handler = taskConfig.handler
  } else {
    handler = await importHandlerPath<TaskHandler<TaskType>>(taskConfig.handler)
  }
  return handler
}

export async function handleTaskFailed({
  error,
  executedAt,
  input,
  job,
  maxRetries,
  output,
  req,
  retriesConfig,
  runnerOutput,
  state,
  taskID,
  taskSlug,
  taskStatus,
  updateJob,
}: {
  error?: Error
  executedAt: Date
  input: any
  job: BaseJob
  maxRetries: number
  output: any
  req: PayloadRequest
  retriesConfig: number | RetryConfig
  runnerOutput?: TaskHandlerResult<string>
  state: RunTaskFunctionState
  taskID: string
  taskSlug: string
  taskStatus: JobTaskStatus<string>
  updateJob: UpdateJobFunction
}): Promise<never> {
  req.payload.logger.error({ err: error, job, msg: 'Error running task', taskSlug })

  if (!job.log) {
    job.log = []
  }
  job.log.push({
    completedAt: new Date().toISOString(),
    error: error ?? runnerOutput.state,
    executedAt: executedAt.toISOString(),
    input,
    output,
    state: 'failed',
    taskID,
    taskSlug,
  })

  if (job.waitUntil) {
    // Check if waitUntil is in the past
    const waitUntil = new Date(job.waitUntil)
    if (waitUntil < new Date()) {
      // Outdated waitUntil, remove it
      delete job.waitUntil
    }
  }
  if (taskStatus && !taskStatus.complete && taskStatus.totalTried >= maxRetries) {
    state.reachedMaxRetries = true
    job.hasError = true
    job.processing = false
    job.error = error

    await updateJob(job)

    throw new Error(
      `Task ${taskSlug} has failed more than the allowed retries in workflow ${job.workflowSlug}${error ? `. Error: ${error}` : ''}`,
    )
  } else {
    // Job will retry. Let's determine when!
    const waitUntil: Date = calculateBackoffWaitUntil({
      retriesConfig,
      totalTried: taskStatus.totalTried,
    })

    // Update job's waitUntil only if this waitUntil is later than the current one
    if (!job.waitUntil || waitUntil > new Date(job.waitUntil)) {
      job.waitUntil = waitUntil.toISOString()
    }

    await updateJob(job)
    throw error ?? new Error('Task failed')
  }
}

export const getRunTaskFunction = <TIsInline extends boolean>(
  state: RunTaskFunctionState,
  job: BaseJob,
  workflowConfig: WorkflowConfig<any>,
  req: PayloadRequest,
  isInline: TIsInline,
  updateJob: UpdateJobFunction,
): TIsInline extends true ? RunInlineTaskFunction : RunTaskFunction => {
  const runTask = async ({
    id,
    input,
    retries,
    task,
  }: Parameters<RunInlineTaskFunction>[0] | Parameters<RunTaskFunction>[0]) => {
    const executedAt = new Date()

    let inlineRunner: TaskHandler<TaskType> = null
    if (isInline) {
      inlineRunner = task as unknown as TaskHandler<TaskType>
      task = 'inline'
    }

    let maxRetries: number = typeof retries === 'object' ? retries?.attempts : retries
    let taskConfig: TaskConfig<any>
    if (!isInline) {
      taskConfig = req.payload.config.jobs.tasks.find((t) => t.slug === task)
      if (!retries) {
        maxRetries =
          typeof taskConfig.retries === 'object' ? taskConfig.retries.attempts : taskConfig.retries
      }

      if (!taskConfig) {
        throw new Error(`Task ${String(task)} not found in workflow ${job.workflowSlug}`)
      }
    }

    const taskStatus = state.jobTasksStatus[id]

    if (taskStatus && taskStatus.complete === true) {
      return taskStatus.output
    }

    let runner: TaskHandler<TaskType>
    if (isInline) {
      runner = inlineRunner
    } else {
      if (!taskConfig) {
        throw new Error(`Task ${String(task)} not found in workflow ${job.workflowSlug}`)
      }
      runner = await getTaskHandlerFromConfig(taskConfig)
    }

    if (!runner || typeof runner !== 'function') {
      const errorMessage = isInline
        ? `Can't find runner for inline task with ID ${id}`
        : `Can't find runner while importing with the path ${workflowConfig.handler} in job type ${job.workflowSlug} for task ${String(task)}.`
      req.payload.logger.error(errorMessage)

      await updateJob({
        error: {
          error: errorMessage,
        },
        hasError: true,
        log: [
          ...job.log,
          {
            completedAt: new Date().toISOString(),
            error: errorMessage,
            executedAt: executedAt.toISOString(),
            state: 'failed',
            taskID: id,
            taskSlug: String(task),
          },
        ],
        processing: false,
      })

      return
    }

    let output: object
    try {
      const runnerOutput = await runner({
        input,
        job: job as unknown as RunningJob<WorkflowTypes>, // TODO: Type this better
        req,
      })

      if (runnerOutput.state === 'failed') {
        await handleTaskFailed({
          executedAt,
          input,
          job,
          maxRetries,
          output,
          req,
          retriesConfig: taskConfig?.retries,
          runnerOutput,
          state,
          taskID: id,
          taskSlug: String(task),
          taskStatus,
          updateJob,
        })
        throw new Error('Task failed')
      } else {
        output = runnerOutput.output
      }
    } catch (err) {
      await handleTaskFailed({
        error: err,
        executedAt,
        input,
        job,
        maxRetries,
        output,
        req,
        retriesConfig: taskConfig?.retries,
        state,
        taskID: id,
        taskSlug: String(task),
        taskStatus,
        updateJob,
      })
      throw new Error('Task failed')
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

    await updateJob(job)

    return output
  }

  return runTask as any
}
