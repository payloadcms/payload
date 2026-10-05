import type { DynamicMigrationTemplate } from 'payload'

import { buildDynamicPredefinedSizesToVariantsMigration } from '@payloadcms/drizzle'

export const dynamic: DynamicMigrationTemplate = buildDynamicPredefinedSizesToVariantsMigration({
  packageName: '@payloadcms/db-sqlite',
})
