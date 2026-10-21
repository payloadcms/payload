import type { ClientSession } from 'mongoose'

const sessions = new WeakSet<ClientSession>()
const adapters = new WeakMap<object, { session: ClientSession; transactionID: string }>()

/** Scoped adapters must never inherit the legacy unsessioned fallback. */
export const registerBranchReadSnapshotAdapter = ({
  adapter,
  session,
  transactionID,
}: {
  adapter: object
  session: ClientSession
  transactionID: string
}): void => {
  adapters.set(adapter, { session, transactionID })
}

export const getBranchReadSnapshotAdapterSession = ({
  adapter,
  transactionID,
}: {
  adapter: object
  transactionID: unknown
}): ClientSession | undefined => {
  const binding = adapters.get(adapter)

  if (!binding) {
    return undefined
  }
  const { session } = binding

  if (
    transactionID !== binding.transactionID ||
    session.hasEnded ||
    (!session.inTransaction() && !isBranchReadSnapshotSession({ session }))
  ) {
    throw Object.assign(new Error('The branch read snapshot session is no longer active.'), {
      code: 'branch-read-snapshot-unsupported',
    })
  }
  return session
}

/** Only adapter-owned, live snapshot sessions may exist outside a transaction. */
export const registerBranchReadSnapshotSession = ({
  session,
}: {
  session: ClientSession
}): void => {
  sessions.add(session)
}
export const unregisterBranchReadSnapshotSession = ({
  session,
}: {
  session: ClientSession
}): void => {
  sessions.delete(session)
}
export const isBranchReadSnapshotSession = ({ session }: { session: ClientSession }): boolean =>
  sessions.has(session) && !session.hasEnded && session.snapshotEnabled
