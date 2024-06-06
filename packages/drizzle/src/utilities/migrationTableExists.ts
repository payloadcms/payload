import type { DrizzleAdapter } from '../types.js'

export const migrationTableExists = async (adapter: DrizzleAdapter): Promise<boolean> => {
  let statement

  if (adapter.name === 'postgres') {
    const prependSchema = adapter.schemaName ? `"${adapter.schemaName}".` : ''
    statement = `SELECT to_regclass('${prependSchema}."payload_migrations"') exists;`
  }

  if (adapter.name === 'sqlite') {
    statement = `
      SELECT name exists
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'payload_migrations';`
  }

  const result = await adapter.execute({
    drizzle: adapter.drizzle,
    raw: statement,
  })

  // @ts-expect-error
  return result.rows[0]?.exists
}
