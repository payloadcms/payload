import type { PayloadRequest } from '../../../types/index.js'
import type {
  RunInlineTaskFunction,
  RunTaskFunction,
  TaskConfig,
  TaskHandler,
  TaskType,
} from '../../config/types/taskTypes.js'
import type {
  BaseJob,
  JobTasksStatus,
  RunningJob,
  WorkflowConfig,
  WorkflowTypes,
} from '../../config/types/workflowTypes.js'
import type { UpdateJobFunction } from './getUpdateJobFunction.js'

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

    let maxRetries = retries
    let taskConfig: TaskConfig<any>
    if (!isInline) {
      taskConfig = req.payload.config.jobs.tasks.find((t) => t.slug === task)
      if (!retries) {
        maxRetries = taskConfig.retries
      }

      if (!taskConfig) {
        throw new Error(`Task ${String(task)} not found in workflow ${job.workflowSlug}`)
      }
    }

    const taskStatus = state.jobTasksStatus[id]

    if (taskStatus && taskStatus.complete === true) {
      return taskStatus.output
    }

    if (taskStatus && !taskStatus.complete && taskStatus.totalTried >= maxRetries) {
      state.reachedMaxRetries = true
      throw new Error(
        `Task ${String(task)} has failed more than the allowed retries in workflow ${job.workflowSlug}`,
      )
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

        await updateJob(job)

        throw new Error('Task failed')
      } else {
        output = runnerOutput.output
      }
    } catch (err) {
      req.payload.logger.error({ err, job, msg: 'Error running task', task })
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

      await updateJob(job)

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

    await updateJob(job)

    return output
  }

  return runTask as any
}
