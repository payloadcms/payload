import type { BeginTransaction, CommitTransaction, RollbackTransaction } from 'payload'

import type { SQLiteAdapter } from './types.js'

/** LibSQL uses BEGIN IMMEDIATE; reject a second writer before a failed native BEGIN can taint its connection. */
export const createTransactionHandlers = ({
  adapter,
}: {
  adapter: SQLiteAdapter
}): {
  beginTransaction: BeginTransaction
  commitTransaction: CommitTransaction
  rollbackTransaction: RollbackTransaction
} => {
  const nativeBegin = adapter.beginTransaction.bind(adapter)
  const nativeCommit = adapter.commitTransaction.bind(adapter)
  const nativeRollback = adapter.rollbackTransaction.bind(adapter)
  let lease: { id?: number | string; isFinishing: boolean } | undefined

  const finish = async ({
    id,
    operation,
  }: {
    id: Parameters<CommitTransaction>[0]
    operation: CommitTransaction | RollbackTransaction
  }): Promise<void> => {
    const transactionID = await id
    const owned =
      lease?.id !== undefined && lease.id === transactionID && !lease.isFinishing
        ? lease
        : undefined

    if (owned) {
      owned.isFinishing = true
    }

    try {
      await operation(transactionID)
    } finally {
      if (owned && lease === owned) {
        lease = undefined
      }
    }
  }

  return {
    beginTransaction: async (options) => {
      if (lease) {
        throw new SQLiteTransactionBusyError()
      }

      const current = { isFinishing: false }

      lease = current
      try {
        const id = await nativeBegin(options)

        if (id === null) {
          lease = undefined
        } else {
          lease.id = id
        }

        return id
      } catch (error) {
        if (lease === current) {
          lease = undefined
        }

        throw error
      }
    },
    commitTransaction: (id) => finish({ id, operation: nativeCommit }),
    rollbackTransaction: (id) => finish({ id, operation: nativeRollback }),
  }
}

class SQLiteTransactionBusyError extends Error {
  code = 'SQLITE_BUSY'

  constructor() {
    super('SQLITE_BUSY: the SQLite adapter already has an active caller transaction.')
  }
}
