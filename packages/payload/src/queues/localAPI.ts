import type { BaseJob, RunningJobFromTask } from './config/types/workflowTypes.js'

import {
  createLocalReq,
  type Job,
  type Payload,
  type PayloadRequest,
  type Sort,
  type TypedJobs,
  type Where,
} from '../index.js'
import { jobAfterRead, jobsCollectionSlug } from './config/collection.js'
import { handleSchedules, type HandleSchedulesResult } from './operations/handleSchedules/index.js'
import { runJobs } from './operations/runJobs/index.js'
import { updateJob, updateJobs } from './utilities/updateJob.js'

export type RunJobsSilent =
  | {
      error?: boolean
      info?: boolean
    }
  | boolean
export const getJobsLocalAPI = (payload: Payload) => ({
  handleSchedules: async (args?: {
    /**
     * If you want to schedule jobs from all queues, set this to true.
     * If you set this to true, the `queue` property will be ignored.
     *
     * @default false
     */
    allQueues?: boolean
    // By default, schedule all queues - only scheduling jobs scheduled to be added to the `default` queue would not make sense
    // here, as you'd usually specify a different queue than `default` here, especially if this is used in combination with autorun.
    // The `queue` property for setting up schedules is required, and not optional.
    /**
     * If you want to only schedule jobs that are set to schedule in a specific queue, set this to the queue name.
     *
     * @default jobs from the `default` queue will be executed.
     */
    queue?: string
    req?: PayloadRequest
  }): Promise<HandleSchedulesResult> => {
    const newReq: PayloadRequest = args?.req ?? (await createLocalReq({}, payload))

    return await handleSchedules({
      allQueues: args?.allQueues,
      queue: args?.queue,
      req: newReq,
    })
  },
  queue: async <
    // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
    TTaskOrWorkflowSlug extends keyof TypedJobs['tasks'] | keyof TypedJobs['workflows'],
  >(
    args:
      | {
          input: TypedJobs['tasks'][TTaskOrWorkflowSlug]['input']
          meta?: BaseJob['meta']
          queue?: string
          req?: PayloadRequest
          // TTaskOrWorkflowlug with keyof TypedJobs['workflows'] removed:
          task: TTaskOrWorkflowSlug extends keyof TypedJobs['tasks'] ? TTaskOrWorkflowSlug : never
          waitUntil?: Date
          workflow?: never
        }
      | {
          input: TypedJobs['workflows'][TTaskOrWorkflowSlug]['input']
          meta?: BaseJob['meta']
          queue?: string
          req?: PayloadRequest
          task?: never
          waitUntil?: Date
          workflow: TTaskOrWorkflowSlug extends keyof TypedJobs['workflows']
            ? TTaskOrWorkflowSlug
            : never
        },
  ): Promise<
    TTaskOrWorkflowSlug extends keyof TypedJobs['workflows']
      ? Job<TTaskOrWorkflowSlug>
      : RunningJobFromTask<TTaskOrWorkflowSlug>
  > => {
    let queue: string | undefined = undefined

    // If user specifies queue, use that
    if (args.queue) {
      queue = args.queue
    } else if (args.workflow) {
      // Otherwise, if there is a workflow specified, and it has a default queue to use,
      // use that
      const workflow = payload.config.jobs?.workflows?.find(({ slug }) => slug === args.workflow)
      if (workflow?.queue) {
        queue = workflow.queue
      }
    }

    const data: Partial<Job> = {
      input: args.input,
    }

    if (queue) {
      data.queue = queue
    }
    if (args.waitUntil) {
      data.waitUntil = args.waitUntil?.toISOString()
    }
    if (args.workflow) {
      data.workflowSlug = args.workflow as string
    }
    if (args.task) {
      data.taskSlug = args.task as string
    }

    if (args.meta) {
      data.meta = args.meta
    }

    type ReturnType = TTaskOrWorkflowSlug extends keyof TypedJobs['workflows']
      ? Job<TTaskOrWorkflowSlug>
      : RunningJobFromTask<TTaskOrWorkflowSlug> // Type assertion is still needed here

    if (payload?.config?.jobs?.depth || payload?.config?.jobs?.runHooks) {
      return (await payload.create({
        collection: jobsCollectionSlug,
        data,
        depth: payload.config.jobs.depth ?? 0,
        req: args.req,
      })) as ReturnType
    } else {
      return jobAfterRead({
        config: payload.config,
        doc: await payload.db.create({
          collection: jobsCollectionSlug,
          data,
          req: args.req,
        }),
      }) as unknown as ReturnType
    }
  },

  run: async (args?: {
    /**
     * If you want to run jobs from all queues, set this to true.
     * If you set this to true, the `queue` property will be ignored.
     *
     * @default false
     */
    allQueues?: boolean
    /**
     * The maximum number of jobs to run in this invocation
     *
     * @default 10
     */
    limit?: number
    overrideAccess?: boolean
    /**
     * Adjust the job processing order using a Payload sort string.
     *
     * FIFO would equal `createdAt` and LIFO would equal `-createdAt`.
     */
    processingOrder?: Sort
    /**
     * If you want to run jobs from a specific queue, set this to the queue name.
     *
     * @default jobs from the `default` queue will be executed.
     */
    queue?: string
    req?: PayloadRequest
    /**
     * By default, jobs are run in parallel.
     * If you want to run them in sequence, set this to true.
     */
    sequential?: boolean
    /**
     * If set to true, the job system will not log any output to the console (for both info and error logs).
     * Can be an option for more granular control over logging.
     *
     * This will not automatically affect user-configured logs (e.g. if you call `console.log` or `payload.logger.info` in your job code).
     *
     * @default false
     */
    silent?: RunJobsSilent
    where?: Where
  }): Promise<ReturnType<typeof runJobs>> => {
    const newReq: PayloadRequest = args?.req ?? (await createLocalReq({}, payload))

    return await runJobs({
      allQueues: args?.allQueues,
      limit: args?.limit,
      overrideAccess: args?.overrideAccess !== false,
      processingOrder: args?.processingOrder,
      queue: args?.queue,
      req: newReq,
      sequential: args?.sequential,
      silent: args?.silent,
      where: args?.where,
    })
  },

  runByID: async (args: {
    id: number | string
    overrideAccess?: boolean
    req?: PayloadRequest
    /**
     * If set to true, the job system will not log any output to the console (for both info and error logs).
     * Can be an option for more granular control over logging.
     *
     * This will not automatically affect user-configured logs (e.g. if you call `console.log` or `payload.logger.info` in your job code).
     *
     * @default false
     */
    silent?: RunJobsSilent
  }): Promise<ReturnType<typeof runJobs>> => {
    const newReq: PayloadRequest = args.req ?? (await createLocalReq({}, payload))

    return await runJobs({
      id: args.id,
      overrideAccess: args.overrideAccess !== false,
      req: newReq,
      silent: args.silent,
    })
  },

  cancel: async (args: {
    overrideAccess?: boolean
    queue?: string
    req?: PayloadRequest
    where: Where
  }): Promise<void> => {
    const newReq: PayloadRequest = args.req ?? (await createLocalReq({}, payload))

    const and: Where[] = [
      args.where,
      {
        completedAt: {
          exists: false,
        },
      },
      {
        hasError: {
          not_equals: true,
        },
      },
    ]

    if (args.queue) {
      and.push({
        queue: {
          equals: args.queue,
        },
      })
    }

    await updateJobs({
      data: {
        completedAt: null,
        error: {
          cancelled: true,
        },
        hasError: true,
        processing: false,
        waitUntil: null,
      },
      depth: 0, // No depth, since we're not returning
      disableTransaction: true,
      req: newReq,
      returning: false,
      where: { and },
    })
  },

  cancelByID: async (args: {
    id: number | string
    overrideAccess?: boolean
    req?: PayloadRequest
  }): Promise<void> => {
    const newReq: PayloadRequest = args.req ?? (await createLocalReq({}, payload))

    await updateJob({
      id: args.id,
      data: {
        completedAt: null,
        error: {
          cancelled: true,
        },
        hasError: true,
        processing: false,
        waitUntil: null,
      },
      depth: 0, // No depth, since we're not returning
      disableTransaction: true,
      req: newReq,
      returning: false,
    })
  },
})
