import type { PaginatedDocs } from '../database/types.js'
import type { PayloadRequest, Where } from '../types/index.js'
import type { BaseJob } from './config/workflowTypes.js'
import type { RunJobResult } from './runJob/index.js'

import { Forbidden } from '../errors/Forbidden.js'
import { commitTransaction } from '../utilities/commitTransaction.js'
import { initTransaction } from '../utilities/initTransaction.js'
import isolateObjectProperty from '../utilities/isolateObjectProperty.js'
import { getJobStatus } from './getJobStatus.js'
import { runJob } from './runJob/index.js'

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
              less_than: new Date(),
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

  const jobsQuery = (await req.payload.find({
    collection: 'payload-jobs',
    depth: req.payload.config.jobs.depth,
    limit,
    showHiddenFields: true,
    where,
  })) as unknown as PaginatedDocs<BaseJob>

  const jobs = jobsQuery.docs.reduce(
    (acc, job) => {
      if (job.seenByWorker) {
        acc.existingJobs.push(job)
      } else {
        acc.newJobs.push(job)
      }
      return acc
    },
    { existingJobs: [], newJobs: [] },
  )

  const numJobs = jobsQuery.totalDocs

  if (!numJobs) {
    return {
      noJobsRemaining: true,
    }
  }

  if (jobs.newJobs.length) {
    req.payload.logger.info(
      `${numJobs} job(s) found, ${jobs.newJobs.length} of which are new. Running ${limit} job(s).`,
    )
  }

  const jobPromises = jobsQuery.docs.map(async (job) => {
    const workflowConfig = req.payload.config.jobs.workflows.find(
      ({ slug }) => slug === job.workflowSlug,
    )
    if (!workflowConfig) {
      return null // Skip jobs with no workflow configuration
    }

    const newReq = isolateObjectProperty(req, 'transactionID')
    // Create a transaction so that all seeding happens in one transaction
    await initTransaction(newReq)
    const result = await runJob({
      job,
      jobTasksStatus: getJobStatus({
        job,
        tasksConfig: req.payload.config.jobs.tasks,
      }),
      // Each job should have its own transaction. Can't have multiple running jobs in parallel on same transaction
      req: newReq,
      workflowConfig,
    })
    // Finalise transactiojn
    await commitTransaction(newReq)
    return { id: job.id, result }
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
