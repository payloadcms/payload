import type { UpdateGlobalVersionArgs } from 'payload/database'
import type { PayloadRequest, TypeWithID } from 'payload/types'

import type { MongooseAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'
import { withSession } from './withSession'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: MongooseAdapter,
  {
    id,
    global,
    locale,
    req = {} as PayloadRequest,
    versionData,
    where,
  }: UpdateGlobalVersionArgs<T>,
) {
  const VersionModel = this.versions[global]
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

  let doc = await VersionModel.findOneAndUpdate(query, versionData, options)

  doc = this.jsonParse ? JSON.parse(JSON.stringify(doc)) : doc

  const verificationToken = doc._verificationToken

  if (verificationToken) {
    doc._verificationToken = verificationToken
  }
  return sanitizeInternalFields(doc)
}
