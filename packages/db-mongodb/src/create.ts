import type { Create } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from '.'

import handleError from './utilities/handleError'
import sanitizeInternalFields from './utilities/sanitizeInternalFields'
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

  const result = this.jsonParse ? JSON.parse(JSON.stringify(doc)) : doc.toObject()

  const verificationToken = doc._verificationToken

  if (verificationToken) {
    result._verificationToken = verificationToken
  }

  return sanitizeInternalFields(result)
}
