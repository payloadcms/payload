import type { DeleteOne, Document, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: MongooseAdapter,
  { collection, req = {} as PayloadRequest, select, where },
) {
  const Model = this.collections[collection]
  const options = await withSession(this, req)

  const query = await Model.buildQuery({
    payload: this.payload,
    session: options.session,
    where,
  })

  const doc = await Model.findOneAndDelete(query, {
    ...options,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: this.payload.collections[collection].config.flattenedFields,
      select,
    }),
  }).lean()

  let result: Document = JSON.parse(JSON.stringify(doc))

  // custom id type reset
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
