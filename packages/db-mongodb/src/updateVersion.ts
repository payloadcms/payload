import type { MongooseUpdateQueryOptions, UpdateQuery } from 'mongoose'

import { buildVersionCollectionFields, type UpdateVersion } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const updateVersion: UpdateVersion = async function updateVersion(
  this: MongooseAdapter,
  {
    id,
    collection: collectionSlug,
    locale,
    options: optionsArgs = {},
    req,
    returning,
    select,
    versionData,
    where,
  },
) {
  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })

  const whereToUse = where || { id: { equals: id } }
  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig)

  const flattenedFields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const query = await buildQuery({
    adapter: this,
    fields: flattenedFields,
    locale,
    where: whereToUse,
  })

  let updateData: UpdateQuery<any> = versionData

  const $inc: Record<string, number> = {}
  const $push: Record<string, { $each: any[] } | any> = {}
  const $addToSet: Record<string, { $each: any[] } | any> = {}
  const $pull: Record<string, { $in: any[] } | any> = {}

  transform({
    $addToSet,
    $inc,
    $pull,
    $push,
    adapter: this,
    data: versionData,
    fields,
    operation: 'write',
  })

  const updateOps: UpdateQuery<any> = {}

  if (Object.keys($inc).length) {
    updateOps.$inc = $inc
  }
  if (Object.keys($push).length) {
    updateOps.$push = $push
  }
  if (Object.keys($addToSet).length) {
    updateOps.$addToSet = $addToSet
  }
  if (Object.keys($pull).length) {
    updateOps.$pull = $pull
  }
  if (Object.keys(updateOps).length) {
    updateOps.$set = updateData
    updateData = updateOps
  }

  const options: MongooseUpdateQueryOptions = {
    ...optionsArgs,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: flattenedFields,
      select,
    }),
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
  }

  let result

  try {
    if (returning === false) {
      await Model.updateOne(query, updateData, options)
    } else {
      result = await Model.findOneAndUpdate(query, updateData, options)
    }
  } catch (error) {
    handleError({ collection: collectionSlug, error, req })
  }

  if (returning === false) {
    return null
  }

  if (!result) {
    return null
  }

  transform({ adapter: this, data: result, fields, operation: 'read' })

  return result
}
