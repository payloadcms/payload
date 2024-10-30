import type { PaginatedDocs } from '../../../database/types.js'
import type { PayloadRequest, Where } from '../../../types/index.js'
import type { WorkflowJSON } from '../../config/types/workflowJSONTypes.js'
import type {
  BaseJob,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowTypes,
} from '../../config/types/workflowTypes.js'
import type { RunJobResult } from './runJob/index.js'

import { Forbidden } from '../../../errors/Forbidden.js'
import isolateObjectProperty from '../../../utilities/isolateObjectProperty.js'
import { getUpdateJobFunction } from './runJob/getUpdateJobFunction.js'
import { importHandlerPath } from './runJob/importHandlerPath.js'
import { runJob } from './runJob/index.js'
import { runJSONJob } from './runJSONJob/index.js'

export type RunJobsArgs = {
  limit?: number
  overrideAccess?: boolean
  queue?: string
  req: PayloadRequest
}

export type RunJobsResult = {
  jobStatus?: Record<string, RunJobResult>
  /**
   * If this is false, there for sure are no jobs remaining, regardless of the limit
   */
  noJobsRemaining?: boolean
  /**
   * Out of the jobs that were queried & processed (within the set limit), how many are remaining and retryable?
   */
  remainingJobsFromQueried: number
}

export const runJobs = async ({
  limit = 10,
  overrideAccess,
  queue,
  req,
}: RunJobsArgs): Promise<RunJobsResult> => {
  if (!overrideAccess) {
    const hasAccess = await req.payload.config.jobs.access.run({ req })
    if (!hasAccess) {
      throw new Forbidden(req.t)
    }
  }
  const where: Where = {
    and: [
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
      {
        processing: {
          equals: false,
        },
      },
      {
        or: [
          {
            waitUntil: {
              exists: false,
            },
          },
          {
            waitUntil: {
              less_than: new Date().toISOString(),
            },
          },
        ],
      },
    ],
  }

  if (queue) {
    where.and.push({
      queue: {
        equals: queue,
      },
    })
  }

  // Find all jobs and ensure we set job to processing: true as early as possible to reduce the chance of
  // the same job being picked up by another worker
  const jobsQuery = (await req.payload.update({
    collection: 'payload-jobs',
    data: {
      processing: true,
      seenByWorker: true,
    },
    depth: req.payload.config.jobs.depth,
    disableTransaction: true,
    limit,
    showHiddenFields: true,
    where,
  })) as unknown as PaginatedDocs<BaseJob>

  /**
   * Just for logging purposes, we want to know how many jobs are new and how many are existing (= already been tried).
   * This is only for logs - in the end we still want to run all jobs, regardless of whether they are new or existing.
   */
  const { newJobs } = jobsQuery.docs.reduce(
    (acc, job) => {
      if (job.totalTried > 0) {
        acc.existingJobs.push(job)
      } else {
        acc.newJobs.push(job)
      }
      return acc
    },
    { existingJobs: [], newJobs: [] },
  )

  if (!jobsQuery.docs.length) {
    return {
      noJobsRemaining: true,
      remainingJobsFromQueried: 0,
    }
  }

  if (jobsQuery?.docs?.length) {
    req.payload.logger.info(`Running ${jobsQuery.docs.length} jobs.`)
  }

  const jobPromises = jobsQuery.docs.map(async (job) => {
    if (!job.workflowSlug && !job.taskSlug) {
      throw new Error('Job must have either a workflowSlug or a taskSlug')
    }
    const jobReq = isolateObjectProperty(req, 'transactionID')

    const workflowConfig: WorkflowConfig<WorkflowTypes> = job.workflowSlug
      ? req.payload.config.jobs.workflows.find(({ slug }) => slug === job.workflowSlug)
      : {
          slug: 'singleTask',
          handler: async ({ job, tasks }) => {
            await tasks[job.taskSlug as string]('1', {
              input: job.input,
            })
          },
        }

    if (!workflowConfig) {
      return null // Skip jobs with no workflow configuration
    }

    const updateJob = getUpdateJobFunction(job, jobReq)

    // the runner will either be passed to the config
    // OR it will be a path, which we will need to import via eval to avoid
    // Next.js compiler dynamic import expression errors
    let workflowHandler: WorkflowHandler<WorkflowTypes> | WorkflowJSON<WorkflowTypes>

    if (
      typeof workflowConfig.handler === 'function' ||
      (typeof workflowConfig.handler === 'object' && Array.isArray(workflowConfig.handler))
    ) {
      workflowHandler = workflowConfig.handler
    } else {
      workflowHandler = await importHandlerPath<typeof workflowHandler>(workflowConfig.handler)

      if (!workflowHandler) {
        const errorMessage = `Can't find runner while importing with the path ${workflowConfig.handler} in job type ${job.workflowSlug}.`
        req.payload.logger.error(errorMessage)

        await updateJob({
          error: {
            error: errorMessage,
          },
          hasError: true,
          processing: false,
        })

        return
      }
    }

    if (typeof workflowHandler === 'function') {
      const result = await runJob({
        job,
        req: jobReq,
        updateJob,
        workflowConfig,
        workflowHandler,
      })
      return { id: job.id, result }
    } else {
      const result = await runJSONJob({
        job,
        req: jobReq,
        updateJob,
        workflowConfig,
        workflowHandler,
      })
      return { id: job.id, result }
    }
  })

  const resultsArray = await Promise.all(jobPromises)
  const resultsObject: RunJobsResult['jobStatus'] = resultsArray.reduce((acc, cur) => {
    if (cur !== null) {
      // Check if there's a valid result to include
      acc[cur.id] = cur.result
    }
    return acc
  }, {})

  let remainingJobsFromQueried = 0
  for (const jobID in resultsObject) {
    const jobResult = resultsObject[jobID]
    if (jobResult.status === 'error') {
      remainingJobsFromQueried++ // Can be retried
    }
  }

  return {
    jobStatus: resultsObject,
    remainingJobsFromQueried,
  }
}
