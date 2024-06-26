import type { CreateVersion, Document, PayloadRequestWithData } from 'payload'

import type { MongooseAdapter } from './index.js'

import { withSession } from './withSession.js'

export const createVersion: CreateVersion = async function createVersion(
  this: MongooseAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    req = {} as PayloadRequestWithData,
    updatedAt,
    versionData,
  },
) {
  const VersionModel = this.versions[collectionSlug]
  const options = withSession(this, req.transactionID)

  const [doc] = await VersionModel.create(
    [
      {
        autosave,
        createdAt,
        latest: true,
        parent,
        updatedAt,
        version: versionData,
      },
    ],
    options,
    req,
  )

  await VersionModel.updateMany(
    {
      $and: [
        {
          _id: {
            $ne: doc._id,
          },
        },
        {
          parent: {
            $eq: parent,
          },
        },
        {
          latest: {
            $eq: true,
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
