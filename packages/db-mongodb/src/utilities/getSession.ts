import type { ClientSession } from 'mongoose'
import type { PayloadRequest } from 'payload'

import type { MongooseAdapter } from '../index.js'

import {
  getBranchReadSnapshotAdapterSession,
  isBranchReadSnapshotSession,
} from '../branching/readSnapshotSessions.js'

/**
 * returns the session belonging to the transaction of the req.session if exists
 * @returns ClientSession
 */
export async function getSession(
  db: MongooseAdapter,
  req?: Partial<PayloadRequest>,
): Promise<ClientSession | undefined> {
  let transactionID = req?.transactionID

  if (transactionID instanceof Promise) {
    transactionID = await transactionID
  }

  const scopedSession = getBranchReadSnapshotAdapterSession({ adapter: db, transactionID })

  if (scopedSession) {
    return scopedSession
  }

  if (transactionID) {
    const session = db.sessions[transactionID]

    // Defensive check for race conditions where:
    // 1. Session was retrieved from db.sessions
    // 2. Another operation committed/rolled back and ended the session
    // 3. This operation tries to use the now-ended session
    // Note: This shouldn't normally happen as sessions are deleted from db.sessions
    // after commit/rollback, but can occur due to async timing where we hold
    // a reference to a session object that gets ended before we use it.
    if (session && !session.inTransaction() && !isBranchReadSnapshotSession({ session })) {
      // Clean up the orphaned session reference
      delete db.sessions[transactionID]
      return undefined
    }

    return session
  }
}
