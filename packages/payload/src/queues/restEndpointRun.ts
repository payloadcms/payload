// @ts-strict-ignore
import type { Endpoint, SanitizedConfig } from '../config/types.js'

import { runJobs, type RunJobsArgs } from './operations/runJobs/index.js'

const configHasJobs = (config: SanitizedConfig): boolean => {
  if (!config.jobs) {
    return false
  }

  if (config.jobs.tasks.length > 0) {
    return true
  }
  if (Array.isArray(config.jobs.workflows) && config.jobs.workflows.length > 0) {
    return true
  }

  return false
}

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

    const { limit, queue } = req.query

    const runJobsArgs: RunJobsArgs = {
      queue: 'default',
      req,
      // We are checking access above, so we can override it here
      overrideAccess: true,
    }

    if (typeof queue === 'string') {
      runJobsArgs.queue = queue
    }

    if (typeof limit !== 'undefined') {
      runJobsArgs.limit = Number(limit)
    }

    let noJobsRemaining = false
    let remainingJobsFromQueried = 0
    try {
      const result = await runJobs(runJobsArgs)
      noJobsRemaining = result.noJobsRemaining
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
