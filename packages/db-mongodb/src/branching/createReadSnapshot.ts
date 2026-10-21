import type { BranchingAdapter, PayloadRequest } from 'payload'

import { randomUUID } from 'node:crypto'
import { createBranchReadRequest, createBranchReadScope } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { getSession } from '../utilities/getSession.js'
import { createProjectionQueries } from './createProjectionQueries.js'
import {
  getBranchReadSnapshotAdapterSession,
  registerBranchReadSnapshotAdapter,
  registerBranchReadSnapshotSession,
  unregisterBranchReadSnapshotSession,
} from './readSnapshotSessions.js'

export const createReadSnapshot =
  ({
    adapter,
  }: {
    adapter: MongooseAdapter
    isTransactionsEnabled: boolean
  }): NonNullable<BranchingAdapter['withReadSnapshot']> =>
  async ({ read, req }) => {
    const transactionID = await req.transactionID
    const existing = await getSession(adapter, req)

    if (transactionID != null) {
      // Local/majority concern alone does not promise a cross-shard snapshot.
      // Mongoose's ClientSession declaration omits the driver's public transaction
      // state. Verify the actual active transaction, not default session options.
      const transaction = (
        existing as unknown as {
          transaction?: {
            options?: { readConcern?: { level?: string }; writeConcern?: { w?: number | string } }
          }
        }
      )?.transaction

      if (
        !existing?.inTransaction() ||
        transaction?.options?.readConcern?.level !== 'snapshot' ||
        transaction.options.writeConcern?.w !== 'majority'
      ) {
        throw unsupported()
      }

      return snapshotRead({ adapter, read, req, session: existing })
    }

    if (!adapter.connection) {
      throw unsupported()
    }

    // Driver snapshot sessions pin atClusterTime across reads without a commit
    // round trip. They cannot perform writes or advertise mutation capabilities.
    const session = adapter.connection.getClient().startSession({ snapshot: true })
    let result: Awaited<ReturnType<typeof read>>

    registerBranchReadSnapshotSession({ session })
    try {
      // Pin before access callbacks can launch parallel first reads. The driver
      // learns atClusterTime from the first response, not when a session starts.
      const control = [
        ...Object.values(adapter.payload?.collections ?? {}).map(({ config }) => config),
        ...(adapter.payload?.globals?.config ?? []),
      ]
        .map((config) => config.custom?.branchQueryStorage?.states)
        .find((slug): slug is string => typeof slug === 'string')
      const namespace = control && adapter.collections[control]?.collection.name
      if (!namespace) {
        throw unsupported()
      }
      await adapter.connection
        .db!.collection<{ _id: string }>(namespace)
        .findOne(
          { _id: '_payload_branch_read_snapshot_anchor' },
          { projection: { _id: 1 }, session },
        )
      if (!(session as unknown as { snapshotTime?: unknown }).snapshotTime) {
        throw unsupported()
      }
      result = await snapshotRead({ adapter, read, req, session })
    } catch (error) {
      unregisterBranchReadSnapshotSession({ session })
      try {
        await session.endSession()
      } catch (err) {
        logCleanupFailure({ err, req })
      }
      throw error
    }
    unregisterBranchReadSnapshotSession({ session })
    await session.endSession()
    return result
  }

const snapshotRead = async <T>({
  adapter,
  read,
  req,
  session,
}: {
  adapter: MongooseAdapter
  read: (args: { req: PayloadRequest }) => Promise<T>
  req: PayloadRequest
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>
}) => {
  const id = randomUUID()
  const scope = createBranchReadScope({
    adapter: Object.assign(Object.create(adapter), {
      sessions: { [id]: session },
    }) as MongooseAdapter,
    assertReadActive: () => {
      getBranchReadSnapshotAdapterSession({ adapter: scope.nativeAdapter, transactionID: id })
    },
    shouldSerializeReads: session.inTransaction(),
  })
  registerBranchReadSnapshotAdapter({ adapter: scope.nativeAdapter, session, transactionID: id })
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
      scope.assertActive()
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
    return await read({ req: snapshotReq })
  } finally {
    scope.revoke()
  }
}

const unsupported = (): Error =>
  Object.assign(
    new Error('The current MongoDB session cannot provide a consistent branch read snapshot.'),
    { code: 'branch-read-snapshot-unsupported' },
  )

const logCleanupFailure = ({ err, req }: { err: unknown; req: PayloadRequest }): void => {
  try {
    req.payload.logger?.error({
      err,
      msg: 'Failed to clean up a branch read snapshot after an earlier error.',
    })
  } catch {
    // Logging must not replace the callback or commit failure either.
  }
}
