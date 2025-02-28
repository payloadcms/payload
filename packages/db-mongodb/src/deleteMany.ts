import type { DeleteOptions } from 'mongodb'
import type { DeleteMany } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { getSession } from './utilities/getSession.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: MongooseAdapter,
  { collection, req, where },
) {
  const Model = this.collections[collection]
  const options: DeleteOptions = {
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    collectionSlug: collection,
    fields: this.payload.collections[collection].config.flattenedFields,
    where,
  })

  await Model.deleteMany(query, options)
}
