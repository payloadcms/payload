import type { Create } from 'payload/database'
import type { Document, PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from '.'

import handleError from './utilities/handleError'
import { withSession } from './withSession'

export const create: Create = async function create(
  this: MongooseAdapter,
  { collection, data, req = {} as PayloadRequest },
) {
  const Model = this.collections[collection]
  const options = withSession(this, req.transactionID)
  let doc
  try {
    ;[doc] = await Model.create([data], options)
  } catch (error) {
    handleError(error, req)
  }

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
