import { dequal } from 'dequal'
import prompts from 'prompts'

import type { BasePostgresAdapter } from '../postgres/types.js'
import type { DrizzleAdapter, DrizzleMigrationHint, PostgresDB, RawTable } from '../types.js'

import { getMissingHints } from './migrationHints.js'

const previousSchema: {
  localeCodes: null | string[]
  rawTables: null | Record<string, RawTable>
} = {
  localeCodes: null,
  rawTables: null,
}

/**
 * Pushes the development schema to the database using Drizzle.
 *
 * @param {DrizzleAdapter} adapter - The PostgresAdapter instance connected to the database.
 * @returns {Promise<void>} - A promise that resolves once the schema push is complete.
 */
export const pushDevSchema = async (adapter: DrizzleAdapter) => {
  if (process.env.PAYLOAD_FORCE_DRIZZLE_PUSH !== 'true') {
    const localeCodes =
      adapter.payload.config.localization && adapter.payload.config.localization.localeCodes

    const equal = dequal(previousSchema, {
      localeCodes,
      rawTables: adapter.rawTables,
    })

    if (equal) {
      if (adapter.logger) {
        adapter.payload.logger.info('No changes detected in schema, skipping schema push.')
      }

      return
    } else {
      previousSchema.localeCodes = localeCodes
      previousSchema.rawTables = adapter.rawTables
    }
  }

  const { pushSchema } = await adapter.requireDrizzleKit()

  const { extensions = {}, tablesFilter } = adapter as BasePostgresAdapter

  const push = (hints: DrizzleMigrationHint[] = []) =>
    pushSchema(
      adapter.schema,
      adapter.drizzle,
      {
        // Drizzle extensionsFilter supports only postgis for now
        // https://github.com/drizzle-team/drizzle-orm/blob/83daf2d5cf023112de878bc2249ee2c41a2a5b1b/drizzle-kit/src/cli/validations/cli.ts#L26
        extensions: extensions.postgis ? ['postgis'] : undefined,
        schemas: [adapter.schemaName || 'public'],
        tables: tablesFilter,
      },
      undefined,
      // In a terminal, drizzle-kit asks whether ambiguous entities were renamed or created, and
      // returns data loss as warnings to confirm before `apply`.
      { hints, interactive: true },
    )

  let pushResult: Awaited<ReturnType<typeof push>>

  try {
    pushResult = await push()
  } catch (error) {
    // Without a terminal, drizzle-kit can't ask and reports what it needs instead. Data loss can
    // still be confirmed through the prompt below; a rename-or-create question can't.
    const missingHints = getMissingHints({ error })

    if (!missingHints || missingHints.some(({ type }) => type !== 'confirm_data_loss')) {
      throw error
    }

    await confirmWarnings({
      warnings: missingHints.map(
        ({ entity, kind }) =>
          `You're about to delete ${kind} ${entity.filter((part) => part !== 'public').join('.')}`,
      ),
    })

    pushResult = await push(
      missingHints.map(({ entity, kind }) => ({ type: 'confirm_data_loss', entity, kind })),
    )
  }

  await confirmWarnings({ warnings: pushResult.warnings.map(({ hint }) => hint) })

  await pushResult.apply()
  const migrationsTable = adapter.schemaName
    ? `"${adapter.schemaName}"."payload_migrations"`
    : '"payload_migrations"'

  const drizzle = adapter.drizzle as PostgresDB

  const result = await adapter.execute({
    drizzle,
    raw: `SELECT * FROM ${migrationsTable} WHERE batch = '-1'`,
  })

  const devPush = (result as { rows: unknown[] }).rows

  if (!devPush.length) {
    // Use drizzle for insert so $defaultFn's are called
    await drizzle.insert(adapter.tables.payload_migrations).values({
      name: 'dev',
      batch: -1,
    })
  } else {
    await adapter.execute({
      drizzle,
      raw: `UPDATE ${migrationsTable} SET updated_at = CURRENT_TIMESTAMP WHERE batch = '-1'`,
    })
  }
}

const confirmWarnings = async ({ warnings }: { warnings: string[] }) => {
  if (!warnings.length) {
    return
  }

  const { confirm: acceptWarnings } = await prompts(
    {
      name: 'confirm',
      type: 'confirm',
      initial: false,
      message: `Warnings detected during schema push: \n\n${warnings.join('\n')}\n\nAccept warnings and push schema to database?`,
    },
    {
      onCancel: () => {
        process.exit(0)
      },
    },
  )

  // Exit if user does not accept warnings.
  if (!acceptWarnings) {
    process.exit(0)
  }
}
