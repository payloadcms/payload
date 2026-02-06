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
  JobLog,
  SingleTaskStatus,
  WorkflowConfig,
  WorkflowTypes,
} from '../../../config/types/workflowTypes.js'
import type { UpdateJobFunction } from './getUpdateJobFunction.js'

import { JobCancelledError, TaskError } from '../../../errors/index.js'
import { getCurrentDate } from '../../../utilities/getCurrentDate.js'
import { getTaskHandlerFromConfig } from './importHandlerPath.js'

const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport

export type TaskParent = {
  taskID: string
  taskSlug: string
}

export const getRunTaskFunction = <TIsInline extends boolean>(
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
      const executedAt = getCurrentDate()

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
            input,
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
        throw new TaskError({
          executedAt,
          input,
          job,
          message: isInline
            ? `Inline task with ID ${taskID} does not have a valid handler.`
            : `Task with slug ${taskSlug} in workflow ${job.workflowSlug} does not have a valid handler.`,
          parent,
          retriesConfig: finalRetriesConfig,
          taskConfig,
          taskID,
          taskSlug,
          taskStatus,
          workflowConfig,
        })
      }

      let taskHandlerResult: TaskHandlerResult<string>
      let output: JsonObject | undefined = {}

      try {
        taskHandlerResult = await runner({
          inlineTask: getRunTaskFunction(job, workflowConfig, req, true, updateJob, {
            taskID,
            taskSlug,
          }),
          input,
          job: job as unknown as Job<WorkflowTypes>,
          req,
          tasks: getRunTaskFunction(job, workflowConfig, req, false, updateJob, {
            taskID,
            taskSlug,
          }),
        })
      } catch (err: any) {
        if (err instanceof JobCancelledError) {
          // Re-throw JobCancelledError to be handled by the top-level error handler
          throw err
        }
        throw new TaskError({
          executedAt,
          input: input!,
          job,
          message: err.message || 'Task handler threw an error',
          output,
          parent,
          retriesConfig: finalRetriesConfig,
          taskConfig,
          taskID,
          taskSlug,
          taskStatus,
          workflowConfig,
        })
      }

      if (taskHandlerResult.state === 'failed') {
        throw new TaskError({
          executedAt,
          input: input!,
          job,
          message: taskHandlerResult.errorMessage ?? 'Task handler returned a failed state',
          output,
          parent,
          retriesConfig: finalRetriesConfig,
          taskConfig,
          taskID,
          taskSlug,
          taskStatus,
          workflowConfig,
        })
      } else {
        output = taskHandlerResult.output
      }

      if (taskConfig?.onSuccess) {
        await taskConfig.onSuccess({
          input,
          job,
          req,
          taskStatus,
        })
      }

      const newLogItem: JobLog = {
        id: new ObjectId().toHexString(),
        completedAt: getCurrentDate().toISOString(),
        executedAt: executedAt.toISOString(),
        input,
        output,
        parent: jobConfig.addParentToTaskLog ? parent : undefined,
        state: 'succeeded',
        taskID,
        taskSlug,
      }

      await updateJob({
        log: {
          $push: newLogItem,
        } as any,
        // Set to null to skip main row update on postgres. 2 => 1 db round trips
        updatedAt: null as any,
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
