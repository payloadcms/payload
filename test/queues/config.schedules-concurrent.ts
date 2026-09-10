/* eslint-disable no-restricted-exports */
import { postgresAdapter } from '@payloadcms/db-postgres'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { defaultPostgresUrl } from '../dbAdapters.js'

export default buildConfigWithDefaults({
  config: {
    collections: [],
    db: postgresAdapter({
      pool: {
        connectionString:
          process.env.POSTGRES_URL || process.env.DATABASE_URL || defaultPostgresUrl,
        // Queue queries on one connection so both schedulers read before either writes.
        max: 1,
      },
    }),
    jobs: {
      deleteJobOnComplete: false,
      tasks: [
        {
          slug: 'scheduledTask',
          handler: () => ({ output: {} }),
          schedule: [
            { cron: '*/15 * * * *', queue: 'default' },
            { cron: '*/15 * * * *', queue: 'other' },
          ],
        },
      ],
    },
  },
  suite: 'queues-schedules-concurrent',
})
