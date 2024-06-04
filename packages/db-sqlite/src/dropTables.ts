import type { SQLiteAdapter } from './types.js'

export const dropTables: SQLiteAdapter['dropTables'] = async function dropTables({ adapter }) {
  // TODO: this needs to be written for sqlite
  await adapter.execute({
    drizzle: adapter.drizzle,
    raw: `drop schema ${this.schemaName || 'public'} cascade;
    create schema ${this.schemaName || 'public'};`,
  })
}
