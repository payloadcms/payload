import { buildVersionCollectionFields, type CreateVersion } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const createVersion: CreateVersion = async function createVersion(
  this: MongooseAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    publishedLocale,
    req,
    returning,
    snapshot,
    updatedAt,
    versionData,
  },
) {
  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })

  const options = {
    session: await getSession(this, req),
  }

  const data = {
    autosave,
    createdAt,
    latest: true,
    parent,
    publishedLocale,
    snapshot,
    updatedAt,
    version: versionData,
  }

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig)

  transform({
    adapter: this,
    data,
    fields,
    operation: 'write',
  })

  let [doc] = await Model.create([data], options, req)

  const parentQuery = {
    $or: [
      {
        parent: {
          $eq: data.parent,
        },
      },
    ],
  }

  await Model.updateMany(
    {
      $and: [
        {
          _id: {
            $ne: doc._id,
          },
        },
        parentQuery,
        {
          latest: {
            $eq: true,
          },
        },
        {
          updatedAt: {
            $lt: new Date(doc.updatedAt),
          },
        },
      ],
    },
    { $unset: { latest: 1 } },
    options,
  )

  if (returning === false) {
    return null
  }

  doc = doc.toObject()

  transform({
    adapter: this,
    data: doc,
    fields,
    operation: 'read',
  })

  return doc
}
