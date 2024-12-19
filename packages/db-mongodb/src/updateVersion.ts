import type { QueryOptions } from 'mongoose'

import { buildVersionCollectionFields, type PayloadRequest, type UpdateVersion } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'
import { withSession } from './withSession.js'

export const updateVersion: UpdateVersion = async function updateVersion(
  this: MongooseAdapter,
  {
    id,
    collection,
    locale,
    options: optionsArgs = {},
    req = {} as PayloadRequest,
    select,
    versionData,
    where,
  },
) {
  const VersionModel = this.versions[collection]
  const whereToUse = where || { id: { equals: id } }
  const fields = buildVersionCollectionFields(
    this.payload.config,
    this.payload.collections[collection].config,
  )

  const options: QueryOptions = {
    ...optionsArgs,
    ...(await withSession(this, req)),
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: buildVersionCollectionFields(
        this.payload.config,
        this.payload.collections[collection].config,
        true,
      ),
      select,
    }),
  }

  const query = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    session: options.session,
    where: whereToUse,
  })

  const sanitizedData = sanitizeRelationshipIDs({
    config: this.payload.config,
    data: versionData,
    fields,
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
