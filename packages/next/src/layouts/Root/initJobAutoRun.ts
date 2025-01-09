import type { Payload } from 'payload'

import { Cron } from 'croner'

export async function initJobAutoRun({ payload }: { payload: Payload }) {
  if (global._payload_jobAutoRunInitialized) {
    return
  }
  global._payload_jobAutoRunInitialized = true

  if (payload.config.jobs.autoRun) {
    const DEFAULT_CRON = '* * * * *'
    const DEFAULT_LIMIT = 10

    const cronJobs =
      typeof payload.config.jobs.autoRun === 'function'
        ? await payload.config.jobs.autoRun(payload)
        : payload.config.jobs.autoRun
    await Promise.all(
      cronJobs.map((cronConfig) => {
        new Cron(cronConfig.cron ?? DEFAULT_CRON, async () => {
          await payload.jobs.run({
            limit: cronConfig.limit ?? DEFAULT_LIMIT,
            queue: cronConfig.queue,
          })
        })
      }),
    )
  }
}
