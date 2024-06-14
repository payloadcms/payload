import type { PayloadRequestWithData, TypeWithID, UpdateGlobalVersionArgs } from 'payload'

import type { MongooseAdapter } from './index.js'

import { withSession } from './withSession.js'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: MongooseAdapter,
  {
    id,
    global,
    locale,
    req = {} as PayloadRequestWithData,
    versionData,
    where,
  }: UpdateGlobalVersionArgs<T>,
) {
  const VersionModel = this.versions[global]
  const whereToUse = where || { id: { equals: id } }
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
    new: true,
  }

  const query = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    where: whereToUse,
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
