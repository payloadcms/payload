import type { MongooseUpdateQueryOptions } from 'mongoose'
import type { DeleteOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: MongooseAdapter,
  { collection: collectionSlug, req, returning, select, where },
) {
  const { collectionConfig, Model } = getCollection({ adapter: this, collectionSlug })

  const options: MongooseUpdateQueryOptions = {
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: collectionConfig.flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    collectionSlug,
    fields: collectionConfig.flattenedFields,
    where,
  })

  if (returning === false) {
    await Model.deleteOne(query, options)?.lean()
    return null
  }

  const doc = await Model.findOneAndDelete(query, options)?.lean()

  if (!doc) {
    return null
  }

  transform({
    adapter: this,
    data: doc,
    fields: collectionConfig.fields,
    operation: 'read',
  })

  return doc
}
