import type { PaginatedDocs } from '../../../database/types.js'
import type { PayloadRequest, Where } from '../../../types/index.js'
import type { WorkflowJSON } from '../../config/types/workflowJSONTypes.js'
import type {
  BaseJob,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowTypes,
} from '../../config/types/workflowTypes.js'
import type { RunJobResult } from '../runJob/index.js'

import { Forbidden } from '../../../errors/Forbidden.js'
import { getUpdateJobFunction } from '../runJob/getUpdateJobFunction.js'
import { importHandlerPath } from '../runJob/importHandlerPath.js'
import { runJob } from '../runJob/index.js'
import { runJSONJob } from '../runJSONJob/index.js'

export type RunAllJobsArgs = {
  limit?: number
  overrideAccess?: boolean
  queue?: string
  req: PayloadRequest
}

export type RunAllJobsResult = {
  jobStatus?: Record<string, RunJobResult>
  noJobsRemaining?: boolean
}

export const runAllJobs = async ({
  limit = 10,
  overrideAccess,
  queue,
  req,
}: RunAllJobsArgs): Promise<RunAllJobsResult> => {
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

  req.payload.logger.info({
    msg: `Querying for ${limit} jobs.`,
  })

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
    }
  }

  if (jobsQuery?.docs?.length) {
    req.payload.logger.info(
      `${jobsQuery.docs.length} job(s) found, ${newJobs.length} of which are new. Running ${limit} job(s).`,
    )
  }

  const jobPromises = jobsQuery.docs.map(async (job) => {
    if (!job.workflowSlug && !job.taskSlug) {
      throw new Error('Job must have either a workflowSlug or a taskSlug')
    }

    const workflowConfig: WorkflowConfig<WorkflowTypes> = job.workflowSlug
      ? req.payload.config.jobs.workflows.find(({ slug }) => slug === job.workflowSlug)
      : {
          slug: 'singleTask',
          handler: async ({ job, runTask }) => {
            await runTask({
              id: '1',
              input: job.input,
              task: job.taskSlug as string,
            })
          },
        }

    if (!workflowConfig) {
      return null // Skip jobs with no workflow configuration
    }

    const updateJob = getUpdateJobFunction(job, req)

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
        req,
        updateJob,
        workflowConfig,
        workflowHandler,
      })
      return { id: job.id, result }
    } else {
      const result = await runJSONJob({
        job,
        req,
        updateJob,
        workflowConfig,
        workflowHandler,
      })
      return { id: job.id, result }
    }
  })

  const resultsArray = await Promise.all(jobPromises)
  const resultsObject: RunAllJobsResult['jobStatus'] = resultsArray.reduce((acc, cur) => {
    if (cur !== null) {
      // Check if there's a valid result to include
      acc[cur.id] = cur.result
    }
    return acc
  }, {})

  let noJobsRemaining = true
  for (const jobID in resultsObject) {
    const jobResult = resultsObject[jobID]
    if (jobResult.status === 'error') {
      noJobsRemaining = false // Can be retried
    }
  }

  return {
    jobStatus: resultsObject,
    noJobsRemaining,
  }
}
