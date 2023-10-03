import type { UpdateGlobalVersionArgs } from 'payload/database'
import type { PayloadRequest, TypeWithID } from 'payload/types'

import type { MongooseAdapter } from '.'

import { withSession } from './withSession'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: MongooseAdapter,
  { global, locale, req = {} as PayloadRequest, versionData, where }: UpdateGlobalVersionArgs<T>,
) {
  const VersionModel = this.versions[global]
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
    new: true,
  }

  const query = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  const doc = await VersionModel.findOneAndUpdate(query, versionData, options)

  const result = JSON.parse(JSON.stringify(doc))

  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id
  if (verificationToken) {
    result._verificationToken = verificationToken
  }
  return result
}
