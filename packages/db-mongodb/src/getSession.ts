import type { ClientSession } from 'mongoose'
import type { PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

/**
 * returns the session belonging to the transaction of the req.session if exists
 * @returns ClientSession
 */
export async function getSession(
  db: MongooseAdapter,
  req: PayloadRequest,
): Promise<ClientSession | undefined> {
  let transactionID = req.transactionID

  if (transactionID instanceof Promise) {
    transactionID = await req.transactionID
  }

  if (req) {
    return db.sessions[transactionID]
  }
}
