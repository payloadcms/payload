import { v4 as uuid } from 'uuid'

import type { Job } from '../../../index.js'
import type { PayloadRequest, Sort, Where } from '../../../types/index.js'
import type { SanitizedJobsConfig } from '../../config/types/index.js'
import type { RetryConfig } from '../../config/types/taskTypes.js'
import type { WorkflowJSON } from '../../config/types/workflowJSONTypes.js'
import type { WorkflowConfig, WorkflowHandler } from '../../config/types/workflowTypes.js'
import type { RunJobsSilent } from '../../localAPI.js'
import type { RunJobResult } from './runJob/index.js'

import { Forbidden } from '../../../errors/Forbidden.js'
import { isolateObjectProperty } from '../../../utilities/isolateObjectProperty.js'
import { jobsCollectionSlug } from '../../config/collection.js'
import { calculateBackoffWaitUntil } from '../../errors/calculateBackoffWaitUntil.js'
import { JobCancelledError, JobLeaseLostError } from '../../errors/index.js'
import { getCurrentDate } from '../../utilities/getCurrentDate.js'
import { updateJobs } from '../../utilities/updateJob.js'
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
  const now = getCurrentDate()
  const { duration: processingLeaseDuration, safetyBuffer: processingLeaseSafetyBuffer } =
    jobsConfig.processingLease
  const processingToken = uuid()
  const scope: Where[] = [
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

  if (!id && allQueues !== true) {
    scope.push({
      queue: {
        equals: queue ?? 'default',
      },
    })
  }

  if (whereFromProps) {
    scope.push(whereFromProps)
  }

  if (id) {
    scope.push({ id: { equals: id } })
  }

  await recoverExpiredJobs({
    jobsConfig,
    limit: id ? 1 : limit,
    now,
    req,
    scope,
  })

  const and: Where[] = [
    ...scope,
    { processingUntil: { exists: false } },
    {
      or: [{ waitUntil: { exists: false } }, { waitUntil: { less_than_equal: now.toISOString() } }],
    },
  ]
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
        and: [
          { processingUntil: { greater_than: now.toISOString() } },
          { concurrencyKey: { exists: true } },
        ],
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

  let jobs: Job[] = []

  if (id) {
    const updatedDocs = await updateJobs({
      data: {
        processingToken,
        processingUntil: new Date(
          getCurrentDate().getTime() + processingLeaseDuration,
        ).toISOString(),
      },
      limit: 1,
      req,
      returning: true,
      where: { and },
    })
    if (updatedDocs) {
      jobs = updatedDocs
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
        processingToken,
        processingUntil: new Date(
          getCurrentDate().getTime() + processingLeaseDuration,
        ).toISOString(),
      },
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
        data: { processingToken: null, processingUntil: null },
        req,
        returning: false,
        where: {
          and: [
            { id: { in: releaseIds } },
            { processingToken: { equals: processingToken } },
            {
              processingUntil: {
                greater_than: new Date(
                  getCurrentDate().getTime() + processingLeaseSafetyBuffer,
                ).toISOString(),
              },
            },
          ],
        },
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

  if (!silent || (typeof silent === 'object' && !silent.info)) {
    let newCount = 0
    let retryCount = 0

    for (const job of jobs) {
      if (job.totalTried > 0) {
        retryCount++
      } else {
        newCount++
      }
    }

    payload.logger.info({
      msg: `Running ${jobs.length} jobs.`,
      new: newCount,
      retrying: retryCount,
    })
  }

  type SingleJobResult = {
    id: number | string
    result: RunJobResult
  }

  const successfullyCompletedJobs: { completedAt: string; id: number | string }[] = []

  const runSingleJob = async (job: Job): Promise<SingleJobResult> => {
    if (!job.workflowSlug && !job.taskSlug) {
      throw new Error('Job must have either a workflowSlug or a taskSlug')
    }
    const jobReq = isolateObjectProperty(req, 'transactionID')
    const updateClaimedJob = getUpdateJobFunction(job, jobReq)

    let workflowConfig: undefined | WorkflowConfig = undefined

    if (job.workflowSlug && jobsConfig.workflows?.length) {
      workflowConfig = jobsConfig.workflows.find(({ slug }) => slug === job.workflowSlug)
    } else if (job.taskSlug && jobsConfig.tasks?.length) {
      const taskExists = jobsConfig.tasks.some(({ slug }) => slug === job.taskSlug)
      if (taskExists) {
        workflowConfig = {
          slug: 'singleTask',
          handler: async ({ job, tasks }) => {
            await tasks[job.taskSlug as string]!('1', {
              input: job.input,
            })
          },
        }
      }
    }

    if (!workflowConfig) {
      // Permanently fail jobs whose task/workflow slug is no longer registered in config — they can never complete.
      const errorMessage = `${job.taskSlug ? `Task '${job.taskSlug}'` : `Workflow '${job.workflowSlug}'`} is not registered in payload.config.jobs.`

      if (!silent || (typeof silent === 'object' && !silent.error)) {
        payload.logger.error({
          msg: `Error running job ${job.workflowSlug || `Task: ${job.taskSlug}`} id: ${job.id} - ${errorMessage}`,
        })
      }

      await updateClaimedJob({
        error: { message: errorMessage },
        hasError: true,
        processingUntil: null,
        totalTried: (job.totalTried ?? 0) + 1,
      })

      return {
        id: job.id,
        result: {
          status: 'error-reached-max-retries',
        },
      }
    }

    try {
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

          await updateClaimedJob({
            error: {
              error: errorMessage,
            },
            hasError: true,
            processingUntil: null,
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
          updateJob: updateClaimedJob,
          workflowConfig,
          workflowHandler,
        })

        if (result.status === 'success' && job.completedAt) {
          successfullyCompletedJobs.push({ id: job.id, completedAt: job.completedAt })
        }

        return { id: job.id, result }
      } else {
        const result = await runJSONJob({
          job,
          req: jobReq,
          silent,
          updateJob: updateClaimedJob,
          workflowConfig,
          workflowHandler,
        })

        if (result.status === 'success' && job.completedAt) {
          successfullyCompletedJobs.push({ id: job.id, completedAt: job.completedAt })
        }

        return { id: job.id, result }
      }
    } catch (error) {
      if (error instanceof JobLeaseLostError) {
        throw error
      }
      if (error instanceof JobCancelledError) {
        if (
          !(job.error as Record<string, unknown> | undefined)?.cancelled ||
          !job.hasError ||
          job.processingUntil ||
          job.completedAt ||
          job.waitUntil
        ) {
          // When using the local API to cancel jobs, the local API will update the job data for us to ensure the job is cancelled.
          // But when throwing a JobCancelledError within a task or workflow handler, we are responsible for updating the job data ourselves.
          await updateClaimedJob({
            completedAt: null,
            error: {
              cancelled: true,
              message: error.message,
            },
            hasError: true,
            processingUntil: null,
            waitUntil: null,
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

  const activeClaims = new Set(jobs.map((job) => job.id))
  const stopHeartbeat = startProcessingLeaseHeartbeat({
    activeClaims,
    processingLeaseDuration,
    processingLeaseSafetyBuffer,
    processingToken,
    req,
    silent,
  })
  const runSingleJobWithLease = async (job: Job): Promise<null | SingleJobResult> => {
    try {
      return await runSingleJob(job)
    } catch (error) {
      if (error instanceof JobLeaseLostError) {
        if (!silent || (typeof silent === 'object' && !silent.error)) {
          payload.logger.warn({
            msg: `Stopped running job ${job.id} because its processing lease was lost.`,
          })
        }
        return null
      }
      throw error
    } finally {
      activeClaims.delete(job.id)
    }
  }

  let resultsArray: SingleJobResult[] = []
  try {
    if (sequential) {
      for (const job of jobs) {
        const result = await runSingleJobWithLease(job)
        if (result) {
          resultsArray.push(result)
        }
      }
    } else {
      const jobPromises = jobs.map(runSingleJobWithLease)
      resultsArray = (await Promise.all(jobPromises)).filter(
        (result): result is SingleJobResult => result !== null,
      )
    }
  } finally {
    stopHeartbeat()
  }

  if (jobsConfig.deleteJobOnComplete && successfullyCompletedJobs.length) {
    try {
      await payload.db.deleteMany({
        collection: jobsCollectionSlug,
        where: {
          or: successfullyCompletedJobs.map(({ id, completedAt }): Where => {
            const and: Where[] = [{ id: { equals: id } }, { completedAt: { equals: completedAt } }]
            return { and }
          }),
        },
      })
    } catch (err) {
      if (!silent || (typeof silent === 'object' && !silent.error)) {
        payload.logger.error({
          err,
          msg: `Failed to delete jobs ${successfullyCompletedJobs.map(({ id }) => id).join(', ')} on complete`,
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

async function recoverExpiredJobs({
  jobsConfig,
  limit,
  now,
  req,
  scope,
}: {
  jobsConfig: SanitizedJobsConfig
  limit: number
  now: Date
  req: PayloadRequest
  scope: Where[]
}): Promise<void> {
  const expiredJobs = await req.payload.db.find({
    collection: jobsCollectionSlug,
    limit,
    pagination: false,
    req,
    where: {
      and: [
        ...scope,
        { processingUntil: { exists: true } },
        { processingUntil: { less_than_equal: now.toISOString() } },
      ],
    },
  })

  await Promise.all(
    (expiredJobs.docs as Job[]).map(async (job) => {
      if (!job.processingUntil) {
        return
      }

      const retriesConfig = getRetriesConfig({ job, jobsConfig })
      const maxRetries =
        typeof retriesConfig === 'object' ? (retriesConfig.attempts ?? 0) : (retriesConfig ?? 0)
      const hasFinalError = job.totalTried >= maxRetries
      let waitUntil: null | string = null

      if (!hasFinalError && retriesConfig) {
        const calculatedWaitUntil = calculateBackoffWaitUntil({
          currentDate: new Date(job.processingUntil),
          retriesConfig,
          totalTried: job.totalTried,
        })

        if (calculatedWaitUntil > now) {
          waitUntil = calculatedWaitUntil.toISOString()
        }
      }

      const error = {
        name: 'JobProcessingTimeoutError',
        message: `Job processing lease expired at ${job.processingUntil}`,
      }

      const processingTokenCondition = job.processingToken
        ? { processingToken: { equals: job.processingToken } }
        : { processingToken: { exists: false } }
      await updateJobs({
        data: {
          error: hasFinalError ? error : null,
          hasError: hasFinalError,
          processingToken: null,
          processingUntil: null,
          totalTried: (job.totalTried ?? 0) + 1,
          waitUntil,
        },
        limit: 1,
        req,
        returning: false,
        where: {
          and: [
            { id: { equals: job.id } },
            processingTokenCondition,
            { processingUntil: { equals: job.processingUntil } },
            { processingUntil: { less_than_equal: now.toISOString() } },
          ],
        },
      })
    }),
  )
}

function getRetriesConfig({
  job,
  jobsConfig,
}: {
  job: Job
  jobsConfig: SanitizedJobsConfig
}): number | RetryConfig | undefined {
  if (job.taskSlug) {
    return jobsConfig.tasks?.find(({ slug }) => slug === job.taskSlug)?.retries
  }

  return jobsConfig.workflows?.find(({ slug }) => slug === job.workflowSlug)?.retries
}

function startProcessingLeaseHeartbeat({
  activeClaims,
  processingLeaseDuration,
  processingLeaseSafetyBuffer,
  processingToken,
  req,
  silent,
}: {
  activeClaims: Set<number | string>
  processingLeaseDuration: number
  processingLeaseSafetyBuffer: number
  processingToken: string
  req: PayloadRequest
  silent: RunJobsSilent
}): () => void {
  const heartbeatInterval = Math.max(Math.floor(processingLeaseDuration / 3), 1)
  let isStopped = false
  let timeout: ReturnType<typeof setTimeout> | undefined

  const scheduleHeartbeat = () => {
    if (isStopped || activeClaims.size === 0) {
      return
    }

    timeout = setTimeout(() => {
      void renewLeases().finally(scheduleHeartbeat)
    }, heartbeatInterval)
    timeout.unref?.()
  }

  const renewLeases = async () => {
    const now = getCurrentDate()
    const minimumProcessingUntil = new Date(
      now.getTime() + processingLeaseSafetyBuffer,
    ).toISOString()
    const processingUntil = new Date(now.getTime() + processingLeaseDuration).toISOString()

    try {
      await updateJobs({
        data: { processingUntil },
        req,
        returning: false,
        where: {
          and: [
            { id: { in: [...activeClaims] } },
            { completedAt: { exists: false } },
            { hasError: { not_equals: true } },
            { processingToken: { equals: processingToken } },
            { processingUntil: { greater_than: minimumProcessingUntil } },
          ],
        },
      })
    } catch (error) {
      if (!silent || (typeof silent === 'object' && !silent.error)) {
        req.payload.logger.error({
          err: error,
          msg: 'Failed to renew job processing leases',
        })
      }
    }
  }

  scheduleHeartbeat()

  return () => {
    isStopped = true
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}
