import ObjectIdImport from 'bson-objectid'

import type { Job } from '../../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../../types/index.js'
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
  SingleTaskStatus,
  WorkflowConfig,
  WorkflowTypes,
} from '../../../config/types/workflowTypes.js'
import type { UpdateJobFunction } from './getUpdateJobFunction.js'

import { calculateBackoffWaitUntil } from './calculateBackoffWaitUntil.js'
import { importHandlerPath } from './importHandlerPath.js'

const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

// Helper object type to force being passed by reference
export type RunTaskFunctionState = {
  reachedMaxRetries: boolean
}

async function getTaskHandlerFromConfig(taskConfig?: TaskConfig) {
  if (!taskConfig) {
    throw new Error('Task config is required to get the task handler')
  }
  if (typeof taskConfig.handler === 'function') {
    return taskConfig.handler
  } else {
    return await importHandlerPath<TaskHandler<TaskType>>(taskConfig.handler)
  }
}

export async function handleTaskFailed({
  error,
  executedAt,
  input,
  job,
  maxRetries,
  output,
  parent,
  req,
  retriesConfig,
  state,
  taskConfig,
  taskHandlerResult,
  taskID,
  taskSlug,
  taskStatus,
  updateJob,
}: {
  error?: Error
  executedAt: Date
  input: object
  job: Job
  maxRetries: number
  output: object
  parent?: TaskParent
  req: PayloadRequest
  retriesConfig: number | RetryConfig
  state: RunTaskFunctionState
  taskConfig?: TaskConfig<string>
  taskHandlerResult?: TaskHandlerResult<string>
  taskID: string
  taskSlug: string
  taskStatus: null | SingleTaskStatus<string>
  updateJob: UpdateJobFunction
}): Promise<never> {
  req.payload.logger.error({ err: error, job, msg: `Error running task ${taskID}`, taskSlug })

  if (taskConfig?.onFail) {
    await taskConfig.onFail()
  }

  const errorJSON = error
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    : {
        message:
          taskHandlerResult?.state === 'failed'
            ? (taskHandlerResult.errorMessage ?? taskHandlerResult.state)
            : 'failed',
      }

  const currentDate = new Date()

  ;(job.log ??= []).push({
    id: new ObjectId().toHexString(),
    completedAt: currentDate.toISOString(),
    error: errorJSON,
    executedAt: executedAt.toISOString(),
    input,
    output,
    parent: req.payload.config.jobs.addParentToTaskLog ? parent : undefined,
    state: 'failed',
    taskID,
    taskSlug,
  })

  if (job.waitUntil) {
    // Check if waitUntil is in the past
    const waitUntil = new Date(job.waitUntil)
    if (waitUntil < currentDate) {
      // Outdated waitUntil, remove it
      delete job.waitUntil
    }
  }

  if (!taskStatus?.complete && (taskStatus?.totalTried ?? 0) >= maxRetries) {
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

export type TaskParent = {
  taskID: string
  taskSlug: string
}

export const getRunTaskFunction = <TIsInline extends boolean>(
  state: RunTaskFunctionState,
  job: Job,
  workflowConfig: WorkflowConfig,
  req: PayloadRequest,
  isInline: TIsInline,
  updateJob: UpdateJobFunction,
  parent?: TaskParent,
): TIsInline extends true ? RunInlineTaskFunction : RunTaskFunctions => {
  const jobConfig = req.payload.config.jobs

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
        // Only available for inline tasks:
        task,
      }: Parameters<RunInlineTaskFunction>[1] & Parameters<RunTaskFunction<string>>[1],
    ) => {
      const executedAt = new Date()

      let taskConfig: TaskConfig | undefined
      if (!isInline) {
        taskConfig = (jobConfig.tasks?.length &&
          jobConfig.tasks.find((t) => t.slug === taskSlug)) as TaskConfig<string>

        if (!taskConfig) {
          throw new Error(`Task ${taskSlug} not found in workflow ${job.workflowSlug}`)
        }
      }

      const retriesConfigFromPropsNormalized =
        retries == undefined || retries == null
          ? {}
          : typeof retries === 'number'
            ? { attempts: retries }
            : retries
      const retriesConfigFromTaskConfigNormalized = taskConfig
        ? typeof taskConfig.retries === 'number'
          ? { attempts: taskConfig.retries }
          : taskConfig.retries
        : {}

      const finalRetriesConfig: RetryConfig = {
        ...retriesConfigFromTaskConfigNormalized,
        ...retriesConfigFromPropsNormalized, // Retry config from props takes precedence
      }

      const taskStatus: null | SingleTaskStatus<string> = job?.taskStatus?.[taskSlug]
        ? job.taskStatus[taskSlug][taskID]!
        : null

      // Handle restoration of task if it succeeded in a previous run
      if (taskStatus && taskStatus.complete === true) {
        let shouldRestore = true
        if (finalRetriesConfig?.shouldRestore === false) {
          shouldRestore = false
        } else if (typeof finalRetriesConfig?.shouldRestore === 'function') {
          shouldRestore = await finalRetriesConfig.shouldRestore({
            input: input!,
            job,
            req,
            taskStatus,
          })
        }
        if (shouldRestore) {
          return taskStatus.output
        }
      }

      const runner = isInline
        ? (task as TaskHandler<TaskType>)
        : await getTaskHandlerFromConfig(taskConfig)

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
            ...(job.log || []),
            {
              id: new ObjectId().toHexString(),
              completedAt: new Date().toISOString(),
              error: errorMessage,
              executedAt: executedAt.toISOString(),
              parent: jobConfig.addParentToTaskLog ? parent : undefined,
              state: 'failed',
              taskID,
              taskSlug,
            },
          ],
          processing: false,
        })

        throw new Error(errorMessage)
      }

      let maxRetries: number | undefined = finalRetriesConfig?.attempts

      if (maxRetries === undefined || maxRetries === null) {
        // Inherit retries from workflow config, if they are undefined and the workflow config has retries configured
        if (workflowConfig.retries !== undefined && workflowConfig.retries !== null) {
          maxRetries =
            typeof workflowConfig.retries === 'object'
              ? workflowConfig.retries.attempts
              : workflowConfig.retries
        } else {
          maxRetries = 0
        }
      }

      let taskHandlerResult: TaskHandlerResult<string>
      let output: JsonObject | undefined = {}

      try {
        taskHandlerResult = await runner({
          inlineTask: getRunTaskFunction(state, job, workflowConfig, req, true, updateJob, {
            taskID,
            taskSlug,
          }),
          input,
          job: job as unknown as Job<WorkflowTypes>,
          req,
          tasks: getRunTaskFunction(state, job, workflowConfig, req, false, updateJob, {
            taskID,
            taskSlug,
          }),
        })
      } catch (err) {
        await handleTaskFailed({
          error: err as Error | undefined,
          executedAt,
          input: input!,
          job,
          maxRetries: maxRetries!,
          output,
          parent,
          req,
          retriesConfig: finalRetriesConfig,
          state,
          taskConfig,
          taskID,
          taskSlug,
          taskStatus,
          updateJob,
        })
        throw new Error('Task failed')
      }

      if (taskHandlerResult.state === 'failed') {
        await handleTaskFailed({
          executedAt,
          input: input!,
          job,
          maxRetries: maxRetries!,
          output,
          parent,
          req,
          retriesConfig: finalRetriesConfig,
          state,
          taskConfig,
          taskHandlerResult,
          taskID,
          taskSlug,
          taskStatus,
          updateJob,
        })
        throw new Error('Task failed')
      } else {
        output = taskHandlerResult.output
      }

      if (taskConfig?.onSuccess) {
        await taskConfig.onSuccess()
      }

      ;(job.log ??= []).push({
        id: new ObjectId().toHexString(),
        completedAt: new Date().toISOString(),
        executedAt: executedAt.toISOString(),
        input,
        output,
        parent: jobConfig.addParentToTaskLog ? parent : undefined,
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
    for (const task of jobConfig.tasks ?? []) {
      tasks[task.slug] = runTask(task.slug) as RunTaskFunction<string>
    }
    return tasks as TIsInline extends true ? RunInlineTaskFunction : RunTaskFunctions
  }
}
