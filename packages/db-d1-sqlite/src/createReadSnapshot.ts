import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { BranchingAdapter } from 'payload'

import { createDrizzleBranchingAdapter } from '@payloadcms/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { randomUUID } from 'node:crypto'
import { createBranchReadRequest, createBranchReadScope } from 'payload'

import type { SQLiteD1Adapter } from './types.js'

import { createBranchReadTrace } from './branchReadTrace.js'

export const createReadSnapshot =
  ({ adapter }: { adapter: SQLiteD1Adapter }): NonNullable<BranchingAdapter['withReadSnapshot']> =>
  async ({ read, req }) => {
    if ((await req.transactionID) != null) {
      throw unsupported()
    }

    const binding = adapter.client ?? adapter.binding

    if (typeof binding?.batch !== 'function' || typeof binding.prepare !== 'function') {
      throw unsupported()
    }

    const trace = createBranchReadTrace({ binding })
    const db = drizzle(trace.binding, { logger: adapter.logger || false, schema: adapter.schema })
    const id = randomUUID()
    const scope = createBranchReadScope({
      adapter: Object.assign(Object.create(adapter), {
        client: trace.binding,
        drizzle: db,
        sessions: {
          [id]: {
            db,
            reject: () => Promise.reject(unsupported()),
            resolve: () => Promise.reject(unsupported()),
          },
        },
      }) as SQLiteD1Adapter,
    })
    const scopedAdapter = scope.adapter

    scope.nativeAdapter.branching = {
      ...createDrizzleBranchingAdapter({
        adapter: scope.nativeAdapter as unknown as DrizzleAdapter,
        isTransactionConfigured: false,
      }),
      capabilities: () =>
        Promise.resolve({
          atomicBatch: false,
          interactiveTransactions: false,
          reason: 'A branch read snapshot cannot perform branch mutations.',
        }),
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

      await trace.validate()
      return result
    } finally {
      trace.close()
      scope.revoke()
    }
  }

const unsupported = (): Error =>
  Object.assign(
    new Error('D1 branch reads require a bounded atomic read trace without a caller transaction.'),
    { code: 'branch-read-snapshot-unsupported' },
  )
