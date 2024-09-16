import type { PaginatedDocs } from '../database/types.js'
import type { PayloadRequest, Where } from '../types/index.js'
import type { BaseJob, JobConfig } from './config/types.js'

import { createStepStatus } from './createStepStatus.js'
import { runStep } from './runStep.js'

export type RunJobsArgs = {
  limit?: number
  queue?: string
  req: PayloadRequest
}

export const runJobs = async ({ limit = 10, queue, req }: RunJobsArgs): Promise<boolean> => {
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
    depth: req.payload.config.queues.depth,
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
    return true
  }

  if (jobs.newJobs.length) {
    req.payload.logger.info(
      `${numJobs} job(s) found, ${jobs.newJobs.length} of which are new. Running ${limit} job(s).`,
    )
  }

  await Promise.all(
    jobsQuery.docs.map(async (job) => {
      const jobConfig = req.payload.config.queues.jobs.find(
        ({ slug }) => slug === job.type,
      ) as JobConfig

      if (!jobConfig) {
        return
      }

      const stepStatus = createStepStatus({ job, jobConfig })
      await runStep({ job, jobConfig, req, stepStatus })
    }),
  )

  return true
}
