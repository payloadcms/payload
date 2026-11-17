import type { FindArgs, PaginatedDocs, TypeWithID } from 'payload'

import { sql } from 'drizzle-orm'

import type { TransactionPg } from '../types.js'
import type { BasePostgresAdapter } from './types.js'

import { find } from '../find.js'

export async function findDocumentLocks<T = TypeWithID>(
  this: BasePostgresAdapter,
  args: FindArgs,
): Promise<PaginatedDocs<T>> {
  const transactionID = await args.req?.transactionID
  const transaction = transactionID
    ? (this.sessions[transactionID]?.db as TransactionPg | undefined)
    : undefined
  let canReuseTransaction = false

  if (transaction) {
    // Inspect the active transaction: its isolation may come from the database defaults or
    // a caller-supplied transaction, rather than the adapter's configured options.
    const result = await transaction.execute<{ transaction_isolation: string }>(
      sql`SHOW transaction_isolation`,
    )
    const isolationLevel = result.rows[0]?.transaction_isolation

    canReuseTransaction =
      isolationLevel === 'read committed' || isolationLevel === 'read uncommitted'
  }

  // Preserve the independent lock read for snapshot isolation so newer committed locks remain
  // visible. Only statement-snapshot transactions can safely share their connection here.
  return (find<T>).call(this, { ...args, req: canReuseTransaction ? args.req : undefined })
}
