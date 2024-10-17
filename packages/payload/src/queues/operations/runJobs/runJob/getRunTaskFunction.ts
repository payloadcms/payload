import type { PayloadRequest } from '../../../../types/index.js'
import type {
  RetryConfig,
  RunInlineTaskFunction,
  RunTaskFunction,
  RunTaskFunctions,
  TaskConfig,
  TaskHandler,
  TaskHandlerResult,
  TaskType,
} from '../../../config/types/taskTypes.js'
import type {
  BaseJob,
  RunningJob,
  SingleTaskStatus,
  WorkflowConfig,
  WorkflowTypes,
} from '../../../config/types/workflowTypes.js'
import type { UpdateJobFunction } from './getUpdateJobFunction.js'

import { calculateBackoffWaitUntil } from './calculateBackoffWaitUntil.js'
import { importHandlerPath } from './importHandlerPath.js'

// Helper object type to force being passed by reference
export type RunTaskFunctionState = {
  reachedMaxRetries: boolean
}

async function getTaskHandlerFromConfig(taskConfig: TaskConfig<string>) {
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
  taskConfig,
  taskID,
  taskSlug,
  taskStatus,
  updateJob,
}: {
  error?: Error
  executedAt: Date
  input: object
  job: BaseJob
  maxRetries: number
  output: object
  req: PayloadRequest
  retriesConfig: number | RetryConfig
  runnerOutput?: TaskHandlerResult<string>
  state: RunTaskFunctionState
  taskConfig?: TaskConfig<string>
  taskID: string
  taskSlug: string
  taskStatus: null | SingleTaskStatus<string>
  updateJob: UpdateJobFunction
}): Promise<never> {
  req.payload.logger.error({ err: error, job, msg: 'Error running task', taskSlug })

  if (taskConfig?.onFail) {
    await taskConfig.onFail()
  }

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

    await updateJob({
      error,
      hasError: true,
      log: job.log,
      processing: false,
      waitUntil: job.waitUntil,
    })

    throw new Error(
      `Task ${taskSlug} has failed more than the allowed retries in workflow ${job.workflowSlug}${error ? `. Error: ${String(error)}` : ''}`,
    )
  } else {
    // Job will retry. Let's determine when!
    const waitUntil: Date = calculateBackoffWaitUntil({
      retriesConfig,
      totalTried: taskStatus?.totalTried ?? 0,
    })

    // Update job's waitUntil only if this waitUntil is later than the current one
    if (!job.waitUntil || waitUntil > new Date(job.waitUntil)) {
      job.waitUntil = waitUntil.toISOString()
    }

    await updateJob({
      log: job.log,
      processing: false,
      waitUntil: job.waitUntil,
    })
    throw error ?? new Error('Task failed')
  }
}

export const getRunTaskFunction = <TIsInline extends boolean>(
  state: RunTaskFunctionState,
  job: BaseJob,
  workflowConfig: WorkflowConfig<string>,
  req: PayloadRequest,
  isInline: TIsInline,
  updateJob: UpdateJobFunction,
): TIsInline extends true ? RunInlineTaskFunction : RunTaskFunctions => {
  const runTask: <TTaskSlug extends string>(
    taskSlug: TTaskSlug,
  ) => TTaskSlug extends 'inline' ? RunInlineTaskFunction : RunTaskFunction<TTaskSlug> = (
    taskSlug,
  ) =>
    (async (
      taskID: Parameters<RunInlineTaskFunction>[0],
      {
        input,
        retries,
        task,
      }: Parameters<RunInlineTaskFunction>[1] & Parameters<RunTaskFunction<string>>[1],
    ) => {
      const executedAt = new Date()

      let inlineRunner: TaskHandler<TaskType> = null
      if (isInline) {
        inlineRunner = task
      }

      let retriesConfig: number | RetryConfig = retries
      let taskConfig: TaskConfig<string>
      if (!isInline) {
        taskConfig = req.payload.config.jobs.tasks.find((t) => t.slug === taskSlug)
        if (!retriesConfig) {
          retriesConfig = taskConfig.retries
        }

        if (!taskConfig) {
          throw new Error(`Task ${taskSlug} not found in workflow ${job.workflowSlug}`)
        }
      }
      const maxRetries: number =
        typeof retriesConfig === 'object' ? retriesConfig?.attempts : retriesConfig

      const taskStatus: null | SingleTaskStatus<string> = job?.taskStatus?.[taskSlug]
        ? job.taskStatus[taskSlug][taskID]
        : null

      if (taskStatus && taskStatus.complete === true) {
        return taskStatus.output
      }

      let runner: TaskHandler<TaskType>
      if (isInline) {
        runner = inlineRunner
      } else {
        if (!taskConfig) {
          throw new Error(`Task ${taskSlug} not found in workflow ${job.workflowSlug}`)
        }
        runner = await getTaskHandlerFromConfig(taskConfig)
      }

      if (!runner || typeof runner !== 'function') {
        const errorMessage = isInline
          ? `Can't find runner for inline task with ID ${taskID}`
          : `Can't find runner while importing with the path ${typeof workflowConfig.handler === 'string' ? workflowConfig.handler : 'unknown - no string path'} in job type ${job.workflowSlug} for task ${taskSlug}.`
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
              taskID,
              taskSlug,
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
            retriesConfig,
            runnerOutput,
            state,
            taskConfig,
            taskID,
            taskSlug,
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
          retriesConfig,
          state,
          taskConfig,
          taskID,
          taskSlug,
          taskStatus,
          updateJob,
        })
        throw new Error('Task failed')
      }

      if (taskConfig?.onSuccess) {
        await taskConfig.onSuccess()
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
        taskID,
        taskSlug,
      })

      await updateJob({
        log: job.log,
      })

      return output
    }) as any

  if (isInline) {
    return runTask('inline') as TIsInline extends true ? RunInlineTaskFunction : RunTaskFunctions
  } else {
    const tasks: RunTaskFunctions = {}
    for (const task of req?.payload?.config?.jobs?.tasks ?? []) {
      tasks[task.slug] = runTask(task.slug)
    }
    return tasks as TIsInline extends true ? RunInlineTaskFunction : RunTaskFunctions
  }
}
