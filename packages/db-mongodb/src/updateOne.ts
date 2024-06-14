import type { PayloadRequestWithData, UpdateOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import handleError from './utilities/handleError.js'
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  { id, collection, data, locale, req = {} as PayloadRequestWithData, where: whereArg },
) {
  const where = id ? { id: { equals: id } } : whereArg
  const Model = this.collections[collection]
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
    new: true,
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  let result

  try {
    result = await Model.findOneAndUpdate(query, data, options)
  } catch (error) {
    handleError(error, req)
  }

  result = JSON.parse(JSON.stringify(result))
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
