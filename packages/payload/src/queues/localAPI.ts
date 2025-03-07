import type { BaseJob, RunningJobFromTask } from './config/types/workflowTypes.js'

import {
  createLocalReq,
  type Payload,
  type PayloadRequest,
  type RunningJob,
  type TypedJobs,
  type Where,
} from '../index.js'
import { jobsCollectionSlug } from './config/index.js'
import { runJobs } from './operations/runJobs/index.js'

export const getJobsLocalAPI = (payload: Payload) => ({
  queue: async <
    // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
    TTaskOrWorkflowSlug extends keyof TypedJobs['tasks'] | keyof TypedJobs['workflows'],
  >(
    args:
      | {
          input: TypedJobs['tasks'][TTaskOrWorkflowSlug]['input']
          queue?: string
          req?: PayloadRequest
          // TTaskOrWorkflowlug with keyof TypedJobs['workflows'] removed:
          task: TTaskOrWorkflowSlug extends keyof TypedJobs['tasks'] ? TTaskOrWorkflowSlug : never
          waitUntil?: Date
          workflow?: never
        }
      | {
          input: TypedJobs['workflows'][TTaskOrWorkflowSlug]['input']
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
      ? RunningJob<TTaskOrWorkflowSlug>
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

    const data: Partial<BaseJob> = {
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

    return (await payload.create({
      collection: jobsCollectionSlug,
      data,
      req: args.req,
    })) as TTaskOrWorkflowSlug extends keyof TypedJobs['workflows']
      ? RunningJob<TTaskOrWorkflowSlug>
      : RunningJobFromTask<TTaskOrWorkflowSlug> // Type assertion is still needed here
  },

  run: async (args?: {
    limit?: number
    overrideAccess?: boolean
    queue?: string
    req?: PayloadRequest
    where?: Where
  }): Promise<ReturnType<typeof runJobs>> => {
    const newReq: PayloadRequest = args?.req ?? (await createLocalReq({}, payload))

    return await runJobs({
      limit: args?.limit,
      overrideAccess: args?.overrideAccess !== false,
      queue: args?.queue,
      req: newReq,
      where: args?.where,
    })
  },

  runByID: async (args: {
    id: number | string
    overrideAccess?: boolean
    req?: PayloadRequest
  }): Promise<ReturnType<typeof runJobs>> => {
    const newReq: PayloadRequest = args.req ?? (await createLocalReq({}, payload))

    return await runJobs({
      id: args.id,
      overrideAccess: args.overrideAccess !== false,
      req: newReq,
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

    await payload.db.updateMany({
      collection: jobsCollectionSlug,
      data: {
        completedAt: null,
        error: {
          cancelled: true,
        },
        hasError: true,
        processing: false,
        waitUntil: null,
      } as Partial<
        {
          completedAt: null
          waitUntil: null
        } & BaseJob
      >,
      req: newReq,
      where: { and },
    })
  },

  cancelByID: async (args: {
    id: number | string
    overrideAccess?: boolean
    req?: PayloadRequest
  }): Promise<void> => {
    const newReq: PayloadRequest = args.req ?? (await createLocalReq({}, payload))

    await payload.db.updateOne({
      id: args.id,
      collection: jobsCollectionSlug,
      data: {
        completedAt: null,
        error: {
          cancelled: true,
        },
        hasError: true,
        processing: false,
        waitUntil: null,
      } as {
        completedAt: null
        waitUntil: null
      } & BaseJob,
      req: newReq,
    })
  },
})
