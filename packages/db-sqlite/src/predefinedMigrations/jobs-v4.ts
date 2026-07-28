import type { DynamicMigrationTemplate } from 'payload'

import { buildDynamicPredefinedJobsV4Migration } from '@payloadcms/drizzle'

export const dynamic: DynamicMigrationTemplate = buildDynamicPredefinedJobsV4Migration({
  dialect: 'sqlite',
})
