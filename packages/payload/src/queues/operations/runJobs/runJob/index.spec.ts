import type { Job } from '../../../../index.js'
import type { PayloadRequest } from '../../../../types/index.js'
import type { TaskConfig } from '../../../config/types/taskTypes.js'
import type { WorkflowJSON } from '../../../config/types/workflowJSONTypes.js'
import type { WorkflowConfig } from '../../../config/types/workflowTypes.js'
import type { UpdateJobFunction } from './getUpdateJobFunction.js'

import { describe, expect, it, vi } from 'vitest'

import { TaskError, WorkflowError } from '../../../errors/index.js'
import { runJSONJob } from '../runJSONJob/index.js'
import { runJob } from './index.js'

function createRunContext({ tasks = [] }: { tasks?: TaskConfig<string>[] }) {
  const job = {
    id: 'job-id',
    input: {},
    log: [],
    taskStatus: {},
    totalTried: 0,
    workflowSlug: 'testWorkflow',
  } as unknown as Job
  const loggerError = vi.fn()
  const req = {
    payload: {
      config: {
        jobs: {
          tasks,
        },
      },
      logger: {
        error: loggerError,
      },
    },
  } as unknown as PayloadRequest
  const updateJob = vi.fn(async () => job) as unknown as UpdateJobFunction
  const workflowConfig = {
    handler: () => undefined,
    slug: 'testWorkflow',
  } as WorkflowConfig

  return { job, loggerError, req, updateJob, workflowConfig }
}

function getLoggedError({
  loggerError,
}: {
  loggerError: ReturnType<typeof vi.fn>
}): TaskError | WorkflowError {
  const logEntry = loggerError.mock.calls[0]?.[0] as { err?: unknown } | undefined

  if (!(logEntry?.err instanceof Error)) {
    throw new Error('EXPECTED_JOB_ERROR_LOG_18055')
  }

  return logEntry.err as TaskError | WorkflowError
}

describe('job handler errors', () => {
  it('should preserve a task handler error stack and cause', async () => {
    let handlerError: Error | undefined
    function throwFromTaskHandler(): never {
      handlerError = new Error('task-handler-stack-marker-18055')
      throw handlerError
    }

    const taskConfig = {
      handler: throwFromTaskHandler,
      retries: 0,
      slug: 'failingTask',
    } as unknown as TaskConfig<string>
    const { job, loggerError, req, updateJob, workflowConfig } = createRunContext({
      tasks: [taskConfig],
    })

    await runJob({
      job,
      req,
      updateJob,
      workflowConfig,
      workflowHandler: async ({ tasks }) => {
        await tasks.failingTask!('task-id', { input: {} })
      },
    })

    const loggedError = getLoggedError({ loggerError })

    expect(loggedError).toBeInstanceOf(TaskError)
    expect(loggedError.stack, 'TASK_HANDLER_STACK_MISSING_18055').toContain(
      'throwFromTaskHandler',
    )
    expect(loggedError.cause).toBe(handlerError)
  })

  it('should preserve a workflow handler error stack and cause', async () => {
    let handlerError: Error | undefined
    function throwFromWorkflowHandler(): never {
      handlerError = new Error('workflow-handler-stack-marker-18055')
      throw handlerError
    }

    const { job, loggerError, req, updateJob, workflowConfig } = createRunContext({})

    await runJob({
      job,
      req,
      updateJob,
      workflowConfig,
      workflowHandler: throwFromWorkflowHandler,
    })

    const loggedError = getLoggedError({ loggerError })

    expect(loggedError).toBeInstanceOf(WorkflowError)
    expect(loggedError.stack, 'WORKFLOW_HANDLER_STACK_MISSING_18055').toContain(
      'throwFromWorkflowHandler',
    )
    expect(loggedError.cause).toBe(handlerError)
  })

  it('should preserve a JSON task handler error through the workflow wrapper', async () => {
    let handlerError: Error | undefined
    function throwFromJSONTaskHandler(): never {
      handlerError = new Error('json-task-handler-stack-marker-18055')
      throw handlerError
    }

    const taskConfig = {
      handler: throwFromJSONTaskHandler,
      retries: 0,
      slug: 'failingJSONTask',
    } as unknown as TaskConfig<string>
    const { job, loggerError, req, updateJob, workflowConfig } = createRunContext({
      tasks: [taskConfig],
    })
    const workflowHandler = [
      {
        id: 'json-task-id',
        input: () => ({}),
        task: 'failingJSONTask',
      },
    ] as unknown as WorkflowJSON

    await runJSONJob({
      job,
      req,
      updateJob,
      workflowConfig,
      workflowHandler,
    })

    const loggedError = getLoggedError({ loggerError })

    expect(loggedError).toBeInstanceOf(WorkflowError)
    expect(loggedError.stack, 'JSON_TASK_HANDLER_STACK_MISSING_18055').toContain(
      'throwFromJSONTaskHandler',
    )
    expect(loggedError.cause).toBeInstanceOf(TaskError)
    expect((loggedError.cause as TaskError).cause).toBe(handlerError)
  })

  it('should preserve a non-Error task handler throw as the cause', async () => {
    const taskConfig = {
      handler: () => Promise.reject(null),
      retries: 0,
      slug: 'failingNonErrorTask',
    } as unknown as TaskConfig<string>
    const { job, loggerError, req, updateJob, workflowConfig } = createRunContext({
      tasks: [taskConfig],
    })

    await runJob({
      job,
      req,
      updateJob,
      workflowConfig,
      workflowHandler: async ({ tasks }) => {
        await tasks.failingNonErrorTask!('task-id', { input: {} })
      },
    })

    const loggedError = getLoggedError({ loggerError })

    expect(loggedError).toBeInstanceOf(TaskError)
    expect(loggedError.message).toBe('Task handler threw an error')
    expect(loggedError.cause).toBeNull()
  })
})
