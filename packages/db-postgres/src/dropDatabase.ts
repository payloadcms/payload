import type { DropDatabase } from './types.js'

export const dropDatabase: DropDatabase = async function dropDatabase({ adapter }) {
  await adapter.execute({
    drizzle: adapter.drizzle,
    raw: `drop schema if exists ${this.schemaName || 'public'} cascade;
    create schema ${this.schemaName || 'public'};`,
  })
}
