import type { MongooseUpdateQueryOptions } from 'mongoose'

import { buildVersionCollectionFields, type UpdateVersion } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const updateVersion: UpdateVersion = async function updateVersion(
  this: MongooseAdapter,
  {
    id,
    collection: collectionSlug,
    locale,
    options: optionsArgs = {},
    req,
    returning,
    select,
    versionData,
    where,
  },
) {
  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })

  const whereToUse = where || { id: { equals: id } }
  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig)

  const flattenedFields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const options: MongooseUpdateQueryOptions = {
    ...optionsArgs,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    fields: flattenedFields,
    locale,
    where: whereToUse,
  })

  transform({ adapter: this, data: versionData, fields, operation: 'write' })

  if (returning === false) {
    await Model.updateOne(query, versionData, options)
    return null
  }

  const doc = await Model.findOneAndUpdate(query, versionData, options)

  if (!doc) {
    return null
  }

  transform({ adapter: this, data: doc, fields, operation: 'read' })

  return doc
}
