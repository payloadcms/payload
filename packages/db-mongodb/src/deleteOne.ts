import type { DeleteOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: MongooseAdapter,
  { collection, req, select, where },
) {
  const Model = this.collections[collection]
  const session = await getSession(this, req)

  const query = await Model.buildQuery({
    payload: this.payload,
    session,
    where,
  })

  const fields = this.payload.collections[collection].config.flattenedFields

  const doc = await Model.collection.findOneAndDelete(query, {
    projection: buildProjectionFromSelect({
      adapter: this,
      fields,
      select,
    }),
    session,
  })

  transform({
    adapter: this,
    data: doc,
    fields,
    operation: 'read',
  })

  return doc
}
