import type { ClientSession } from 'mongoose'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from './index'

/**
 * returns the session belonging to the transaction of the req.session if exists
 * @returns ClientSession
 */
export async function withSession(
  db: MongooseAdapter,
  req: PayloadRequest,
): Promise<{ session: ClientSession } | object> {
  let transactionID = req.transactionID

  if (transactionID instanceof Promise) {
    transactionID = await req.transactionID
  }

  if (req) return db.sessions[transactionID] ? { session: db.sessions[transactionID] } : {}
}
