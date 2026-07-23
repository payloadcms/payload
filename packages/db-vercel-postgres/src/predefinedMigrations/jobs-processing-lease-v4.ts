import type { DynamicMigrationTemplate } from 'payload'

import { buildDynamicPredefinedJobsProcessingLeaseMigration } from '@payloadcms/drizzle'

export const dynamic: DynamicMigrationTemplate = buildDynamicPredefinedJobsProcessingLeaseMigration(
  {
    dialect: 'postgres',
    packageName: '@payloadcms/db-vercel-postgres',
  },
)
