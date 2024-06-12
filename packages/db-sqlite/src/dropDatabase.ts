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

  // for some reason some tables are not dropped, so we repeat the process until all tables are dropped
  while (result.rows.length) {
    await dropTables(adapter, result.rows)
    result = await getTables(adapter)
  }
}
