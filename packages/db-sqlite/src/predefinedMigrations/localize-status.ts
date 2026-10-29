import type { DynamicMigrationTemplate } from 'payload'

import { buildDynamicPredefinedLocalizeStatusMigration } from '@payloadcms/drizzle'

export const dynamic: DynamicMigrationTemplate = buildDynamicPredefinedLocalizeStatusMigration({
  packageName: '@payloadcms/db-sqlite',
})
