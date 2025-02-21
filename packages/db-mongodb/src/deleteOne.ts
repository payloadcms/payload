import type { QueryOptions } from 'mongoose'
import type { DeleteOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

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

  const query = await buildQuery({
    adapter: this,
    collectionSlug: collection,
    fields: this.payload.collections[collection].config.flattenedFields,
    where,
  })

  const doc = await Model.findOneAndDelete(query, options)?.lean()

  if (!doc) {
    return null
  }

  transform({
    adapter: this,
    data: doc,
    fields: this.payload.collections[collection].config.fields,
    operation: 'read',
  })

  return doc
}
