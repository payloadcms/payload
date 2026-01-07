import type { CreateVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { Types } from 'mongoose'

import type { MongooseAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'
import { withSession } from './withSession'

export const createVersion: CreateVersion = async function createVersion(
  this: MongooseAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    req = {} as PayloadRequest,
    updatedAt,
    versionData,
  },
) {
  const VersionModel = this.versions[collectionSlug]
  const options = await withSession(this, req)

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

  const parentQuery = {
    $or: [
      {
        parent: {
          $eq: parent,
        },
      },
    ],
  }

  // @ts-expect-error
  if (parent instanceof Types.ObjectId) {
    parentQuery.$or.push({
      parent: {
        $eq: parent.toString(),
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
      ],
    },
    { $unset: { latest: 1 } },
    options,
  )

  const result = this.jsonParse ? JSON.parse(JSON.stringify(doc)) : doc.toObject()

  const verificationToken = doc._verificationToken

  if (verificationToken) {
    result._verificationToken = verificationToken
  }

  return sanitizeInternalFields(result)
}
