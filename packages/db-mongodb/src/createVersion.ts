import type { CreateVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { MongooseAdapter } from '.'

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
  const options = withSession(this, req.transactionID)

  const [doc] = await VersionModel.create(
    [
      {
        autosave,
        createdAt,
        parent,
        updatedAt,
        version: versionData,
      },
    ],
    options,
    req,
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
