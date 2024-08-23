import type { QueryOptions } from 'mongoose'
import type { FindOne, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { setJoins } from './utilities/setJoins.js'
import { withSession } from './withSession.js'

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { collection, joins, locale, req = {} as PayloadRequest, where },
) {
  const Model = this.collections[collection]
  const options: QueryOptions = {
    ...(await withSession(this, req)),
    lean: true,
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  const doc = await Model.findOne(query, {}, options)

  if (!doc) {
    return null
  }

  let result = await setJoins({
    collection,
    doc,
    joins,
    locale,
    payload: this.payload,
    req,
  })

  result = JSON.parse(JSON.stringify(result))

  // custom id type reset
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
