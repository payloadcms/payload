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
  const options = await withSession(this, req)
  let doc
  try {
    ;[doc] = await Model.create([data], options)
  } catch (error) {
    handleError(error, req)
  }

  const result: Document = doc.toObject()
  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id.toString()
  if (verificationToken) {
    result._verificationToken = verificationToken
  }

  return result
}
