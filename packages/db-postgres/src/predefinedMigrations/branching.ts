import type { DynamicMigrationTemplate } from 'payload'

import { buildBranchingMigration } from '@payloadcms/drizzle'

export const dynamic: DynamicMigrationTemplate = buildBranchingMigration({
  packageName: '@payloadcms/db-postgres',
})
