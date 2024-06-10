import type { DropDatabase } from './types.js'

const getTables = (adapter) => {
  return adapter.execute({
    drizzle: adapter.drizzle,
    raw: `SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%';`,
  })
}

const dropTables = (adapter, rows) => {
  const promises = []
  rows.forEach(async ({ name }) => {
    const statement = `DROP TABLE ${name};`
    promises.push(
      await adapter.execute({
        drizzle: adapter.drizzle,
        raw: statement,
      }),
    )
  })
  return Promise.all(promises)
}

export const dropDatabase: DropDatabase = async function dropDatabase({ adapter }) {
  let result = await getTables(adapter)
  await dropTables(adapter, result.rows)

  // for some reason the first dropTables doesn't drop all tables
  result = getTables(adapter)
  await dropTables(adapter, result.rows)
}
