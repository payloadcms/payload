import type { UpdateOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from '.'

import handleError from './utilities/handleError'
import sanitizeInternalFields from './utilities/sanitizeInternalFields'
import { withSession } from './withSession'

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  { id, collection, data, locale, req = {} as PayloadRequest, where: whereArg },
) {
  const where = id ? { id: { equals: id } } : whereArg
  const Model = this.collections[collection]
  const options = {
    ...(await withSession(this, req)),
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

  result = this.jsonParse ? JSON.parse(JSON.stringify(result)) : result

  return sanitizeInternalFields(result)
}
