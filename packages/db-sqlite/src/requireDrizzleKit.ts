import type { RequireDrizzleKit } from '@payloadcms/drizzle/types'

import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
  pushSQLiteSchema,
} from 'drizzle-kit/api'

export const requireDrizzleKit: RequireDrizzleKit = () => ({
  // @ts-expect-error
  generateDrizzleJson: generateSQLiteDrizzleJson,
  // @ts-expect-error
  generateMigration: generateSQLiteMigration,
  // @ts-expect-error
  pushSchema: pushSQLiteSchema,
})
