import type { DropDatabase } from './types.js'

const getTables = (adapter) => {
  return adapter.client.execute(`
    SELECT table_name AS name
    FROM INFORMATION_SCHEMA.TABLES
    WHERE table_schema = DATABASE();
  `)
}

const dropTables = (adapter, rows) => {
  const multi = `
  ${rows.map(({ name }) => `DROP TABLE IF EXISTS \`${name}\``).join(';\n ')};`
  return adapter.client.executeMultiple(multi)
}

export const dropDatabase: DropDatabase = async function dropDatabase({ adapter }) {
  const result = await getTables(adapter)
  await dropTables(adapter, result.rows)
}
