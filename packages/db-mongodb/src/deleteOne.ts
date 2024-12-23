import type { QueryOptions } from 'mongoose'
import type { DeleteOne, Document } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: MongooseAdapter,
  { collection, req, select, where },
) {
  const Model = this.collections[collection]
  const options: QueryOptions = {
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: this.payload.collections[collection].config.flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  const query = await Model.buildQuery({
    payload: this.payload,
    where,
  })

  const doc = await Model.findOneAndDelete(query, options).lean()

  let result: Document = JSON.parse(JSON.stringify(doc))

  // custom id type reset
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
