import { getPayload } from 'payload'
import { jobSystemGlobals } from 'payload/internal'

import config from './config.crashWorker.js'

const jobID = JSON.parse(process.argv[2] ?? 'null') as null | number | string

if (jobID === null) {
  throw new Error('A job ID is required')
}

jobSystemGlobals.shouldAutoRun = false
jobSystemGlobals.shouldAutoSchedule = false

const payload = await getPayload({ config, cron: false })

payload.config.jobs.processingLease.duration = Number(process.env.CRASH_WORKER_LEASE_DURATION)
payload.config.jobs.processingLease.safetyBuffer = Number(
  process.env.CRASH_WORKER_LEASE_SAFETY_BUFFER,
)
payload.config.jobs.deleteJobOnComplete = false

try {
  await payload.jobs.runByID({
    id: jobID,
    silent: true,
  })
} finally {
  await payload.destroy()
}
