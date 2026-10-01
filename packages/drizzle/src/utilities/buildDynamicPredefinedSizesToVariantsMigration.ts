import type { DynamicMigrationTemplate } from 'payload'

import { writeFileSync } from 'fs'

import type { DrizzleAdapter } from '../types.js'

/**
 * Builds the `sizes-to-variants` predefined migration for a SQL adapter. The migration renames
 * columns rather than letting drizzle-kit diff the schema (which would drop and re-add them,
 * losing every stored image size), so it also writes the current schema snapshot: the next
 * generated migration then diffs from the renamed columns instead of the legacy ones.
 */
export const buildDynamicPredefinedSizesToVariantsMigration = ({
  packageName,
}: {
  packageName: string
}): DynamicMigrationTemplate => {
  return async ({ filePath, payload }) => {
    const adapter = payload.db as unknown as DrizzleAdapter
    const { generateDrizzleJson } = adapter.requireDrizzleKit()
    const drizzleJsonAfter = await generateDrizzleJson(adapter.schema)

    writeFileSync(`${filePath}.json`, JSON.stringify(drizzleJsonAfter, null, 2))

    return {
      downSQL: `  await migrateSizesToVariants({ db, direction: 'down', payload })`,
      imports: `import { migrateSizesToVariants } from '${packageName}/migration-utils'`,
      upSQL: `  await migrateSizesToVariants({ db, payload })`,
    }
  }
}
