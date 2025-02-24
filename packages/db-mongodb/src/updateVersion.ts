import type { QueryOptions } from 'mongoose'

import { buildVersionCollectionFields, type UpdateVersion } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const updateVersion: UpdateVersion = async function updateVersion(
  this: MongooseAdapter,
  { id, collection, locale, options: optionsArgs = {}, req, select, versionData, where },
) {
  const VersionModel = this.versions[collection]
  const whereToUse = where || { id: { equals: id } }
  const fields = buildVersionCollectionFields(
    this.payload.config,
    this.payload.collections[collection].config,
  )

  const flattenedFields = buildVersionCollectionFields(
    this.payload.config,
    this.payload.collections[collection].config,
    true,
  )

  const options: QueryOptions = {
    ...optionsArgs,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    fields: flattenedFields,
    locale,
    where: whereToUse,
  })

  transform({ adapter: this, data: versionData, fields, operation: 'write' })

  const doc = await VersionModel.findOneAndUpdate(query, versionData, options)

  if (!doc) {
    return null
  }

  transform({ adapter: this, data: doc, fields, operation: 'write' })

  return doc
}
