import type { DynamicMigrationTemplate } from 'payload'

import { buildDynamicPredefinedBlocksToJsonMigration } from '@payloadcms/drizzle'

export const dynamic: DynamicMigrationTemplate = buildDynamicPredefinedBlocksToJsonMigration({
  packageName: '@payloadcms/db-sqlite',
})
