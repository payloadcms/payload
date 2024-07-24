import type { UpdateVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'
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

  let doc = await VersionModel.findOneAndUpdate(query, versionData, options)

  const verificationToken = doc._verificationToken

  doc = this.jsonParse ? JSON.parse(JSON.stringify(doc)) : doc

  if (verificationToken) {
    doc._verificationToken = verificationToken
  }
  return sanitizeInternalFields(doc)
}
