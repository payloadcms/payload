import type { DeleteOne, Document, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQueryWithAggregate } from './utilities/buildQueryWithAggregate.js'
import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: MongooseAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  const Model = this.collections[collection]
  const options = await withSession(this, req)

  const query = await buildQueryWithAggregate({
    Model,
    payload: this.payload,
    session: options.session,
    where,
  })

  const doc = await Model.findOneAndDelete(query, options).lean()

  let result: Document = JSON.parse(JSON.stringify(doc))

  // custom id type reset
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
