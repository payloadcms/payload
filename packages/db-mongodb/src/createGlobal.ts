import type { CreateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from './index.js'

import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: MongooseAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
  const Model = this.globals
  const global = {
    globalType: slug,
    ...data,
  }
  const options = withSession(this, req.transactionID)

  let [result] = await Model.create([global], options)

  result = JSON.parse(JSON.stringify(result))

  // custom id type reset
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
