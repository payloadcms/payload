import type { DropDatabase } from '@payloadcms/drizzle/postgres'

/**
 * The RDS Data API accepts a single statement per `ExecuteStatement` call, so the shared
 * `dropDatabase` (which sends `drop schema ...; create schema ...;` in one call) cannot be used.
 */
export const dropDatabase: DropDatabase = async function dropDatabase({ adapter }) {
  const schemaName = adapter.schemaName || 'public'

  await adapter.execute({
    drizzle: adapter.drizzle,
    raw: `drop schema if exists ${schemaName} cascade;`,
  })

  await adapter.execute({
    drizzle: adapter.drizzle,
    raw: `create schema ${schemaName};`,
  })
}
