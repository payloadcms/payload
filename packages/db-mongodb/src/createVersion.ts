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
  if (!data.createdAt) {
    data.createdAt = new Date().toISOString()
  }

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig)

  transform({
    adapter: this,
    data,
    fields,
    operation: 'write',
  })

  const options = {
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
  }

  let [doc] = await Model.create([data], options)

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
          // A version with the same updatedAt is only demoted when it is older by id, so that
          // two versions written in the same millisecond never leave two (or zero) latest versions
          $or: [
            {
              updatedAt: {
                $lt: new Date(doc.updatedAt),
              },
            },
            {
              _id: {
                $lt: doc._id,
              },
              updatedAt: {
                $eq: new Date(doc.updatedAt),
              },
            },
          ],
        },
      ],
    },
    { $unset: { latest: 1 } },
    options,
  )

  // The new version loses the tie when a version with the same updatedAt and a higher id already exists.
  // ObjectIds written by different processes do not always increase, so the new version can be the lower one.
  const higherTiedVersion = await Model.exists({
    $and: [
      {
        _id: {
          $gt: doc._id,
        },
      },
      parentQuery,
      {
        updatedAt: {
          $eq: new Date(doc.updatedAt),
        },
      },
    ],
  }).session(options.session ?? null)

  if (higherTiedVersion) {
    await Model.updateOne({ _id: doc._id }, { $unset: { latest: 1 } }, options)
    doc.set('latest', undefined)
  }

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
