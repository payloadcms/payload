import type { Job } from '../../../index.js'
import type { PayloadRequest, Sort, Where } from '../../../types/index.js'
import type { WorkflowJSON } from '../../config/types/workflowJSONTypes.js'
import type { WorkflowConfig, WorkflowHandler } from '../../config/types/workflowTypes.js'
import type { RunJobsSilent } from '../../localAPI.js'
import type { RunJobResult } from './runJob/index.js'

import { Forbidden } from '../../../errors/Forbidden.js'
import { isolateObjectProperty } from '../../../utilities/isolateObjectProperty.js'
import { jobsCollectionSlug } from '../../config/collection.js'
import { JobCancelledError } from '../../errors/index.js'
import { getCurrentDate } from '../../utilities/getCurrentDate.js'
import { updateJob, updateJobs } from '../../utilities/updateJob.js'
import { getUpdateJobFunction } from './runJob/getUpdateJobFunction.js'
import { importHandlerPath } from './runJob/importHandlerPath.js'
import { runJob } from './runJob/index.js'
import { runJSONJob } from './runJSONJob/index.js'

export type RunJobsArgs = {
  /**
   * If you want to run jobs from all queues, set this to true.
   * If you set this to true, the `queue` property will be ignored.
   *
   * @default false
   */
  allQueues?: boolean
  /**
   * ID of the job to run
   */
  id?: number | string
  /**
   * The maximum number of jobs to run in this invocation
   *
   * @default 10
   */
  limit?: number
  overrideAccess?: boolean
  /**
   * Adjust the job processing order
   *
   * FIFO would equal `createdAt` and LIFO would equal `-createdAt`.
   *
   * @default all jobs for all queues will be executed in FIFO order.
   */
  processingOrder?: Sort
  /**
   * If you want to run jobs from a specific queue, set this to the queue name.
   *
   * @default jobs from the `default` queue will be executed.
   */
  queue?: string
  req: PayloadRequest
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
}

export type RunJobsResult = {
  jobStatus?: Record<string, RunJobResult>
  /**
   * If this is true, there for sure are no jobs remaining, regardless of the limit
   */
  noJobsRemaining?: boolean
  /**
   * Out of the jobs that were queried & processed (within the set limit), how many are remaining and retryable?
   */
  remainingJobsFromQueried: number
}

