import { pathToFileURL } from 'url'

import type { PayloadRequest } from '../types/index.js'
import type { RunTaskFunction, TaskRunner, TaskType } from './config/taskTypes.js'
import type {
  BaseJob,
  RunningJob,
  WorkflowConfig,
  WorkflowControlFlow,
  WorkflowTasksStatus,
  WorkflowTypes,
} from './config/workflowTypes.js'

type Args = {
  job: BaseJob
  req: PayloadRequest
  workflowConfig: WorkflowConfig<WorkflowTypes>
  workflowTasksStatus: WorkflowTasksStatus
}

export const runWorkflow = async ({ job, req, workflowConfig, workflowTasksStatus }: Args) => {
  if (!workflowConfig.controlFlowInJS) {
    throw new Error('Currently, only workflows with controlFlowInJS are supported')
  }

  // the runner will either be passed to the config
  // OR it will be a path, which we will need to import via eval to avoid
  // Next.js compiler dynamic import expression errors

  let runner: WorkflowControlFlow<WorkflowTypes>

  if (typeof workflowConfig.controlFlowInJS === 'function') {
    runner = workflowConfig.controlFlowInJS
  } else {
    const [runnerPath, runnerImportName] = workflowConfig.controlFlowInJS.split('#')

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
      const errorMessage = `Can't find runner while importing with the path ${workflowConfig.controlFlowInJS} in job type ${job.workflowSlug}.`
      req.payload.logger.error(errorMessage)

      await req.payload.update({
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
      })

      return
    }
  }

  await req.payload.update({
    id: job.id,
    collection: 'payload-jobs',
    data: {
      processing: true,
      seenByWorker: true,
    },
    req,
  })

  const runTask: RunTaskFunction = async ({ id, input, retries, task }) => {
    const taskConfig = req.payload.config.jobs.tasks.find((t) => t.slug === task)

    if (!taskConfig) {
      throw new Error(`Task ${task} not found in workflow ${job.workflowSlug}`)
    }

    const taskStatus = workflowTasksStatus[id]

    if (taskStatus && taskStatus.complete === true) {
      return taskStatus.output
    }

    if (taskStatus && !taskStatus.complete && taskStatus.totalTried >= taskStatus.retries) {
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

        await req.payload.update({
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
        })

        return
      }
    }

    const executedAt = new Date()
    let output
    try {
      output = await runner({
        input,
        job: job as unknown as RunningJob<WorkflowTypes>, // TODO: Type this better
        req,
      })
    } catch (err) {
      console.error('Error in task', err)
      await req.payload.update({
        id: job.id,
        collection: 'payload-jobs',
        data: {
          log: [
            ...job.log,
            {
              completedAt: new Date(),
              error: err,
              executedAt,
              input,
              output,
              state: 'failed',
              taskID: id,
              taskSlug: task,
            },
          ],
        } as BaseJob,
        req,
      })
      throw err
    }

    workflowTasksStatus[id] = {
      complete: true,
      input,
      output,
      retries: taskConfig.retries,
      taskConfig,
      totalTried: 0,
    }

    await req.payload.update({
      id: job.id,
      collection: 'payload-jobs',
      data: {
        log: [
          ...job.log,
          {
            completedAt: new Date(),
            executedAt,
            input,
            output,
            state: 'succeeded',
            taskID: id,
            taskSlug: task,
          },
        ],
      } as BaseJob,
      req,
    })

    return output
  }

  // Run the job
  try {
    await runner({
      job: job as unknown as RunningJob<WorkflowTypes>, //TODO: Type this better
      runTask,
    })
  } catch (err) {
    return
  }

  // Workflow has completed
  await req.payload.update({
    id: job.id,
    collection: 'payload-jobs',
    data: {
      completedAt: new Date(),
      processing: false,
    },
    req,
  })
}
