import type { Payload } from 'payload'

import type { BasePostgresAdapter } from '../../types.js'

export type MigrationDB = Pick<BasePostgresAdapter, 'drizzle' | 'execute' | 'schemaName'>

/**
 * A migration's `up` receives the Drizzle handle of the migration transaction, while direct callers
 * may pass the Payload adapter. Returns the adapter's `execute({ drizzle, sql })` shape for both,
 * running every statement on the given handle so it stays inside the migration transaction.
 */
export const getMigrationDB = ({ db, payload }: { db: any; payload: Payload }): MigrationDB => {
  if ('drizzle' in db) {
    return db
  }

  const adapter = payload.db as unknown as BasePostgresAdapter

  return {
    drizzle: db,
    execute: adapter.execute,
    schemaName: adapter.schemaName,
  }
}
