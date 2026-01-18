import type { DeleteVersions, FlattenedField } from 'payload'

import { APIError, buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'

import type { MongooseAdapter } from './index.js'
import type { CollectionModel } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { getCollection, getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: MongooseAdapter,
  { collection: collectionSlug, globalSlug, locale, req, where },
) {
  let fields: FlattenedField[]
  let VersionsModel: CollectionModel

  if (globalSlug) {
    const { globalConfig, Model } = getGlobal({
      adapter: this,
      globalSlug,
      versions: true,
    })
    fields = buildVersionGlobalFields(this.payload.config, globalConfig, true)
    VersionsModel = Model
  } else if (collectionSlug) {
    const { collectionConfig, Model } = getCollection({
      adapter: this,
      collectionSlug,
      versions: true,
    })
    fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)
    VersionsModel = Model
  } else {
    throw new APIError('Either collection or globalSlug must be passed.')
  }

  const query = await buildQuery({
    adapter: this,
    fields,
    locale,
    where,
  })

  const session = await getSession(this, req)

  await VersionsModel.deleteMany(query, { session })
}
