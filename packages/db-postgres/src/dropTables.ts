import type { DropTables } from './types.js'

export const dropTables: DropTables = async function dropTables({ adapter }) {
  await adapter.execute({
    drizzle: adapter.drizzle,
    raw: `drop schema ${this.schemaName || 'public'} cascade;
    create schema ${this.schemaName || 'public'};`,
  })
}
