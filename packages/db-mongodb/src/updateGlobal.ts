import type { UpdateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from './index.js'

import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { data, req = {} as PayloadRequest, slug },
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
