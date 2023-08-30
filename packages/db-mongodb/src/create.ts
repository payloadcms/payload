import type { Create } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { MongooseAdapter } from './index.js'

import { withSession } from './withSession.js'

export const create: Create = async function create(
  this: MongooseAdapter,
  { collection, data, req = {} as PayloadRequest },
) {
  const Model = this.collections[collection]
  const options = withSession(this, req.transactionID)

  const [doc] = await Model.create([data], options)

  // doc.toJSON does not do stuff like converting ObjectIds to string, or date strings to date objects. That's why we use JSON.parse/stringify here
  const result: Document = JSON.parse(JSON.stringify(doc))
  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id
  if (verificationToken) {
    result._verificationToken = verificationToken
  }

  return result
}
