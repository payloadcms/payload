import type { ClientSession } from 'mongoose'
import type { PayloadRequest } from 'payload'

import type { MongooseAdapter } from '../index.js'

/**
 * returns the session belonging to the transaction of the req.session if exists
 * @returns ClientSession
 */
export async function getSession(
  db: MongooseAdapter,
  req?: Partial<PayloadRequest>,
): Promise<ClientSession | undefined> {
  if (!req) {
    return
  }

  let transactionID = req.transactionID

  if (transactionID instanceof Promise) {
    transactionID = await req.transactionID
  }

  if (transactionID) {
    return db.sessions[transactionID]
  }
}
