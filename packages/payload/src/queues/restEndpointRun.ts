import type { Endpoint, SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { SanitizedJobsConfig } from './config/types/index.js'

import { type JobStats, jobStatsGlobalSlug } from './config/global.js'
import { handleSchedules } from './operations/handleSchedules/index.js'
import { runJobs, type RunJobsArgs } from './operations/runJobs/index.js'

/**
 * /api/payload-jobs/run endpoint
 */
export const runJobsEndpoint: Endpoint = {
  handler: async (req) => {
    const jobsConfig = req.payload.config.jobs

    if (!configHasJobs(jobsConfig)) {
      return Response.json(
        {
          message: 'No jobs to run.',
        },
        { status: 200 },
      )
    }

    const accessFn = jobsConfig.access?.run ?? (() => true)

    const hasAccess = await accessFn({ req })

    if (!hasAccess) {
      return Response.json(
        {
          message: req.i18n.t('error:unauthorized'),
        },
        { status: 401 },
      )
    }

    const {
      allQueues,
      handleSchedules: handleSchedulesParam,
      limit,
      queue,
    } = req.query as {
      allQueues?: boolean
      handleSchedules?: boolean
      limit?: number
      queue?: string
    }

    const shouldHandleSchedules =
      handleSchedulesParam &&
      !(typeof handleSchedulesParam === 'string' && handleSchedulesParam === 'false')

    if (shouldHandleSchedules) {
      if (!jobsConfig.enabledStats) {
        throw new Error(
          'The jobs stats global is not enabled, but is required to use the run endpoint with schedules.',
        )
      }
      await handleSchedules({ req })
    }

    const runJobsArgs: RunJobsArgs = {
      queue,
      req,
      // Access is validated above, so it's safe to override here
      overrideAccess: true,
    }

    if (typeof queue === 'string') {
      runJobsArgs.queue = queue
    }

    const parsedLimit = Number(limit)
    if (!isNaN(parsedLimit)) {
      runJobsArgs.limit = parsedLimit
    }

    if (allQueues && !(typeof allQueues === 'string' && allQueues === 'false')) {
      runJobsArgs.allQueues = true
    }

    let noJobsRemaining = false
    let remainingJobsFromQueried = 0
    try {
      const result = await runJobs(runJobsArgs)
      noJobsRemaining = !!result.noJobsRemaining
      remainingJobsFromQueried = result.remainingJobsFromQueried
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: 'There was an error running jobs:',
        queue: runJobsArgs.queue,
      })

      return Response.json(
        {
          message: req.i18n.t('error:unknown'),
          noJobsRemaining: true,
          remainingJobsFromQueried,
        },
        { status: 500 },
      )
    }

    return Response.json(
      {
        message: req.i18n.t('general:success'),
        noJobsRemaining,
        remainingJobsFromQueried,
      },
      { status: 200 },
    )
  },
  method: 'get',
  path: '/run',
}

const configHasJobs = (jobsConfig: SanitizedJobsConfig): boolean => {
  return Boolean(jobsConfig.tasks?.length || jobsConfig.workflows?.length)
}
