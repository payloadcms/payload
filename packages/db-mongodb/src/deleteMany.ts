import type { DeleteOptions } from 'mongodb'

import { type DeleteMany } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: MongooseAdapter,
  { collection: collectionSlug, req, where },
) {
  const { collectionConfig, Model } = getCollection({ adapter: this, collectionSlug })

  const options: DeleteOptions = {
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    collectionSlug,
    fields: collectionConfig.flattenedFields,
    where,
  })

  await Model.deleteMany(query, options)
}
