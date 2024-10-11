import type { PaginatedDocs } from '../../../database/types.js'
import type { PayloadRequest, Where } from '../../../types/index.js'
import type { BaseJob, WorkflowConfig, WorkflowTypes } from '../../config/types/workflowTypes.js'
import type { RunJobResult } from '../runJob/index.js'

import { Forbidden } from '../../../errors/Forbidden.js'
import { commitTransaction } from '../../../utilities/commitTransaction.js'
import { initTransaction } from '../../../utilities/initTransaction.js'
import isolateObjectProperty from '../../../utilities/isolateObjectProperty.js'
import { runJob } from '../runJob/index.js'

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

  // Find all jobs and ensure we set job to processing: true as early as possible to reduce the chance of
  // the same job being picked up by another worker
  const jobsQuery = (await req.payload.update({
    collection: 'payload-jobs',
    data: {
      processing: true,
      seenByWorker: true,
    },
    depth: req.payload.config.jobs.depth,
    //limit, // TODO: Add limit to req.payload.update call
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
          }, // TODO: Convert this to controlFlowInJSON once available
        }

    if (!workflowConfig) {
      return null // Skip jobs with no workflow configuration
    }

    const newReq = isolateObjectProperty(req, 'transactionID')
    delete newReq.transactionID
    // Create a transaction. While every tasks will initialize its own transaction later on, anything that
    // runs in between tasks within a JS workflow should be part of the same transaction
    await initTransaction(newReq)
    const result = await runJob({
      job,
      // Each job should have its own transaction. Can't have multiple running jobs in parallel on same transaction
      req: newReq,
      workflowConfig,
    })
    // Commit transaction
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
