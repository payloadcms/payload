import type { DropTables } from './types.js'

export const dropTables: DropTables = async function dropTables({ adapter }) {
  const statement = Object.keys(adapter.tables).reduce(
    (acc, table) => acc + `DROP TABLE IF EXISTS ${table};`,
    '',
  )
  await adapter.execute({
    drizzle: adapter.drizzle,
    raw: statement,
  })
}
