import type { CommitTransaction } from 'payload/database'

import { sql } from 'drizzle-orm'

export const commitTransaction: CommitTransaction = async function commitTransaction(id) {
  if (!this.sessions[id]) {
    this.payload.logger.warn('commitTransaction called when no transaction exists')
    return
  }

  try {
    await this.sessions[id].execute(sql`COMMIT;`)
  } catch (err: unknown) {
    await this.sessions[id].execute(sql`ROLLBACK;`)
  }

  delete this.sessions[id]
}
