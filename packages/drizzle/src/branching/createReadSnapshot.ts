import type { BranchingAdapter, PayloadRequest } from 'payload'

import { sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { createBranchReadRequest, createBranchReadScope } from 'payload'

import type { DrizzleAdapter, DrizzleTransaction, TransactionPg } from '../types.js'

import { createPostgresReadTrace } from './createPostgresReadTrace.js'
import { createProjectionQueries } from './createProjectionQueries.js'

/** Native snapshot ownership is deliberately separate from write transaction support. */
export const createReadSnapshot =
  ({ adapter }: { adapter: DrizzleAdapter }): NonNullable<BranchingAdapter['withReadSnapshot']> =>
  async ({ read, req }) => {
    const transactionID = await req.transactionID

    if (transactionID != null) {
      const transaction = adapter.sessions[transactionID]?.db

      if (!transaction) {
        throw unsupported()
      }

      const assertReadActive = () => {
        if (adapter.sessions[transactionID]?.db !== transaction) {
          throw unsupported()
        }
      }

      if (adapter.name === 'postgres') {
        const result = await (transaction as TransactionPg).execute<{ isolation: string }>(
          sql`select current_setting('transaction_isolation') as isolation`,
        )

        if (result.rows[0]?.isolation === 'read committed') {
          const trace = createPostgresReadTrace({ db: transaction, schema: adapter.schema })
          try {
            const result = await snapshotRead({
              adapter,
              assertReadActive,
              db: trace.db,
              read,
              req,
            })

            assertReadActive()
            await trace.validate()
            return result
          } finally {
            trace.close()
          }
        }
        if (!['repeatable read', 'serializable'].includes(result.rows[0]?.isolation)) {
          throw unsupported()
        }
      }

      return snapshotRead({ adapter, assertReadActive, db: transaction, read, req })
    }

    // Use the primary even when read replicas are configured. All subsequent reads
    // share this transaction, including ordinary, unversioned relationship targets.
    const db = adapter.primaryDrizzle ?? adapter.drizzle

    if (typeof db?.transaction !== 'function') {
      throw unsupported()
    }

    const options =
      adapter.name === 'postgres'
        ? { accessMode: 'read only', isolationLevel: 'repeatable read' }
        : { behavior: 'deferred' }

    return db.transaction(
      async (transaction) =>
        snapshotRead({ adapter, db: transaction as unknown as DrizzleTransaction, read, req }),
      options as never,
    )
  }

const snapshotRead = async <T>({
  adapter,
  assertReadActive,
  db,
  read,
  req,
}: {
  adapter: DrizzleAdapter
  assertReadActive?: () => void
  db: DrizzleTransaction
  read: (args: { req: PayloadRequest }) => Promise<T>
  req: PayloadRequest
}) => {
  const id = randomUUID()
  const scope = createBranchReadScope({
    adapter: Object.assign(Object.create(adapter), {
      sessions: {
        [id]: {
          db,
          reject: () => Promise.reject(unsupported()),
          resolve: () => Promise.reject(unsupported()),
        },
      },
    }) as DrizzleAdapter,
    assertReadActive,
  })
  const scopedAdapter = scope.adapter

  scope.nativeAdapter.branching = {
    ...adapter.branching!,
    capabilities: () =>
      Promise.resolve({
        atomicBatch: false,
        interactiveTransactions: false,
        reason: 'A branch read snapshot cannot perform branch mutations.',
      }),
    mutateVersion: () => Promise.reject(unsupported()),
    queryProjection: createProjectionQueries({ adapter: scope.nativeAdapter }),
    withReadSnapshot: async ({ read, req: nestedReq }) => {
      if (nestedReq.payload.db !== scopedAdapter || (await nestedReq.transactionID) !== id) {
        throw unsupported()
      }
      return read({ req: nestedReq })
    },
  }

  const snapshotReq = createBranchReadRequest({
    assertActive: scope.assertActive,
    payload: Object.create(req.payload, {
      db: { configurable: true, enumerable: true, value: scopedAdapter, writable: true },
    }),
    req,
    transactionID: id,
  })
  scope.setRequest({ req: snapshotReq })
  try {
    const result = await read({ req: snapshotReq })

    scope.assertActive()
    return result
  } finally {
    scope.revoke()
  }
}

const unsupported = (): Error =>
  Object.assign(
    new Error('The current transaction cannot provide a consistent branch read snapshot.'),
    { code: 'branch-read-snapshot-unsupported' },
  )