export const runJobs = async (args: RunJobsArgs): Promise<RunJobsResult> => {
  const {
    id,
    allQueues = false,
    limit = 10,
    overrideAccess,
    processingOrder,
    queue = 'default',
    req,
    req: {
      payload,
      payload: {
        config: { jobs: jobsConfig },
      },
    },
    sequential,
    silent = false,
    where: whereFromProps,
  } = args

  if (!overrideAccess) {
    /**
     * By default, jobsConfig.access.run will be `defaultAccess` which is a function that returns `true` if the user is logged in.
     */
    const accessFn = jobsConfig?.access?.run ?? (() => true)
    const hasAccess = await accessFn({ req })
    if (!hasAccess) {
      throw new Forbidden(req.t)
    }
  }
  const and: Where[] = [
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
            less_than: getCurrentDate().toISOString(),
          },
        },
      ],
    },
  ]

  if (allQueues !== true) {
    and.push({
      queue: {
        equals: queue ?? 'default',
      },
    })
  }

  if (whereFromProps) {
    and.push(whereFromProps)
  }

  // Only enforce concurrency controls if the feature is enabled
  if (jobsConfig.enableConcurrencyControl) {
    // Find currently running jobs with concurrency keys to enforce exclusive concurrency
    // Jobs with the same concurrencyKey should not run in parallel
    const runningJobsWithConcurrency = await payload.db.find({
      collection: jobsCollectionSlug,
      limit: 0,
      pagination: false,
      req: { transactionID: undefined },
      select: {
        concurrencyKey: true,
      },
      where: {
        and: [{ processing: { equals: true } }, { concurrencyKey: { exists: true } }],
      },
    })

    const runningConcurrencyKeys = new Set<string>()
    if (runningJobsWithConcurrency?.docs) {
      for (const doc of runningJobsWithConcurrency.docs) {
        const concurrencyKey = (doc as Job).concurrencyKey
        if (concurrencyKey) {
          runningConcurrencyKeys.add(concurrencyKey)
        }
      }
    }

    // Exclude jobs whose concurrencyKey is already running
    if (runningConcurrencyKeys.size > 0) {
      and.push({
        or: [
          // Jobs without a concurrency key can always run
          { concurrencyKey: { exists: false } },
          // Jobs with a concurrency key that is not currently running can run
          { concurrencyKey: { not_in: [...runningConcurrencyKeys] } },
        ],
      })
    }
  }

  // Find all jobs and ensure we set job to processing: true as early as possible to reduce the chance of
  // the same job being picked up by another worker
  let jobs: Job[] = []

  if (id) {
    // Only one job to run
    const job = await updateJob({
      id,
      data: {
        processing: true,
      },
      depth: jobsConfig.depth,
      disableTransaction: true,
      req,
      returning: true,
    })
    if (job) {
      jobs = [job]
    }
  } else {
    let defaultProcessingOrder: Sort =
      payload.collections[jobsCollectionSlug]?.config.defaultSort ?? 'createdAt'

    const processingOrderConfig = jobsConfig.processingOrder
    if (typeof processingOrderConfig === 'function') {
      defaultProcessingOrder = await processingOrderConfig(args)
    } else if (typeof processingOrderConfig === 'object' && !Array.isArray(processingOrderConfig)) {
      if (
        !allQueues &&
        queue &&
        processingOrderConfig.queues &&
        processingOrderConfig.queues[queue]
      ) {
        defaultProcessingOrder = processingOrderConfig.queues[queue]
      } else if (processingOrderConfig.default) {
        defaultProcessingOrder = processingOrderConfig.default
      }
    } else if (typeof processingOrderConfig === 'string') {
      defaultProcessingOrder = processingOrderConfig
    }
    const updatedDocs = await updateJobs({
      data: {
        processing: true,
      },
      depth: jobsConfig.depth,
      disableTransaction: true,
      limit,
      req,
      returning: true,
      sort: processingOrder ?? defaultProcessingOrder,
      where: { and },
    })

    if (updatedDocs) {
      jobs = updatedDocs
    }
  }

  if (!jobs.length) {
    return {
      noJobsRemaining: true,
      remainingJobsFromQueried: 0,
    }
  }

  // Only handle concurrency deduplication if the feature is enabled
  if (jobsConfig.enableConcurrencyControl) {
    // Handle the case where multiple jobs with the same concurrencyKey were picked up in the same batch
    // We should only run one job per concurrencyKey, release the others back to pending
    const seenConcurrencyKeys = new Set<string>()
    const jobsToRun: Job[] = []
    const jobsToRelease: Job[] = []

    for (const job of jobs) {
      if (job.concurrencyKey) {
        if (seenConcurrencyKeys.has(job.concurrencyKey)) {
          // This job has the same concurrencyKey as another job we're already running
          jobsToRelease.push(job)
        } else {
          seenConcurrencyKeys.add(job.concurrencyKey)
          jobsToRun.push(job)
        }
      } else {
        jobsToRun.push(job)
      }
    }

    // Release duplicate concurrencyKey jobs back to pending state
    if (jobsToRelease.length > 0) {
      const releaseIds = jobsToRelease.map((job) => job.id)
      await updateJobs({
        data: { processing: false },
        disableTransaction: true,
        req,
        returning: false,
        where: { id: { in: releaseIds } },
      })
    }

    // Use only the filtered jobs going forward
    jobs = jobsToRun
  }

  if (!jobs.length) {
    return {
      noJobsRemaining: false,
      remainingJobsFromQueried: 0,
    }
  }

  /**
   * Just for logging purposes, we want to know how many jobs are new and how many are existing (= already been tried).
   * This is only for logs - in the end we still want to run all jobs, regardless of whether they are new or existing.
   */
  const { existingJobs, newJobs } = jobs.reduce(
    (acc, job) => {
      if (job.totalTried > 0) {
        acc.existingJobs.push(job)
      } else {
        acc.newJobs.push(job)
      }
      return acc
    },
    { existingJobs: [] as Job[], newJobs: [] as Job[] },
  )

  if (!silent || (typeof silent === 'object' && !silent.info)) {
    payload.logger.info({
      msg: `Running ${jobs.length} jobs.`,
      new: newJobs?.length,
      retrying: existingJobs?.length,
    })
  }

  const successfullyCompletedJobs: (number | string)[] = []

  const runSingleJob = async (
    job: Job,
  ): Promise<{
    id: number | string
    result: RunJobResult
  }> => {
    if (!job.workflowSlug && !job.taskSlug) {
      throw new Error('Job must have either a workflowSlug or a taskSlug')
    }
    const jobReq = isolateObjectProperty(req, 'transactionID')

    const workflowConfig: WorkflowConfig =
      job.workflowSlug && jobsConfig.workflows?.length
        ? jobsConfig.workflows.find(({ slug }) => slug === job.workflowSlug)!
        : {
            slug: 'singleTask',
            handler: async ({ job, tasks }) => {
              await tasks[job.taskSlug as string]!('1', {
                input: job.input,
              })
            },
          }

    if (!workflowConfig) {
      return {
        id: job.id,
        result: {
          status: 'error',
        },
      } // Skip jobs with no workflow configuration
    }

    try {
      const updateJob = getUpdateJobFunction(job, jobReq)

      // the runner will either be passed to the config
      // OR it will be a path, which we will need to import via eval to avoid
      // Next.js compiler dynamic import expression errors
      let workflowHandler: WorkflowHandler | WorkflowJSON
      if (
        typeof workflowConfig.handler === 'function' ||
        (typeof workflowConfig.handler === 'object' && Array.isArray(workflowConfig.handler))
      ) {
        workflowHandler = workflowConfig.handler
      } else {
        workflowHandler = await importHandlerPath<typeof workflowHandler>(workflowConfig.handler)

        if (!workflowHandler) {
          const jobLabel = job.workflowSlug || `Task: ${job.taskSlug}`
          const errorMessage = `Can't find runner while importing with the path ${workflowConfig.handler} in job type ${jobLabel}.`
          if (!silent || (typeof silent === 'object' && !silent.error)) {
            payload.logger.error(errorMessage)
          }

          await updateJob({
            error: {
              error: errorMessage,
            },
            hasError: true,
            processing: false,
          })

          return {
            id: job.id,
            result: {
              status: 'error-reached-max-retries',
            },
          }
        }
      }

      if (typeof workflowHandler === 'function') {
        const result = await runJob({
          job,
          req: jobReq,
          silent,
          updateJob,
          workflowConfig,
          workflowHandler,
        })

        if (result.status === 'success') {
          successfullyCompletedJobs.push(job.id)
        }

        return { id: job.id, result }
      } else {
        const result = await runJSONJob({
          job,
          req: jobReq,
          silent,
          updateJob,
          workflowConfig,
          workflowHandler,
        })

        if (result.status === 'success') {
          successfullyCompletedJobs.push(job.id)
        }

        return { id: job.id, result }
      }
    } catch (error) {
      if (error instanceof JobCancelledError) {
        if (
          !(job.error as Record<string, unknown> | undefined)?.cancelled ||
          !job.hasError ||
          job.processing ||
          job.completedAt ||
          job.waitUntil
        ) {
          // When using the local API to cancel jobs, the local API will update the job data for us to ensure the job is cancelled.
          // But when throwing a JobCancelledError within a task or workflow handler, we are responsible for updating the job data ourselves.
          await updateJob({
            id: job.id,
            data: {
              completedAt: null,
              error: {
                cancelled: true,
                message: error.message,
              },
              hasError: true,
              processing: false,
              waitUntil: null,
            },
            depth: 0,
            disableTransaction: true,
            req,
            returning: false,
          })
        }

        return {
          id: job.id,
          result: {
            status: 'error-reached-max-retries',
          },
        }
      }
      throw error
    }
  }

  let resultsArray: { id: number | string; result: RunJobResult }[] = []
  if (sequential) {
    for (const job of jobs) {
      const result = await runSingleJob(job)
      if (result) {
        resultsArray.push(result)
      }
    }
  } else {
    const jobPromises = jobs.map(runSingleJob)
    resultsArray = (await Promise.all(jobPromises)) as {
      id: number | string
      result: RunJobResult
    }[]
  }

  if (jobsConfig.deleteJobOnComplete && successfullyCompletedJobs.length) {
    try {
      if (jobsConfig.runHooks) {
        await payload.delete({
          collection: jobsCollectionSlug,
          depth: 0, // can be 0 since we're not returning anything
          disableTransaction: true,
          where: { id: { in: successfullyCompletedJobs } },
        })
      } else {
        await payload.db.deleteMany({
          collection: jobsCollectionSlug,
          where: { id: { in: successfullyCompletedJobs } },
        })
      }
    } catch (err) {
      if (!silent || (typeof silent === 'object' && !silent.error)) {
        payload.logger.error({
          err,
          msg: `Failed to delete jobs ${successfullyCompletedJobs.join(', ')} on complete`,
        })
      }
    }
  }

  const resultsObject: RunJobsResult['jobStatus'] = resultsArray.reduce(
    (acc, cur) => {
      if (cur !== null) {
        // Check if there's a valid result to include
        acc[cur.id] = cur.result
      }
      return acc
    },
    {} as Record<string, RunJobResult>,
  )

  let remainingJobsFromQueried = 0
  for (const jobID in resultsObject) {
    const jobResult = resultsObject[jobID]
    if (jobResult?.status === 'error') {
      remainingJobsFromQueried++ // Can be retried
    }
  }

  return {
    jobStatus: resultsObject,
    remainingJobsFromQueried,
  }
}
