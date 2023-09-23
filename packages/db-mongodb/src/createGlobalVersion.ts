import type { CreateGlobalVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { MongooseAdapter } from '.'

import { withSession } from './withSession'

export const createGlobalVersion: CreateGlobalVersion = async function createGlobalVersion(
  this: MongooseAdapter,
  { autosave, createdAt, globalSlug, parent, req = {} as PayloadRequest, updatedAt, versionData },
) {
  const VersionModel = this.versions[globalSlug]
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
