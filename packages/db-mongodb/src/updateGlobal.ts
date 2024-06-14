import type { PayloadRequestWithData, UpdateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug, data, req = {} as PayloadRequestWithData },
) {
  const Model = this.globals
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
    new: true,
  }

  let result
  result = await Model.findOneAndUpdate({ globalType: slug }, data, options)

  result = JSON.parse(JSON.stringify(result))

  // custom id type reset
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
