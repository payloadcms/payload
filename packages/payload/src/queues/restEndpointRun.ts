import type { Endpoint, SanitizedConfig } from '../config/types.js'

import { runJobs, type RunJobsArgs } from './operations/runJobs/index.js'

export const runJobsEndpoint: Endpoint = {
  handler: async (req) => {
    if (!configHasJobs(req.payload.config)) {
      return Response.json(
        {
          message: 'No jobs to run.',
        },
        { status: 200 },
      )
    }

    const hasAccess = await req.payload.config.jobs.access.run({ req })

    if (!hasAccess) {
      return Response.json(
        {
          message: req.i18n.t('error:unauthorized'),
        },
        { status: 401 },
      )
    }

    const { allQueues, limit, queue } = req.query as {
      allQueues?: boolean
      limit?: number
      queue?: string
    }

    if (req?.payload?.config?.jobs?.scheduler === 'runEndpoint') {
      await handleSchedules()
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

const configHasJobs = (config: SanitizedConfig): boolean => {
  return Boolean(config.jobs?.tasks?.length || config.jobs?.workflows?.length)
}

/**
 * On vercel, we cannot auto-schedule jobs using a Cron - instead, we'll use this same endpoint that can
 * also be called from Vercel Cron for auto-running jobs.
 *
 * The benefit of doing it like this instead of a separate endpoint is that we can run jobs immediately
 * after they are scheduled
 */
async function handleSchedules() {}
