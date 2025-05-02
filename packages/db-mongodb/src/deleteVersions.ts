import { buildVersionCollectionFields, type DeleteVersions } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: MongooseAdapter,
  { collection: collectionSlug, locale, req, where },
) {
  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })

  const session = await getSession(this, req)

  const query = await buildQuery({
    adapter: this,
    fields: buildVersionCollectionFields(this.payload.config, collectionConfig, true),
    locale,
    where,
  })

  await Model.deleteMany(query, { session })
}
