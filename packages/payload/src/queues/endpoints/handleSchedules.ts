import type { Endpoint } from '../../config/types.js'

import { handleSchedules } from '../operations/handleSchedules/index.js'
import { configHasJobs } from './run.js'

/**
 * /api/payload-jobs/handleSchedules endpoint
 */
export const handleSchedulesJobsEndpoint: Endpoint = {
  handler: async (req) => {
    const jobsConfig = req.payload.config.jobs

    if (!configHasJobs(jobsConfig)) {
      return Response.json(
        {
          message: 'No jobs to schedule.',
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

    if (!jobsConfig.enabledStats) {
      return Response.json(
        {
          message:
            'The jobs stats global is not enabled, but is required to use the run endpoint with schedules.',
        },
        { status: 500 },
      )
    }

    await handleSchedules({ req })

    return Response.json(
      {
        message: req.i18n.t('general:success'),
      },
      { status: 200 },
    )
  },
  method: 'get',
  path: '/handleSchedules',
}
