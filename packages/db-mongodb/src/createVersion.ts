import { Types } from 'mongoose'
import {
  buildVersionCollectionFields,
  type CreateVersion,
  type Document,
  type PayloadRequest,
} from 'payload'

import type { MongooseAdapter } from './index.js'

import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'
import { withSession } from './withSession.js'

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
  const options = await withSession(this, req)

  const data = sanitizeRelationshipIDs({
    config: this.payload.config,
    data: {
      autosave,
      createdAt,
      latest: true,
      parent,
      publishedLocale,
      snapshot,
      updatedAt,
      version: versionData,
    },
    fields: buildVersionCollectionFields(
      this.payload.config,
      this.payload.collections[collectionSlug].config,
    ),
  })

  const [doc] = await VersionModel.create([data], options, req)

  const parentQuery = {
    $or: [
      {
        parent: {
          $eq: data.parent,
        },
      },
    ],
  }
  if (data.parent instanceof Types.ObjectId) {
    parentQuery.$or.push({
      parent: {
        $eq: data.parent.toString(),
      },
    })
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

  const result: Document = JSON.parse(JSON.stringify(doc))
  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id
  if (verificationToken) {
    result._verificationToken = verificationToken
  }
  return result
}
