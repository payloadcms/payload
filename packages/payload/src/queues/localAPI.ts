import type { RunningJobFromTask } from './config/types/workflowTypes.js'

import {
  createLocalReq,
  type Payload,
  type PayloadRequest,
  type RunningJob,
  type TypedJobs,
  type Where,
} from '../index.js'
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
          workflow?: never
        }
      | {
          input: TypedJobs['workflows'][TTaskOrWorkflowSlug]['input']
          queue?: string
          req?: PayloadRequest
          task?: never
          workflow: TTaskOrWorkflowSlug extends keyof TypedJobs['workflows']
            ? TTaskOrWorkflowSlug
            : never
        },
  ): Promise<
    TTaskOrWorkflowSlug extends keyof TypedJobs['workflows']
      ? RunningJob<TTaskOrWorkflowSlug>
      : RunningJobFromTask<TTaskOrWorkflowSlug>
  > => {
    let queue: string

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

    return (await payload.create({
      collection: 'payload-jobs',
      data: {
        input: args.input,
        queue,
        taskSlug: 'task' in args ? args.task : undefined,
        workflowSlug: 'workflow' in args ? args.workflow : undefined,
      },
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
    const result = await runJobs({
      limit: args?.limit,
      overrideAccess: args?.overrideAccess !== false,
      queue: args?.queue,
      req: newReq,
      where: args?.where,
    })
    return result
  },

  runByID: async (args: {
    id: number | string
    overrideAccess?: boolean
    req?: PayloadRequest
  }): Promise<ReturnType<typeof runJobs>> => {
    const newReq: PayloadRequest = args?.req ?? (await createLocalReq({}, payload))
    const result = await runJobs({
      id: args.id,
      overrideAccess: args?.overrideAccess !== false,
      req: newReq,
    })
    return result
  },
})
