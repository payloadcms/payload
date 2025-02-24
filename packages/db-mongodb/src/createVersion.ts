import type { CreateOptions } from 'mongoose'

import { buildVersionCollectionFields, type CreateVersion } from 'payload'

import type { MongooseAdapter } from './index.js'

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
    snapshot,
    updatedAt,
    versionData,
  },
) {
  const VersionModel = this.versions[collectionSlug]
  const options: CreateOptions = {
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

  const fields = buildVersionCollectionFields(
    this.payload.config,
    this.payload.collections[collectionSlug].config,
  )

  transform({
    adapter: this,
    data,
    fields,
    operation: 'write',
  })

  let [doc] = await VersionModel.create([data], options, req)

  const parentQuery = {
    $or: [
      {
        parent: {
          $eq: data.parent,
        },
      },
    ],
  }

  await VersionModel.updateMany(
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

  doc = doc.toObject()

  transform({
    adapter: this,
    data: doc,
    fields,
    operation: 'read',
  })

  return doc
}
