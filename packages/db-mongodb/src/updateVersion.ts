import { buildVersionCollectionFields, type PayloadRequest, type UpdateVersion } from 'payload'

import type { MongooseAdapter } from './index.js'

import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'
import { withSession } from './withSession.js'

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

  const sanitizedData = sanitizeRelationshipIDs({
    config: this.payload.config,
    data: versionData,
    fields: buildVersionCollectionFields(
      this.payload.config,
      this.payload.collections[collection].config,
    ),
  })

  const doc = await VersionModel.findOneAndUpdate(query, sanitizedData, options)

  const result = JSON.parse(JSON.stringify(doc))

  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id
  if (verificationToken) {
    result._verificationToken = verificationToken
  }
  return result
}
