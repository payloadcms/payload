import type { UpdateVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from '.'

import { withSession } from './withSession'

export const updateVersion: UpdateVersion = async function updateVersion(
  this: MongooseAdapter,
  { id, collection, locale, req = {} as PayloadRequest, versionData, where },
) {
  const VersionModel = this.versions[collection]
  const whereToUse = where || { id: { equals: id } }
  const options = {
    ...(await withSession(this, req)),
    lean: true,
    new: true,
  }

  const query = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    where: whereToUse,
  })

  const doc = await VersionModel.findOneAndUpdate(query, versionData, options)

  const result = doc.toObject()

  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id.toString()
  if (verificationToken) {
    result._verificationToken = verificationToken
  }
  return result
}
