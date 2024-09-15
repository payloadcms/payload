import type { Endpoint } from '../config/types.js'
import type { RunJobsArgs } from './run.js'

import defaultAccess from '../auth/defaultAccess.js'
import { runJobs } from './run.js'

export const runJobsEndpoint: Endpoint = {
  handler: async (req) => {
    const access = req.payload.config.queues?.access?.run || defaultAccess
    const hasAccess = await access({ req })

    if (!hasAccess) {
      return Response.json(
        {
          message: req.i18n.t('error:unauthorized'),
        },
        { status: 401 },
      )
    }

    const { queue } = req.query

    const runJobsArgs: RunJobsArgs = {
      queue: 'default',
      req,
    }

    if (typeof queue === 'string') {
      runJobsArgs.queue = queue
    }

    try {
      await runJobs(runJobsArgs)
    } catch (err) {
      req.payload.logger.error({
        err,
        msg: 'There was an error running jobs:',
        queue: runJobsArgs.queue,
      })

      return Response.json(
        {
          message: req.i18n.t('error:unknown'),
        },
        { status: 500 },
      )
    }

    return Response.json(
      {
        message: req.i18n.t('general:success'),
      },
      { status: 200 },
    )
  },
  method: 'get',
  path: '/run',
}
