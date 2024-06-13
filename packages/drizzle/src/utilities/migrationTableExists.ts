import type { DrizzleAdapter } from '../types.js'

export const migrationTableExists = async (adapter: DrizzleAdapter): Promise<boolean> => {
  let statement

  if (adapter.name === 'postgres') {
    const prependSchema = adapter.schemaName ? `"${adapter.schemaName}".` : ''
    statement = `SELECT to_regclass('${prependSchema}."payload_migrations"') exists;`
  }

  if (adapter.name === 'sqlite') {
    statement = `
      SELECT name 'exists'
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'payload_migrations';`
  }

  // TODO: remove any
  const result: any = await adapter.execute({
    drizzle: adapter.drizzle,
    raw: statement,
  })

  const [row] = result.rows

  return row && 'exists' in row && typeof row.exists === 'boolean' && row.exists
}
