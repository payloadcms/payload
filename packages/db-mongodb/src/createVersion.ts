import { Types } from 'mongoose'
import { buildVersionCollectionFields, type CreateVersion, type PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { transform } from './utilities/transform.js'

export const createVersion: CreateVersion = async function createVersion(
  this: MongooseAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    publishedLocale,
    req = {} as PayloadRequest,
    snapshot,
    updatedAt,
    versionData,
  },
) {
  const VersionModel = this.versions[collectionSlug]
  const session = await getSession(this, req)

  const data: any = {
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
    true,
  )

  transform({
    adapter: this,
    data,
    fields,
    operation: 'create',
  })

  const { insertedId } = await VersionModel.collection.insertOne(data, { session })
  data._id = insertedId

  const parentQuery = {
    $or: [
      {
        parent: {
          $eq: data.parent,
        },
      },
    ],
  }
  if ((data.parent as unknown) instanceof Types.ObjectId) {
    parentQuery.$or.push({
      parent: {
        $eq: data.parent.toString(),
      },
    })
  }

  await VersionModel.collection.updateMany(
    {
      $and: [
        {
          _id: {
            $ne: insertedId,
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
            $lt: new Date(data.updatedAt),
          },
        },
      ],
    },
    { $unset: { latest: 1 } },
    { session },
  )

  transform({
    adapter: this,
    data,
    fields,
    operation: 'read',
  })

  return data
}
